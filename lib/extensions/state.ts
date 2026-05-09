import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { extensions, extensionVersions, files } from "@/lib/db/schema";

export type ScanResult =
  | { ok: true; checksum: string; scanReport: unknown }
  | { ok: false; reason: string; scanReport: unknown };

// Thrown when a transition is requested against a row that is missing or
// not in the expected source state. The state machine is:
//
//   pending --submit-->   scanning --recordScanResult--> ready | rejected
//   ready   --publishVersion--> ready (publishedAt stamped)
//
// Callers should treat this as "transition refused"; idempotent retries
// (e.g. duplicate Inngest deliveries) should catch and no-op.
export class VersionStateError extends Error {
  readonly code: "version_not_found";
  constructor(code: "version_not_found") {
    super(code);
    this.code = code;
    this.name = "VersionStateError";
  }
}

// Move a version to scanning. Allowed source states are `pending` (the
// normal first submit) and `scanning` itself (an idempotent retry, e.g.
// when a previous attempt's Inngest send failed and left the row stuck —
// without this the user would have no way to recover). Versions already
// in `ready` or `rejected` reject the transition. Caller is responsible
// for kicking off the scan job (Inngest event) — this module owns DB state.
export async function submit(versionId: string): Promise<void> {
  const updated = await db
    .update(extensionVersions)
    .set({ status: "scanning" })
    .where(
      and(
        eq(extensionVersions.id, versionId),
        inArray(extensionVersions.status, ["pending", "scanning"]),
      ),
    )
    .returning({ id: extensionVersions.id });
  if (updated.length === 0) throw new VersionStateError("version_not_found");
}

// Apply the outcome of a bundle scan: file scan flag + version status.
// Both writes commit together; the version must currently be `scanning`.
//
// Auto-publish on success: extensions with `scope = "personal"` skip the
// admin-review step entirely — they go straight to `published` once their
// bundle scan is clean. Org/Enterprise drafts stay in `ready` for an
// admin to flip them via `publishVersion`.
export async function recordScanResult(
  versionId: string,
  fileId: string,
  result: ScanResult,
): Promise<void> {
  const [version] = await db
    .select({
      status: extensionVersions.status,
      extensionId: extensionVersions.extensionId,
      scope: extensions.scope,
    })
    .from(extensionVersions)
    .innerJoin(extensions, eq(extensions.id, extensionVersions.extensionId))
    .where(eq(extensionVersions.id, versionId))
    .limit(1);
  if (!version || version.status !== "scanning") {
    throw new VersionStateError("version_not_found");
  }

  await db.transaction(async (tx) => {
    if (result.ok) {
      const isPersonal = version.scope === "personal";
      const now = isPersonal ? new Date() : null;

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
        .set(
          isPersonal
            ? { status: "ready", publishedAt: now }
            : { status: "ready" },
        )
        .where(eq(extensionVersions.id, versionId));
      if (isPersonal) {
        await tx
          .update(extensions)
          .set({ visibility: "published", publishedAt: now })
          .where(eq(extensions.id, version.extensionId));
      }
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
// downstream events (those are orchestration, not state). The version
// must currently be `ready`.
//
// Note: extensions.search_vector is a GENERATED column maintained by
// Postgres; this module never writes to it.
export async function publishVersion(
  versionId: string,
): Promise<{ extensionId: string }> {
  const [row] = await db
    .select({
      extensionId: extensionVersions.extensionId,
      status: extensionVersions.status,
    })
    .from(extensionVersions)
    .where(eq(extensionVersions.id, versionId))
    .limit(1);

  if (!row || row.status !== "ready") {
    throw new VersionStateError("version_not_found");
  }

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
