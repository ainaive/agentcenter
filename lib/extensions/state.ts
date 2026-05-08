import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { extensions, extensionVersions, files } from "@/lib/db/schema";

export type ScanResult =
  | { ok: true; checksum: string; scanReport: unknown }
  | { ok: false; reason: string; scanReport: unknown };

export class VersionStateError extends Error {
  readonly code: "version_not_found";
  constructor(code: "version_not_found") {
    super(code);
    this.code = code;
    this.name = "VersionStateError";
  }
}

// Move a version into "scanning". Caller is responsible for kicking off
// the scan job (Inngest event) — this module owns DB state only.
export async function submit(versionId: string): Promise<void> {
  await db
    .update(extensionVersions)
    .set({ status: "scanning" })
    .where(eq(extensionVersions.id, versionId));
}

// Apply the outcome of a bundle scan: file scan flag + version status.
// Both writes commit together.
export async function recordScanResult(
  versionId: string,
  fileId: string,
  result: ScanResult,
): Promise<void> {
  await db.transaction(async (tx) => {
    if (result.ok) {
      await tx
        .update(files)
        .set({
          scanStatus: "clean",
          scanReport: result.scanReport,
          checksumSha256: result.checksum,
        })
        .where(eq(files.id, fileId));
      await tx
        .update(extensionVersions)
        .set({ status: "ready" })
        .where(eq(extensionVersions.id, versionId));
    } else {
      await tx
        .update(files)
        .set({ scanStatus: "flagged", scanReport: result.scanReport })
        .where(eq(files.id, fileId));
      await tx
        .update(extensionVersions)
        .set({ status: "rejected" })
        .where(eq(extensionVersions.id, versionId));
    }
  });
}

// Flip the version + its parent extension to published. Returns the
// extension id so the caller can revalidate caches and dispatch
// downstream events (those are orchestration, not state).
//
// Note: extensions.search_vector is a GENERATED column maintained by
// Postgres; this module never writes to it.
export async function publishVersion(
  versionId: string,
): Promise<{ extensionId: string }> {
  const [row] = await db
    .select({ extensionId: extensionVersions.extensionId })
    .from(extensionVersions)
    .where(eq(extensionVersions.id, versionId))
    .limit(1);

  if (!row) throw new VersionStateError("version_not_found");
  const { extensionId } = row;
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(extensions)
      .set({ visibility: "published", publishedAt: now })
      .where(eq(extensions.id, extensionId));
    await tx
      .update(extensionVersions)
      .set({ publishedAt: now })
      .where(eq(extensionVersions.id, versionId));
  });

  return { extensionId };
}
