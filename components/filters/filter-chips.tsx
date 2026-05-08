"use client";

import { useFilters } from "@/lib/hooks/use-filters";
import type { Filters } from "@/lib/validators/filters";
import { cn } from "@/lib/utils";

const CHIPS = [
  { key: "all", label: "All" },
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "official", label: "Official" },
  { key: "free", label: "Open Source" },
] as const;

export function FilterChips() {
  const { filters, update } = useFilters();
  const active = filters.filter ?? "all";

  return (
    <div className="flex flex-wrap gap-1.5">
      {CHIPS.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() =>
              update({
                filter: c.key === "all" ? undefined : (c.key as Filters["filter"]),
              })
            }
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] font-semibold transition",
              isActive
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
