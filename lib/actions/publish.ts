"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  extensions,
  extensionVersions,
  extensionTags,
  files,
} from "@/lib/db/schema";
import { submit } from "@/lib/extensions/state";
import { ManifestFormSchema, type ManifestFormValues } from "@/lib/validators/manifest";

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
  return db
    .select({
      id: extensions.id,
      slug: extensions.slug,
      name: extensions.name,
      category: extensions.category,
      visibility: extensions.visibility,
      createdAt: extensions.createdAt,
    })
    .from(extensions)
    .where(eq(extensions.publisherUserId, userId))
    .orderBy(extensions.createdAt);
}

export async function getVersionStatus(versionId: string) {
  const [row] = await db
    .select({ status: extensionVersions.status })
    .from(extensionVersions)
    .where(eq(extensionVersions.id, versionId))
    .limit(1);
  return row?.status ?? null;
}
