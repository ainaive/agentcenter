import { z } from "zod";

const CATEGORIES = ["skills", "mcp", "slash", "plugins"] as const;
const SCOPES = ["personal", "org", "enterprise"] as const;
const FUNC_CATS = ["workTask", "business", "tools"] as const;
const FILTER_CHIPS = ["all", "trending", "new", "official", "free"] as const;
const SORTS = ["downloads", "stars", "recent"] as const;
const TAG_MATCHES = ["any", "all"] as const;

export const PAGE_SIZE = 24;

export const filtersSchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  category: z.enum(CATEGORIES).optional(),
  scope: z.enum(SCOPES).optional(),
  funcCat: z.enum(FUNC_CATS).optional(),
  subCat: z.string().trim().min(1).max(40).optional(),
  l2: z.string().trim().min(1).max(40).optional(),
  // Department id (dotted-path) or the literal "__all" to disable the filter.
  dept: z.string().trim().min(1).max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(16).optional(),
  tagMatch: z.enum(TAG_MATCHES).optional(),
  filter: z.enum(FILTER_CHIPS).optional(),
  sort: z.enum(SORTS).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
});

export type Filters = z.infer<typeof filtersSchema>;

/**
 * Parse Next.js searchParams into typed Filters. Invalid input is dropped,
 * so a malformed URL silently falls back to "no filter" rather than 500ing.
 */
export function parseFilters(
  input: Record<string, string | string[] | undefined>,
): Filters {
  const tags = input.tags;
  const normalized = {
    ...input,
    tags:
      tags === undefined
        ? undefined
        : Array.isArray(tags)
          ? tags
          : tags.split(",").filter(Boolean),
  };
  const parsed = filtersSchema.safeParse(normalized);
  return parsed.success ? parsed.data : {};
}

export function pageOffset(page: number | undefined) {
  return ((page ?? 1) - 1) * PAGE_SIZE;
}
