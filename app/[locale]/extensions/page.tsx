import { getTranslations } from "next-intl/server";

import { ExtGrid } from "@/components/extension/ext-grid";
import { FilterBar } from "@/components/filters/filter-bar";
import { getSession } from "@/lib/auth/session";
import {
  countFilteredExtensions,
  listExtensions,
} from "@/lib/db/queries/extensions";
import {
  listPublishedCreators,
  listPublishedPublishers,
} from "@/lib/db/queries/facets";
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
  const [{ locale }, rawParams, session] = await Promise.all([
    params,
    searchParams,
    getSession(),
  ]);
  const t = await getTranslations("extensions");
  const filters = parseFilters(rawParams);
  const userDeptId = session?.user.defaultDeptId ?? undefined;

  const [items, total, tags, creators, publishers] = await Promise.all([
    listExtensions(filters, userDeptId),
    countFilteredExtensions(filters, userDeptId),
    getTagsWithCounts(),
    listPublishedCreators(),
    listPublishedPublishers(),
  ]);

  return (
    <div className="px-7 py-5">
      <header className="mb-5 flex items-baseline gap-3">
        <h1 className="serif text-2xl tracking-tight">{t("browseTitle")}</h1>
        <span className="text-muted-foreground text-[13px]">
          {t("count", { count: total })}
        </span>
      </header>

      <FilterBar tags={tags} creators={creators} publishers={publishers} />

      <ExtGrid
        items={items}
        locale={locale as Locale}
        query={filters.q}
        // Only offer "Clear filters" when the URL actually carries filters —
        // otherwise an empty DB renders a misleading "no matches for these
        // filters" message with a CTA that doesn't change anything.
        clearFiltersHref={
          Object.keys(rawParams).length > 0 ? "/extensions" : undefined
        }
      />
    </div>
  );
}
