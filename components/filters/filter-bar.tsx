import type { TagWithCount } from "@/lib/db/queries/tags";

import { DeptPicker } from "./dept-picker";
import { FilterChips } from "./filter-chips";
import { ScopePills } from "./scope-pills";
import { SortSelect } from "./sort-select";
import { TagDrawer } from "./tag-drawer";

interface FilterBarProps {
  tags: TagWithCount[];
}

/**
 * Mode B (drawer) filter layout. Composed of client islands; the bar itself
 * is a server component so the static DOM costs no JS.
 */
export function FilterBar({ tags }: FilterBarProps) {
  return (
    <div className="border-border mb-5 flex flex-col gap-3 border-b pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <DeptPicker />
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
