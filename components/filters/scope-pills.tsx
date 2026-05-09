"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { useFilters } from "@/lib/hooks/use-filters";
import type { Filters } from "@/lib/validators/filters";
import { cn } from "@/lib/utils";

const SCOPE_KEYS = ["all", "personal", "org", "enterprise"] as const;

export function ScopePills() {
  const t = useTranslations("filters");
  const labelId = useId();
  const { filters, update } = useFilters();
  const active = filters.scope ?? "all";

  return (
    <div className="flex items-center gap-2">
      <span
        id={labelId}
        className="text-muted-foreground shrink-0 text-[12px] font-semibold"
      >
        {t("scopeLabel")}:
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex flex-wrap gap-1"
      >
        {SCOPE_KEYS.map((key) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                update({
                  scope: key === "all" ? undefined : (key as Filters["scope"]),
                })
              }
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-semibold transition",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary",
              )}
            >
              {t(`scope.${key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
