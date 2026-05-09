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

const DEFAULT_ORG_ID = "default";

// Postgres error codes we care about. The `code` field is set by node-postgres
// on DatabaseError instances; we narrow with `unknown` rather than importing
// pg types so this stays runtime-only.
function pgErrorCode(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

function pgConstraint(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "constraint" in err) {
    const c = (err as { constraint: unknown }).constraint;
    if (typeof c === "string") return c;
  }
  return undefined;
}

// Dev-only debug string. Returns undefined in production so we never leak
// PG codes / constraint names to end users. Format is compact so it fits
// under the friendly message in the UI.
function devErrorDetail(err: unknown): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const code = pgErrorCode(err);
  const constraint = pgConstraint(err);
  const message = err instanceof Error ? err.message : String(err);
  const parts: string[] = [];
  if (code) parts.push(`pg=${code}`);
  if (constraint) parts.push(`constraint=${constraint}`);
  parts.push(message);
  return parts.join(" · ");
}

// Map a thrown DB error to a stable error code the UI can translate.
// Codes are strings (not enums) so adding new ones doesn't require a type
// migration. Keep in sync with `publish.errors.*` in messages/{en,zh}.json.
function classifyDraftError(err: unknown): string {
  const code = pgErrorCode(err);
  const constraint = pgConstraint(err);
  if (code === "23505") return "slug_taken"; // unique_violation
  if (code === "23503") {
    // foreign_key_violation: figure out which FK failed
    if (constraint?.includes("dept")) return "invalid_dept";
    if (constraint?.includes("tag")) return "invalid_tag";
    if (constraint?.includes("org")) return "org_missing";
    return "invalid_reference";
  }
  if (code === "23502") return "missing_required"; // not_null_violation
  return "db_error";
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
