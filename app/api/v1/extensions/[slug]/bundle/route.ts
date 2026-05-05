import { NextRequest } from "next/server";

import { jsonError } from "@/lib/api/auth";
import { getExtensionBySlug } from "@/lib/db/queries/extensions";

export const runtime = "nodejs";

// GET /api/v1/extensions/:slug/bundle
// Redirects to a signed R2 URL for the extension bundle download.
// Phase 10 (upload wizard) populates the bundles; until then returns 503.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const ext = await getExtensionBySlug(slug);
  if (!ext) return jsonError("Extension not found.", 404, "not_found");

  // TODO(phase-10): look up the latest extension_versions record, call
  //   getSignedBundleUrl(fileId) from lib/storage/r2.ts, then:
  //   return Response.redirect(signedUrl, 302);
  return jsonError(
    "Bundle storage not yet configured. Upload wizard ships in Phase 10.",
    503,
    "bundle_unavailable",
  );
}
