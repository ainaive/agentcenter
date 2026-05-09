"use client";

import { useTranslations } from "next-intl";

import { useFilters } from "@/lib/hooks/use-filters";
import type { Filters } from "@/lib/validators/filters";
import { cn } from "@/lib/utils";

const CHIP_KEYS = ["all", "trending", "new", "official", "free"] as const;

export function FilterChips() {
  const t = useTranslations("filters");
  const { filters, update } = useFilters();
  const active = filters.filter ?? "all";

  return (
    <div
      role="group"
      aria-label={t("filtersLabel")}
      className="flex flex-wrap gap-1.5"
    >
      {CHIP_KEYS.map((key) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isActive}
            onClick={() =>
              update({
                filter: key === "all" ? undefined : (key as Filters["filter"]),
              })
            }
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] font-semibold transition",
              isActive
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            {t(`chips.${key}`)}
          </button>
        );
      })}
    </div>
  );
}
