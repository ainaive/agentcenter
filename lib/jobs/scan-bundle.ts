import { eq } from "drizzle-orm";
import { unzipSync } from "fflate";
import { parse } from "smol-toml";
import { z } from "zod";

import { inngest } from "./client";
import { db } from "@/lib/db/client";
import { extensionVersions, files } from "@/lib/db/schema";
import { generatePresignedGetUrl } from "@/lib/storage/r2";

const BundleManifestSchema = z.object({
  extension: z.object({
    slug: z.string().min(1).max(64),
    name: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    category: z.enum(["skills", "mcp", "slash", "plugins"]),
    scope: z.enum(["personal", "org", "enterprise"]),
    description: z.string().max(280),
  }),
  categorization: z.object({
    funcCat: z.enum(["workTask", "business", "tools"]),
    subCat: z.string().min(1),
    l2: z.string().optional(),
  }),
});

export const scanBundle = inngest.createFunction(
  {
    id: "scan-bundle",
    triggers: [{ event: "extension/scan.requested" }],
  },
  async ({ event, step }) => {
    const { versionId, fileId } = event.data as { versionId: string; fileId: string };

    // Steps 1–4: fetch, download, checksum, and manifest parsing in one step
    // to avoid Buffer serialization issues across step boundaries.
    const scanResult = await step.run("download-and-scan", async () => {
      const [fileRow] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
      if (!fileRow) return { ok: false as const, reason: "file_not_found", checksum: "" };

      const signedUrl = await generatePresignedGetUrl(fileRow.r2Key, 120);
      const res = await fetch(signedUrl);
      if (!res.ok) throw new Error(`R2 fetch failed: ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);

      // SHA-256 checksum
      const hashBuf = await crypto.subtle.digest("SHA-256", uint8);
      const checksum = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Parse manifest.toml
      const entries = unzipSync(uint8);
      const manifestEntry = entries["manifest.toml"];
      if (!manifestEntry) return { ok: false as const, reason: "missing_manifest", checksum };

      let raw: unknown;
      try {
        raw = parse(new TextDecoder().decode(manifestEntry));
      } catch {
        return { ok: false as const, reason: "invalid_toml", checksum };
      }

      const parsed = BundleManifestSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false as const, reason: parsed.error.issues[0]?.message ?? "schema_error", checksum };
      }

      return { ok: true as const, checksum };
    });

    const scanReport = {
      manifestOk: scanResult.ok,
      reason: scanResult.ok ? null : scanResult.reason,
      checksum: scanResult.checksum,
      scannedAt: new Date().toISOString(),
    };

    if (!scanResult.ok) {
      await step.run("mark-rejected", async () => {
        await db.transaction(async (tx) => {
          await tx.update(files).set({ scanStatus: "flagged", scanReport }).where(eq(files.id, fileId));
          await tx.update(extensionVersions).set({ status: "rejected" }).where(eq(extensionVersions.id, versionId));
        });
      });
      return { ok: false, reason: scanResult.reason };
    }

    await step.run("mark-clean", async () => {
      await db.transaction(async (tx) => {
        await tx
          .update(files)
          .set({ scanStatus: "clean", scanReport, checksumSha256: scanResult.checksum })
          .where(eq(files.id, fileId));
        await tx.update(extensionVersions).set({ status: "ready" }).where(eq(extensionVersions.id, versionId));
      });
    });

    await step.sendEvent("enqueue-index", {
      name: "extension/index.requested",
      data: { versionId },
    });

    return { ok: true, checksum: scanResult.checksum };
  },
);
