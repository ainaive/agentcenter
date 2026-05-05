import { and, desc, eq, ilike, inArray, like, or, type SQL, sql } from "drizzle-orm";

import { MY_DEPT_ID } from "@/lib/data/departments"; // fallback for unauthenticated users
import { db } from "@/lib/db/client";
import { extensions, extensionTags } from "@/lib/db/schema";
import type { Filters } from "@/lib/validators/filters";

// Special token in the dept URL param meaning "show all departments".
const ALL_DEPTS = "__all";

/**
 * Compose a SQL WHERE expression from typed filters. Returns `undefined` when
 * no clauses are active so callers can omit `.where()` entirely.
 */
export function buildExtensionWhere(
  filters: Filters,
  fallbackDeptId?: string,
): SQL | undefined {
  const clauses = [
    // Always limit to published extensions.
    eq(extensions.visibility, "published"),

    filters.category ? eq(extensions.category, filters.category) : undefined,
    filters.scope ? eq(extensions.scope, filters.scope) : undefined,
    filters.funcCat ? eq(extensions.funcCat, filters.funcCat) : undefined,
    filters.subCat ? eq(extensions.subCat, filters.subCat) : undefined,
    filters.l2 ? eq(extensions.l2, filters.l2) : undefined,

    // Dotted-path descendant filter — uses idx_ext_dept_path (text_pattern_ops).
    // When no dept param is provided, fall back to the authenticated user's
    // defaultDeptId (passed in from the page via getSession), then to MY_DEPT_ID
    // for unauthenticated visitors.
    (() => {
      const dept = filters.dept ?? fallbackDeptId ?? MY_DEPT_ID;
      if (dept === ALL_DEPTS) return undefined;
      return or(
        eq(extensions.deptId, dept),
        like(extensions.deptId, `${dept}.%`),
      );
    })(),

    // Filter chips
    filters.filter === "trending"
      ? sql`${extensions.downloadsCount} > 50000`
      : undefined,
    filters.filter === "new" ? eq(extensions.badge, "new") : undefined,
    filters.filter === "official"
      ? eq(extensions.badge, "official")
      : undefined,
    filters.filter === "free"
      ? sql`${extensions.licenseSpdx} IS NOT NULL`
      : undefined,

    // Search — naive ILIKE on name/nameZh/description for now. Phase 12 swaps
    // to tsvector @@ websearch_to_tsquery + pg_trgm for fuzzy + CJK matches.
    filters.q
      ? or(
          ilike(extensions.name, `%${filters.q}%`),
          ilike(extensions.nameZh, `%${filters.q}%`),
          ilike(extensions.description, `%${filters.q}%`),
        )
      : undefined,

    // Tag filter via aggregating subquery — `any` matches if at least one tag
    // overlaps; `all` requires every selected tag to be present.
    filters.tags && filters.tags.length > 0
      ? inArray(
          extensions.id,
          db
            .select({ id: extensionTags.extensionId })
            .from(extensionTags)
            .where(inArray(extensionTags.tagId, filters.tags))
            .groupBy(extensionTags.extensionId)
            .having(
              filters.tagMatch === "all"
                ? sql`count(*) = ${filters.tags.length}`
                : sql`count(*) >= 1`,
            ),
        )
      : undefined,
  ].filter((c): c is SQL => Boolean(c));

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export function buildExtensionOrder(sort: Filters["sort"]) {
  switch (sort) {
    case "stars":
      return [desc(extensions.starsAvg), desc(extensions.downloadsCount)];
    case "recent":
      return [desc(extensions.publishedAt), desc(extensions.createdAt)];
    case "downloads":
    default:
      return [desc(extensions.downloadsCount)];
  }
}
