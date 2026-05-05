import { SearchX } from "lucide-react";

import type { ExtensionListItem } from "@/lib/db/queries/extensions";
import type { Locale } from "@/types";

import { ExtCard } from "./ext-card";

interface ExtGridProps {
  items: ExtensionListItem[];
  locale?: Locale;
  query?: string;
}

export function ExtGrid({ items, locale = "en", query }: ExtGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <SearchX className="h-10 w-10 text-muted-foreground/40" />
        {query ? (
          <>
            <p className="text-sm font-medium text-foreground">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search or clearing some filters.</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No extensions found. Try adjusting the filters.</p>
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
