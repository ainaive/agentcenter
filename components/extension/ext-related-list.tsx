import type { RelatedExtension } from "@/lib/db/queries/extensions";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/types";

interface ExtRelatedListProps {
  related: RelatedExtension[];
  locale: Locale;
  title: string;
}

export function ExtRelatedList({
  related,
  locale,
  title,
}: ExtRelatedListProps) {
  if (related.length === 0) return null;

  return (
    <div className="bg-card border-border rounded-xl border p-5">
      <div className="text-muted-foreground mb-3 text-[10.5px] font-bold tracking-[0.08em] uppercase">
        {title}
      </div>
      <ul className="flex flex-col">
        {related.map((r, i) => {
          const name = locale === "zh" && r.nameZh ? r.nameZh : r.name;
          const publisher = r.slug.split("/")[0] ?? r.slug;
          const iconColor = r.iconColor ?? "#888";
          return (
            <li
              key={r.id}
              className={
                i === 0 ? "" : "border-border border-t"
              }
            >
              <Link
                href={`/extensions/${r.slug}`}
                className="hover:bg-accent/50 -mx-2 flex items-center gap-2.5 rounded px-2 py-2.5 transition-colors"
              >
                <div
                  className="flex size-7 shrink-0 items-center justify-center rounded-md border text-[14px]"
                  style={{
                    background: `${iconColor}1c`,
                    borderColor: `${iconColor}33`,
                  }}
                >
                  {r.iconEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-foreground truncate text-[13px] font-semibold">
                    {name}
                  </div>
                  <div className="text-muted-foreground truncate font-mono text-[11px]">
                    {publisher} · ★ {Number(r.starsAvg).toFixed(1)}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
