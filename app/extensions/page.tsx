import { ExtGrid } from "@/components/extension/ext-grid";
import {
  countFilteredExtensions,
  listExtensions,
} from "@/lib/db/queries/extensions";
import { parseFilters } from "@/lib/validators/filters";

export default async function ExtensionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);

  const [items, total] = await Promise.all([
    listExtensions(filters),
    countFilteredExtensions(filters),
  ]);

  return (
    <div className="px-7 py-5">
      <header className="mb-5 flex items-baseline gap-3">
        <h1 className="serif text-2xl tracking-tight">Browse all</h1>
        <span className="text-muted-foreground text-[13px]">
          {total} extension{total === 1 ? "" : "s"}
        </span>
      </header>
      <ExtGrid items={items} />
    </div>
  );
}
