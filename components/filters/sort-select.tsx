"use client";

import { useTranslations } from "next-intl";

import { useFilters } from "@/lib/hooks/use-filters";
import type { Filters } from "@/lib/validators/filters";

const SORT_KEYS = ["downloads", "stars", "recent"] as const;

export function SortSelect() {
  const t = useTranslations("filters");
  const { filters, update } = useFilters();
  const active = filters.sort ?? "downloads";

  return (
    <label className="text-muted-foreground flex items-center gap-2 text-[12px]">
      <span className="shrink-0 font-semibold">{t("sortLabel")}:</span>
      <select
        value={active}
        onChange={(e) => update({ sort: e.target.value as Filters["sort"] })}
        className="bg-muted border-input text-foreground focus-visible:border-ring focus-visible:ring-ring/30 cursor-pointer rounded-md border px-2 py-1 text-[12px] outline-none focus-visible:ring-3"
      >
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {t(`sort.${key}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
