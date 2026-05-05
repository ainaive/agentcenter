import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { jsonError } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import { extensionVersions, files, extensions } from "@/lib/db/schema";
import { getExtensionBySlug } from "@/lib/db/queries/extensions";
import { generatePresignedGetUrl } from "@/lib/storage/r2";

export const runtime = "nodejs";

// GET /api/v1/extensions/:slug/bundle
// Returns a 302 redirect to a signed R2 URL for the latest ready bundle.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const ext = await getExtensionBySlug(slug);
  if (!ext) return jsonError("Extension not found.", 404, "not_found");

  // Find the latest ready version with an attached file
  const [row] = await db
    .select({ r2Key: files.r2Key })
    .from(extensionVersions)
    .innerJoin(files, eq(files.id, extensionVersions.bundleFileId))
    .innerJoin(extensions, eq(extensions.id, extensionVersions.extensionId))
    .where(eq(extensions.slug, slug))
    .orderBy(extensionVersions.createdAt)
    .limit(1);

  if (!row?.r2Key) {
    return jsonError("Bundle not available yet.", 503, "bundle_unavailable");
  }

  const signedUrl = await generatePresignedGetUrl(row.r2Key);
  return Response.redirect(signedUrl, 302);
}
