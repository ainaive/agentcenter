"use server";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  extensions,
  extensionVersions,
  extensionTags,
  files,
} from "@/lib/db/schema";
import { submit, VersionStateError } from "@/lib/extensions/state";
import { ManifestFormSchema, type ManifestFormValues } from "@/lib/validators/manifest";

import { extractScanReason } from "@/lib/publish/scan-report";

import {
  classifyDraftError,
  devErrorDetail,
  pgConstraint,
  pgErrorCode,
} from "./publish-errors";

const DEFAULT_ORG_ID = "default";

// Coerce empty / missing optional strings to `null`. We can't use `?? null`
// (it keeps `""`, which then FK-violates against `departments.id`) and we
// avoid `|| null` because it would also drop a legitimate `"0"`.
function emptyToNull(v: string | undefined | null): string | null {
  return v == null || v === "" ? null : v;
}

export type CreateDraftResult =
  | { ok: true; extensionId: string; versionId: string }
  | { ok: false; error: string; detail?: string };

export async function createDraftExtension(
  raw: ManifestFormValues,
): Promise<CreateDraftResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = ManifestFormSchema.safeParse(raw);
  if (!parsed.success) {
    // Return a stable error code (so the UI can localize it) and put the
    // human-readable Zod messages in `detail` so the user can see *what*
    // failed even outside development.
    return {
      ok: false,
      error: "invalid_input",
      detail: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const data = parsed.data;

  const extensionId = crypto.randomUUID();
  const versionId = crypto.randomUUID();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(extensions).values({
        id: extensionId,
        slug: data.slug,
        name: data.name,
        nameZh: emptyToNull(data.nameZh),
        tagline: emptyToNull(data.tagline),
        description: emptyToNull(data.description),
        descriptionZh: emptyToNull(data.descriptionZh),
        category: data.category,
        scope: data.scope,
        funcCat: data.funcCat,
        subCat: data.subCat,
        l2: emptyToNull(data.l2),
        // Empty strings are FK violations against departments.id — coerce to null.
        deptId: emptyToNull(data.deptId),
        homepageUrl: emptyToNull(data.homepageUrl),
        repoUrl: emptyToNull(data.repoUrl),
        licenseSpdx: emptyToNull(data.licenseSpdx),
        publisherUserId: session.user.id,
        ownerOrgId: DEFAULT_ORG_ID,
        visibility: "draft",
      });

      await tx.insert(extensionVersions).values({
        id: versionId,
        extensionId,
        version: data.version,
        status: "pending",
      });

      if (data.tagIds.length > 0) {
        await tx.insert(extensionTags).values(
          data.tagIds.map((tagId) => ({ extensionId, tagId })),
        );
      }
    });
  } catch (err) {
    const code = classifyDraftError(err);
    console.error("[publish] createDraftExtension failed", {
      code,
      pgCode: pgErrorCode(err),
      constraint: pgConstraint(err),
      slug: data.slug,
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: code, detail: devErrorDetail(err) };
  }

  return { ok: true, extensionId, versionId };
}

export type AttachFileResult =
  | { ok: true }
  | { ok: false; error: string; detail?: string };

export async function attachFile(
  versionId: string,
  r2Key: string,
  size: number,
  checksumSha256: string,
): Promise<AttachFileResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "unauthenticated" };

  const fileId = crypto.randomUUID();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(files).values({
        id: fileId,
        r2Key,
        size: BigInt(size),
        checksumSha256,
        mimeType: "application/zip",
        scanStatus: "pending",
      });
      await tx
        .update(extensionVersions)
        .set({ bundleFileId: fileId })
        .where(eq(extensionVersions.id, versionId));
    });
  } catch (err) {
    console.error("[publish] attachFile failed", {
      pgCode: pgErrorCode(err),
      constraint: pgConstraint(err),
      versionId,
      r2Key,
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: "db_error", detail: devErrorDetail(err) };
  }

  return { ok: true };
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string; detail?: string };

export async function submitForReview(versionId: string): Promise<SubmitResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "unauthenticated" };

  // Load bundleFileId needed by the scan job
  const [version] = await db
    .select({ bundleFileId: extensionVersions.bundleFileId })
    .from(extensionVersions)
    .where(eq(extensionVersions.id, versionId))
    .limit(1);

  if (!version?.bundleFileId) return { ok: false, error: "no_bundle" };

  try {
    await submit(versionId);
  } catch (err) {
    console.error("[publish] submitForReview failed", {
      pgCode: pgErrorCode(err),
      versionId,
      message: err instanceof Error ? err.message : String(err),
    });
    // The state machine refused the transition — the version isn't in a
    // submittable state (already reviewed/rejected, or the row vanished).
    // This is not a generic DB error and shouldn't be reported as one.
    if (err instanceof VersionStateError) {
      return {
        ok: false,
        error: "version_not_submittable",
        detail: devErrorDetail(err),
      };
    }
    return { ok: false, error: "db_error", detail: devErrorDetail(err) };
  }

  // Queue the scan job. If this fails (e.g. INNGEST_EVENT_KEY missing,
  // Inngest unreachable), roll the version status back to `pending` so it
  // doesn't sit stuck in `scanning` with no scan ever happening.
  try {
    const { inngest } = await import("@/lib/jobs/client");
    await inngest.send({
      name: "extension/scan.requested",
      data: { versionId, fileId: version.bundleFileId },
    });
  } catch (err) {
    console.error("[publish] inngest.send failed", err);
    try {
      await db
        .update(extensionVersions)
        .set({ status: "pending" })
        .where(
          and(
            eq(extensionVersions.id, versionId),
            eq(extensionVersions.status, "scanning"),
          ),
        );
    } catch (rollbackErr) {
      console.error(
        "[publish] failed to roll back scanning -> pending after inngest error",
        rollbackErr,
      );
    }
    return {
      ok: false,
      error: "scan_queue_unavailable",
      detail: devErrorDetail(err),
    };
  }

  return { ok: true };
}

export async function getMyExtensions(userId: string) {
  // Pull the latest version per extension alongside the extension row so the
  // dashboard can show "where am I in the wizard" (e.g. needs upload vs.
  // submitted, awaiting scan) — visibility alone hides that info. Also
  // joins the bundle file via `bundleFileId` (logical reference, no FK)
  // so the dashboard can surface the scan rejection reason inline for
  // rejected versions without an extra round-trip.
  const rows = await db
    .select({
      id: extensions.id,
      slug: extensions.slug,
      name: extensions.name,
      category: extensions.category,
      visibility: extensions.visibility,
      createdAt: extensions.createdAt,
      latestVersionId: extensionVersions.id,
      latestVersion: extensionVersions.version,
      latestStatus: extensionVersions.status,
      latestBundleFileId: extensionVersions.bundleFileId,
      latestScanReport: files.scanReport,
    })
    .from(extensions)
    .leftJoin(
      extensionVersions,
      eq(extensionVersions.extensionId, extensions.id),
    )
    .leftJoin(files, eq(files.id, extensionVersions.bundleFileId))
    .where(eq(extensions.publisherUserId, userId))
    .orderBy(desc(extensions.createdAt), desc(extensionVersions.createdAt));

  // Collapse to one row per extension (latest version first thanks to the
  // ORDER BY). If we someday support multiple in-flight versions per
  // extension, this becomes a `DISTINCT ON` query.
  const byExtension = new Map<
    string,
    (typeof rows)[number] & { latestScanReason: string | null }
  >();
  for (const row of rows) {
    if (!byExtension.has(row.id)) {
      byExtension.set(row.id, {
        ...row,
        latestScanReason: extractScanReason(row.latestScanReport),
      });
    }
  }
  return Array.from(byExtension.values());
}

export type UpdateDraftResult =
  | { ok: true }
  | { ok: false; error: string; detail?: string };

// Update an in-flight draft's manifest fields. Owner-checked. Refuses to
// touch anything once the version has left `pending` — by then the
// scanner has likely picked it up and re-running scans is the worker's
// job, not the wizard's. `slug` and `version` can technically be
// changed, but the wizard locks them in resume mode because they form
// the R2 bundle key — letting them shift orphans the uploaded bundle.
export async function updateDraftExtension(
  extensionId: string,
  raw: ManifestFormValues,
): Promise<UpdateDraftResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = ManifestFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      detail: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const data = parsed.data;

  // Resolve the latest version + verify ownership + state in one read.
  const [row] = await db
    .select({
      publisherUserId: extensions.publisherUserId,
      versionId: extensionVersions.id,
      versionStatus: extensionVersions.status,
    })
    .from(extensions)
    .leftJoin(
      extensionVersions,
      eq(extensionVersions.extensionId, extensions.id),
    )
    .where(eq(extensions.id, extensionId))
    .orderBy(desc(extensionVersions.createdAt))
    .limit(1);

  if (!row || !row.versionId) {
    return { ok: false, error: "not_found" };
  }
  if (row.publisherUserId !== session.user.id) {
    return { ok: false, error: "not_found" };
  }
  if (row.versionStatus !== "pending") {
    return { ok: false, error: "version_not_editable" };
  }

  try {
    await db.transaction(async (tx) => {
      // SECURITY: `slug` and `version` are deliberately NOT written from
      // `data`. The wizard renders those inputs as `readOnly` in resume
      // mode, but `readOnly` is a client-side hint only — a caller
      // hitting this action directly (devtools, scripted POST) could
      // otherwise change the slug or version, which would orphan the
      // already-uploaded R2 bundle at its old `<slug>/<version>` key.
      // Rejecting mismatches outright would also work; silently keeping
      // the stored values is the smaller-surface choice and keeps the
      // resume flow forgiving when the form round-trips its locked
      // values back unchanged.
      await tx
        .update(extensions)
        .set({
          name: data.name,
          nameZh: emptyToNull(data.nameZh),
          tagline: emptyToNull(data.tagline),
          description: emptyToNull(data.description),
          descriptionZh: emptyToNull(data.descriptionZh),
          category: data.category,
          scope: data.scope,
          funcCat: data.funcCat,
          subCat: data.subCat,
          l2: emptyToNull(data.l2),
          deptId: emptyToNull(data.deptId),
          homepageUrl: emptyToNull(data.homepageUrl),
          repoUrl: emptyToNull(data.repoUrl),
          licenseSpdx: emptyToNull(data.licenseSpdx),
          updatedAt: new Date(),
        })
        .where(eq(extensions.id, extensionId));

      // Tags: replace wholesale. The set is capped at 8 by the form
      // schema, so a delete-then-insert is cheaper and clearer than
      // computing a diff.
      await tx
        .delete(extensionTags)
        .where(eq(extensionTags.extensionId, extensionId));
      if (data.tagIds.length > 0) {
        await tx
          .insert(extensionTags)
          .values(data.tagIds.map((tagId) => ({ extensionId, tagId })));
      }
    });
  } catch (err) {
    const code = classifyDraftError(err);
    console.error("[publish] updateDraftExtension failed", {
      code,
      pgCode: pgErrorCode(err),
      constraint: pgConstraint(err),
      extensionId,
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: code, detail: devErrorDetail(err) };
  }

  return { ok: true };
}

export type DiscardDraftResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "unauthenticated" | "not_discardable" };

// Permanently delete a draft extension. Owner-checked. Only allowed while
// visibility === "draft" — published or archived extensions are not
// throwaway. Cascading FK constraints clean up extension_versions,
// extension_tags, and (via versions) any associated files row.
//
// R2 bundle objects are intentionally left in place; orphan cleanup is
// the bucket lifecycle's job, not the user's.
export async function discardDraft(
  extensionId: string,
): Promise<DiscardDraftResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "unauthenticated" };

  const [row] = await db
    .select({
      publisherUserId: extensions.publisherUserId,
      visibility: extensions.visibility,
    })
    .from(extensions)
    .where(eq(extensions.id, extensionId))
    .limit(1);

  // Treat not-found and not-owner identically so the contract can't be
  // used to probe whether an extension exists for someone else.
  if (!row || row.publisherUserId !== session.user.id) {
    return { ok: false, error: "not_found" };
  }
  if (row.visibility !== "draft") {
    return { ok: false, error: "not_discardable" };
  }

  await db.delete(extensions).where(eq(extensions.id, extensionId));
  return { ok: true };
}

export async function getVersionStatus(versionId: string) {
  const [row] = await db
    .select({ status: extensionVersions.status })
    .from(extensionVersions)
    .where(eq(extensionVersions.id, versionId))
    .limit(1);
  return row?.status ?? null;
}

export type DraftSnapshot = {
  extensionId: string;
  versionId: string;
  slug: string;
  version: string;
  name: string;
  category: string;
  visibility: string;
  versionStatus: string;
  bundleUploaded: boolean;
  // Full manifest values for the form pre-fill in edit mode. Loaded by
  // `getDraft` regardless of state since the dashboard never shows them
  // — only the resume page reads this. Tag IDs come from a sibling
  // query against `extension_tags`.
  formValues: ManifestFormValues;
};

export type GetDraftResult =
  | { ok: true; draft: DraftSnapshot }
  // Deliberately collapse non-owner to `not_found` so the public contract
  // can't be used to probe whether an extension exists for someone else's
  // account.
  | { ok: false; error: "not_found" | "unauthenticated" };

// Load an extension + its latest version for the publish wizard's resume
// flow. Owner-checked: callers cannot read another user's draft. Returns
// just enough state for the wizard to land on the right step and render
// a read-only manifest summary.
export async function getDraft(extensionId: string): Promise<GetDraftResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "unauthenticated" };

  const [row] = await db
    .select({
      extensionId: extensions.id,
      publisherUserId: extensions.publisherUserId,
      slug: extensions.slug,
      name: extensions.name,
      nameZh: extensions.nameZh,
      tagline: extensions.tagline,
      description: extensions.description,
      descriptionZh: extensions.descriptionZh,
      category: extensions.category,
      scope: extensions.scope,
      funcCat: extensions.funcCat,
      subCat: extensions.subCat,
      l2: extensions.l2,
      deptId: extensions.deptId,
      homepageUrl: extensions.homepageUrl,
      repoUrl: extensions.repoUrl,
      licenseSpdx: extensions.licenseSpdx,
      visibility: extensions.visibility,
      versionId: extensionVersions.id,
      version: extensionVersions.version,
      versionStatus: extensionVersions.status,
      bundleFileId: extensionVersions.bundleFileId,
    })
    .from(extensions)
    .leftJoin(
      extensionVersions,
      eq(extensionVersions.extensionId, extensions.id),
    )
    .where(eq(extensions.id, extensionId))
    .orderBy(desc(extensionVersions.createdAt))
    .limit(1);

  if (!row || !row.versionId || !row.version || !row.versionStatus) {
    return { ok: false, error: "not_found" };
  }
  if (row.publisherUserId !== session.user.id) {
    // Same shape as a missing row; see comment on `GetDraftResult`.
    return { ok: false, error: "not_found" };
  }

  // Tag IDs in a separate, very small query — extensions cap tags at 8
  // per the form schema, so this is at most 8 rows.
  const tagRows = await db
    .select({ tagId: extensionTags.tagId })
    .from(extensionTags)
    .where(eq(extensionTags.extensionId, row.extensionId));
  const tagIds = tagRows.map((r) => r.tagId);

  return {
    ok: true,
    draft: {
      extensionId: row.extensionId,
      versionId: row.versionId,
      slug: row.slug,
      version: row.version,
      name: row.name,
      category: row.category,
      visibility: row.visibility,
      versionStatus: row.versionStatus,
      bundleUploaded: row.bundleFileId !== null,
      formValues: {
        slug: row.slug,
        name: row.name,
        nameZh: row.nameZh ?? "",
        version: row.version,
        category: row.category as ManifestFormValues["category"],
        scope: row.scope as ManifestFormValues["scope"],
        funcCat: row.funcCat as ManifestFormValues["funcCat"],
        subCat: row.subCat,
        l2: row.l2 ?? "",
        deptId: row.deptId ?? "",
        tagIds,
        description: row.description ?? "",
        descriptionZh: row.descriptionZh ?? "",
        tagline: row.tagline ?? "",
        homepageUrl: row.homepageUrl ?? "",
        repoUrl: row.repoUrl ?? "",
        licenseSpdx: row.licenseSpdx ?? "",
      },
    },
  };
}
