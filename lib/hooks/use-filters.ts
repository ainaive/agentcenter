"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import {
  parseFilters,
  serializeFilters,
  type Filters,
} from "@/lib/validators/filters";

export type FilterUpdate = Partial<Filters>;

export interface UseFiltersResult {
  filters: Filters;
  update: (partial: FilterUpdate) => void;
  pending: boolean;
}

// Build a Record<string, string | string[]> from URLSearchParams that
// `parseFilters` knows how to consume (it splits comma-joined arrays itself).
function searchParamsToInput(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    out[key] = value;
  }
  return out;
}

/**
 * Typed filter state synced to the URL. Components read `filters` (parsed
 * via the validator, so invalid URL state silently becomes empty) and
 * write multi-key updates via `update(partial)`.
 *
 * - Setting a key to a value writes it to the URL.
 * - Setting a key to `undefined` removes it from the URL.
 * - Any update that does not include `page` resets pagination to its
 *   default (page 1) — filter changes shouldn't preserve a stale page.
 */
export function useFilters(): UseFiltersResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseFilters(searchParamsToInput(searchParams)),
    [searchParams],
  );

  function update(partial: FilterUpdate) {
    const next: FilterUpdate = { ...filters, ...partial };
    if (!("page" in partial)) {
      next.page = undefined;
    }
    const params = serializeFilters(next);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, {
        scroll: false,
      } as Parameters<typeof router.replace>[1]);
    });
  }

  return { filters, update, pending };
}
