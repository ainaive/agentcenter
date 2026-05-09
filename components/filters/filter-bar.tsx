import type { CreatorFacet, PublisherFacet } from "@/lib/db/queries/facets";
import type { TagWithCount } from "@/lib/db/queries/tags";

import { CreatorPicker } from "./creator-picker";
import { DeptPicker } from "./dept-picker";
import { FilterChips } from "./filter-chips";
import { PublisherPicker } from "./publisher-picker";
import { ScopePills } from "./scope-pills";
import { SortSelect } from "./sort-select";
import { TagDrawer } from "./tag-drawer";

interface FilterBarProps {
  tags: TagWithCount[];
  creators: CreatorFacet[];
  publishers: PublisherFacet[];
}

/**
 * Mode B (drawer) filter layout. Composed of client islands; the bar itself
 * is a server component so the static DOM costs no JS.
 */
export function FilterBar({ tags, creators, publishers }: FilterBarProps) {
  return (
    <div className="border-border mb-5 flex flex-col gap-3 border-b pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <DeptPicker />
        <PublisherPicker publishers={publishers} />
        <CreatorPicker creators={creators} />
        <span className="bg-border h-5 w-px" />
        <ScopePills />
      </div>
      <TagDrawer tags={tags} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips />
        <SortSelect />
      </div>
    </div>
  );
}
