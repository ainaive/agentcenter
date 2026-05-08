import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { ExtensionListItem } from "@/lib/db/queries/extensions";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/types";

import { ExtCard } from "./ext-card";

interface ExtGridProps {
  items: ExtensionListItem[];
  locale?: Locale;
  query?: string;
  // When provided, the empty state shows a "Clear filters" link to this href.
  // Pass for routes where filters are user-driven (the listing page); omit on
  // routes where the filter set is baked in (e.g. the home Trending grid).
  clearFiltersHref?: string;
}

export async function ExtGrid({
  items,
  locale = "en",
  query,
  clearFiltersHref,
}: ExtGridProps) {
  if (items.length === 0) {
    const t = await getTranslations("extensions.empty");
    const filtersActive = Boolean(query) || Boolean(clearFiltersHref);

    return (
      <div className="border-border bg-card/40 mx-auto my-2 flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <SearchX className="text-muted-foreground/50 size-8" />
        <h2 className="text-foreground text-base font-semibold">
          {query
            ? t("noResultsFor", { query })
            : filtersActive
              ? t("noResultsFiltered")
              : t("noExtensionsYet")}
        </h2>
        <p className="text-muted-foreground max-w-xs text-[13px] leading-relaxed">
          {filtersActive ? t("hintAdjust") : t("hintCheckBack")}
        </p>
        {clearFiltersHref && (
          <Link
            href={clearFiltersHref}
            className="border-border text-foreground hover:border-primary/50 hover:text-primary mt-1 inline-flex items-center rounded-md border px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
          >
            {t("clearFilters")}
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {items.map((ext) => (
        <ExtCard key={ext.id} ext={ext} locale={locale} />
      ))}
    </div>
  );
}
