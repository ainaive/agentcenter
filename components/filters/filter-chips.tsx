"use client";

import { useFilterUrl } from "@/lib/hooks/use-filter-url";
import { cn } from "@/lib/utils";

const CHIPS = [
  { key: "all", label: "All" },
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "official", label: "Official" },
  { key: "free", label: "Open Source" },
] as const;

export function FilterChips() {
  const { get, set } = useFilterUrl();
  const active = get("filter") ?? "all";

  return (
    <div className="flex flex-wrap gap-1.5">
      {CHIPS.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => set("filter", c.key === "all" ? null : c.key)}
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
