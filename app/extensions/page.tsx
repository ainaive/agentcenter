import { ExtGrid } from "@/components/extension/ext-grid";
import { FilterBar } from "@/components/filters/filter-bar";
import {
  countFilteredExtensions,
  listExtensions,
} from "@/lib/db/queries/extensions";
import { getTagsWithCounts } from "@/lib/db/queries/tags";
import { parseFilters } from "@/lib/validators/filters";

export default async function ExtensionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);

  const [items, total, tags] = await Promise.all([
    listExtensions(filters),
    countFilteredExtensions(filters),
    getTagsWithCounts(),
  ]);

  return (
    <div className="px-7 py-5">
      <header className="mb-5 flex items-baseline gap-3">
        <h1 className="serif text-2xl tracking-tight">Browse all</h1>
        <span className="text-muted-foreground text-[13px]">
          {total} extension{total === 1 ? "" : "s"}
        </span>
      </header>

      <FilterBar tags={tags} />

      <ExtGrid items={items} />
    </div>
  );
}
