import { getTranslations } from "next-intl/server";

import { ExtGrid } from "@/components/extension/ext-grid";
import { FilterBar } from "@/components/filters/filter-bar";
import {
  countFilteredExtensions,
  listExtensions,
} from "@/lib/db/queries/extensions";
import { getTagsWithCounts } from "@/lib/db/queries/tags";
import { parseFilters } from "@/lib/validators/filters";
import type { Locale } from "@/types";

export default async function ExtensionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, rawParams] = await Promise.all([params, searchParams]);
  const t = await getTranslations("extensions");
  const filters = parseFilters(rawParams);

  const [items, total, tags] = await Promise.all([
    listExtensions(filters),
    countFilteredExtensions(filters),
    getTagsWithCounts(),
  ]);

  return (
    <div className="px-7 py-5">
      <header className="mb-5 flex items-baseline gap-3">
        <h1 className="serif text-2xl tracking-tight">{t("browseTitle")}</h1>
        <span className="text-muted-foreground text-[13px]">
          {t("count", { count: total })}
        </span>
      </header>

      <FilterBar tags={tags} />

      <ExtGrid items={items} locale={locale as Locale} />
    </div>
  );
}
