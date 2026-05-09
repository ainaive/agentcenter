"use server";

import { eq } from "drizzle-orm";
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
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
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
        nameZh: data.nameZh || null,
        tagline: data.tagline || null,
        description: data.description || null,
        descriptionZh: data.descriptionZh || null,
        category: data.category,
        scope: data.scope,
        funcCat: data.funcCat,
        subCat: data.subCat,
        l2: data.l2 || null,
        // Empty strings are FK violations against departments.id — coerce to null.
        deptId: data.deptId || null,
        homepageUrl: data.homepageUrl || null,
        repoUrl: data.repoUrl || null,
        licenseSpdx: data.licenseSpdx || null,
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

  const { inngest } = await import("@/lib/jobs/client");
  await inngest.send({
    name: "extension/scan.requested",
    data: { versionId, fileId: version.bundleFileId },
  });

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
