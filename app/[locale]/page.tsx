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
        <section className="bg-card border-border relative mb-7 overflow-hidden rounded-xl border p-9 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div
            aria-hidden
            className="bg-primary/12 pointer-events-none absolute -top-24 -right-16 size-80 rounded-full blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 right-40 size-56 rounded-full blur-3xl"
            style={{
              background: `${featured.iconColor ?? "var(--primary)"}1f`,
            }}
          />
          <div className="relative grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div className="text-primary font-mono text-[10.5px] font-medium tracking-[0.18em] uppercase">
                {t("featuredLabel")}
              </div>
              <h1 className="serif mt-2.5 text-4xl leading-tight tracking-tight">
                <FeaturedTitle
                  name={
                    locale === "zh" && featured.nameZh
                      ? featured.nameZh
                      : featured.name
                  }
                />
              </h1>
              {(featured.descriptionZh || featured.description) && (
                <p className="text-muted-foreground mt-2.5 max-w-md text-[13.5px] leading-relaxed">
                  {locale === "zh" && featured.descriptionZh
                    ? featured.descriptionZh
                    : featured.description}
                </p>
              )}
              <div className="mt-6 flex items-center gap-5">
                <Link
                  href={`/extensions/${featured.slug}`}
                  className="text-primary hover:text-primary/80 group inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors"
                >
                  {t("viewExtension")}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[11.5px]">
                  <Download className="size-3" />
                  {t("installsCount", {
                    count: formatCount(featured.downloadsCount),
                  })}
                </span>
              </div>
            </div>
            {featured.iconEmoji && (
              <Link
                href={`/extensions/${featured.slug}`}
                aria-hidden
                tabIndex={-1}
                className="hidden md:block"
              >
                <div
                  className="flex size-44 items-center justify-center rounded-2xl border-[1.5px] text-7xl shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--primary)_25%,transparent)] transition-transform duration-300 hover:-translate-y-1 hover:rotate-1"
                  style={{
                    background: `${featured.iconColor ?? "#888"}1c`,
                    borderColor: `${featured.iconColor ?? "#888"}44`,
                  }}
                >
                  {featured.iconEmoji}
                </div>
              </Link>
            )}
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
