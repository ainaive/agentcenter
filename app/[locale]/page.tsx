import { ArrowRight, Download } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ExtGrid } from "@/components/extension/ext-grid";
import { Link } from "@/lib/i18n/navigation";
import {
  countPublishedExtensions,
  getFeaturedExtension,
  listExtensions,
} from "@/lib/db/queries/extensions";
import type { Locale } from "@/types";

const TRENDING_LIMIT = 8;

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");

  const [featured, totalCount, trending] = await Promise.all([
    getFeaturedExtension(),
    countPublishedExtensions(),
    listExtensions({ category: "skills", sort: "downloads", dept: "__all" }),
  ]);

  return (
    <div className="px-7 py-5">
      {featured && (
        <section className="bg-card border-border relative mb-7 overflow-hidden rounded-xl border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-32 left-1/2 size-[28rem] -translate-x-1/2 rounded-full blur-3xl"
          />
          {featured.iconColor && (
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-32 left-1/2 size-80 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: `${featured.iconColor}18` }}
            />
          )}
          <div className="relative px-9 pt-5 pb-4">
            <div className="flex items-center gap-5">
              <div className="border-border/60 h-px flex-1" />
              <span className="text-primary font-mono text-[10.5px] font-medium tracking-[0.22em] uppercase">
                {t("featuredLabel")}
              </span>
              <div className="border-border/60 h-px flex-1" />
            </div>

            <div className="px-2 py-7 text-center md:py-9">
              <h1 className="serif mx-auto max-w-3xl text-4xl leading-[1.05] tracking-tight md:text-5xl">
                <FeaturedTitle
                  name={
                    locale === "zh" && featured.nameZh
                      ? featured.nameZh
                      : featured.name
                  }
                />
              </h1>
              {(featured.descriptionZh || featured.description) && (
                <p className="serif text-muted-foreground mx-auto mt-3.5 max-w-xl text-[14px] leading-relaxed italic">
                  {locale === "zh" && featured.descriptionZh
                    ? featured.descriptionZh
                    : featured.description}
                </p>
              )}
            </div>

            <div className="border-border/60 flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.15em] uppercase">
                <Download className="size-3" />
                {t("installsCount", {
                  count: formatCount(featured.downloadsCount),
                })}
              </span>
              <Link
                href={`/extensions/${featured.slug}`}
                className="text-primary hover:text-primary/80 group inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors"
              >
                {t("viewExtension")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mb-2 flex items-baseline justify-between">
        <h2 className="serif text-xl tracking-tight">{t("trendingTitle")}</h2>
        <Link
          href="/extensions"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-[12.5px] font-semibold transition-colors"
        >
          {t("browseAll", { count: totalCount })}
          <ArrowRight className="size-3.5" />
        </Link>
      </section>

      <section className="mt-4">
        <ExtGrid items={trending.slice(0, TRENDING_LIMIT)} locale={locale as Locale} />
      </section>
    </div>
  );
}

function FeaturedTitle({ name }: { name: string }) {
  const words = name.split(" ");
  if (words.length < 2) {
    return <span className="text-primary font-light italic">{name}</span>;
  }
  const lead = words.slice(0, -1).join(" ");
  const tail = words[words.length - 1];
  return (
    <>
      {lead}{" "}
      <span className="text-primary font-light italic">{tail}</span>
    </>
  );
}
