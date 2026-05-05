import { ArrowRight } from "lucide-react";
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
            className="bg-primary/12 pointer-events-none absolute -top-20 -right-20 size-72 rounded-full blur-3xl"
          />
          <div
            aria-hidden
            className="bg-primary/8 pointer-events-none absolute -bottom-24 right-32 size-52 rounded-full blur-3xl"
          />
          <div className="relative">
            <div className="text-primary font-mono text-[10.5px] font-medium tracking-[0.18em] uppercase">
              {t("featuredLabel")}
            </div>
            <h1 className="serif mt-2.5 text-4xl leading-tight tracking-tight">
              <FeaturedTitle name={locale === "zh" && featured.nameZh ? featured.nameZh : featured.name} />
            </h1>
            {(featured.descriptionZh || featured.description) && (
              <p className="text-muted-foreground mt-2.5 max-w-md text-[13.5px] leading-relaxed">
                {locale === "zh" && featured.descriptionZh
                  ? featured.descriptionZh
                  : featured.description}
              </p>
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
