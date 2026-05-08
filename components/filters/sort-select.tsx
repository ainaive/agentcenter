"use client";

import { useFilters } from "@/lib/hooks/use-filters";
import type { Filters } from "@/lib/validators/filters";

const SORTS = [
  { key: "downloads", label: "Downloads" },
  { key: "stars", label: "Stars" },
  { key: "recent", label: "Recently Added" },
] as const;

export function SortSelect() {
  const { filters, update } = useFilters();
  const active = filters.sort ?? "downloads";

  return (
    <label className="text-muted-foreground flex items-center gap-2 text-[12px]">
      <span className="shrink-0 font-semibold">Sort by:</span>
      <select
        value={active}
        onChange={(e) => update({ sort: e.target.value as Filters["sort"] })}
        className="bg-muted border-input text-foreground focus-visible:border-ring focus-visible:ring-ring/30 cursor-pointer rounded-md border px-2 py-1 text-[12px] outline-none focus-visible:ring-3"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
