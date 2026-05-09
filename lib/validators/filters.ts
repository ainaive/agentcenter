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
  // Creator = users.id (the user who published). Schema column is named
  // publisherUserId for legacy reasons; we expose it as "creator" everywhere.
  creator: z.string().trim().min(1).max(80).optional(),
  // Publisher = organizations.id (the owning org).
  publisher: z.string().trim().min(1).max(80).optional(),
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

/**
 * Adapter from `URLSearchParams` (the runtime shape) to the `Record` shape
 * `parseFilters` consumes. Repeated keys (`?tags=a&tags=b`) accumulate into
 * an array; `serializeFilters` always emits comma-joined, but external
 * links may use the array form and the validator already handles both.
 */
export function searchParamsToInput(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    const prev = out[key];
    if (prev === undefined) {
      out[key] = value;
    } else if (Array.isArray(prev)) {
      prev.push(value);
    } else {
      out[key] = [prev, value];
    }
  }
  return out;
}

/**
 * Inverse of `parseFilters`. Encodes typed filters back into URL search
 * params using the same conventions parseFilters consumes — comma-joined
 * arrays for `tags`, omitted keys for undefined / empty values.
 */
export function serializeFilters(filters: Partial<Filters>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  return params;
}
