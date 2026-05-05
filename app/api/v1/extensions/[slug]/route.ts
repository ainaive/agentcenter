import { NextRequest } from "next/server";

import { jsonError } from "@/lib/api/auth";
import { getExtensionBySlug } from "@/lib/db/queries/extensions";

export const runtime = "nodejs";

// GET /api/v1/extensions/:slug
// Returns full extension metadata needed by the CLI to install.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const ext = await getExtensionBySlug(slug);
    if (!ext) return jsonError("Extension not found.", 404, "not_found");

    return Response.json(
      {
        slug: ext.slug,
        name: ext.name,
        nameZh: ext.nameZh,
        category: ext.category,
        scope: ext.scope,
        badge: ext.badge,
        tagline: ext.tagline,
        description: ext.description,
        descriptionZh: ext.descriptionZh,
        tags: ext.tagIds,
        funcCat: ext.funcCat,
        subCat: ext.subCat,
        l2: ext.l2,
        license: ext.licenseSpdx,
        homepageUrl: ext.homepageUrl,
        repoUrl: ext.repoUrl,
        compatibilityJson: ext.compatibilityJson,
        downloadsCount: ext.downloadsCount,
        starsAvg: Number(ext.starsAvg).toFixed(1),
        ratingsCount: ext.ratingsCount,
        publishedAt: ext.publishedAt,
        // Latest published version. Full version history: GET /api/v1/extensions/:slug/versions (future)
        version: "latest",
        // Bundle download: GET /api/v1/extensions/:slug/bundle → 302 to signed R2 URL
        bundleUrl: `/api/v1/extensions/${ext.slug}/bundle`,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return jsonError("Failed to fetch extension.", 500, "server_error");
  }
}
