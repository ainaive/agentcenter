import { NextRequest } from "next/server";

import { jsonError } from "@/lib/api/auth";
import { listExtensions, countFilteredExtensions } from "@/lib/db/queries/extensions";
import { parseFilters } from "@/lib/validators/filters";

export const runtime = "nodejs";

// GET /api/v1/extensions
// Query params: q, category, tags, sort, page
// Returns a paginated list of published extensions for the CLI.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawParams: Record<string, string> = {};
  sp.forEach((v, k) => { rawParams[k] = v; });

  const filters = parseFilters({ ...rawParams, dept: "__all" });

  try {
    const [items, total] = await Promise.all([
      listExtensions(filters),
      countFilteredExtensions(filters),
    ]);

    return Response.json(
      {
        items: items.map((ext) => ({
          slug: ext.slug,
          name: ext.name,
          nameZh: ext.nameZh,
          category: ext.category,
          scope: ext.scope,
          badge: ext.badge,
          description: ext.description,
          descriptionZh: ext.descriptionZh,
          tags: ext.tagIds,
          funcCat: ext.funcCat,
          subCat: ext.subCat,
          l2: ext.l2,
          downloadsCount: ext.downloadsCount,
          starsAvg: Number(ext.starsAvg).toFixed(1),
        })),
        total,
        page: filters.page,
        pageSize: 24,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return jsonError("Failed to fetch extensions.", 500, "server_error");
  }
}
