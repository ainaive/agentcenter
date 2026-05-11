import { Plus, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import type { ProfilePublishedRow } from "@/lib/db/queries/profile";

function formatCount(n: number, locale: string = "en"): string {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US").format(n);
}

export function SectionPublished({ rows }: { rows: ProfilePublishedRow[] }) {
  const t = useTranslations("profile");

  if (rows.length === 0) {
    return (
      <div className="border-border bg-card/40 flex flex-col items-center gap-3 rounded-xl border border-dashed px-8 py-16 text-center">
        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
          <Upload className="text-primary size-5" aria-hidden />
        </div>
        <h2 className="text-foreground text-base font-semibold">
          {t("emptyPublished.title")}
        </h2>
        <p className="text-muted-foreground max-w-xs text-[13px] leading-relaxed">
          {t("emptyPublished.body")}
        </p>
        <Link
          href="/publish/new"
          className="bg-primary text-primary-foreground hover:opacity-90 mt-1 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-semibold transition-opacity"
        >
          <Plus className="size-3.5" aria-hidden />
          {t("publishOne")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li
          key={r.extensionId}
          className="border-border bg-card hover:border-primary/60 rounded-xl border transition-colors"
        >
          <Link
            href={`/extensions/${r.slug}`}
            className="flex items-center justify-between gap-3 px-5 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="text-foreground truncate text-[14px] font-semibold">
                {r.name}
              </div>
              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
                {r.latestVersion && (
                  <span className="font-mono">{r.latestVersion}</span>
                )}
                <span>· {formatCount(r.downloadsCount)} {t("installsShort")}</span>
                {r.ratingsCount > 0 && (
                  <span>
                    · <span className="text-primary">★</span>
                    {Number(r.starsAvg).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <span className="text-muted-foreground shrink-0 rounded-full border border-border px-2.5 py-0.5 text-[11px]">
              {r.category}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
