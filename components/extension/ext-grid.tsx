import type { ExtensionListItem } from "@/lib/db/queries/extensions";
import type { Locale } from "@/types";

import { ExtCard } from "./ext-card";

interface ExtGridProps {
  items: ExtensionListItem[];
  locale?: Locale;
  emptyMessage?: string;
}

export function ExtGrid({
  items,
  locale = "en",
  emptyMessage = "No results found",
}: ExtGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground py-16 text-center text-[13px]">
        {emptyMessage}
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
