import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ExtHero } from "@/components/extension/ext-hero";
import { ExtMetadataPanel } from "@/components/extension/ext-metadata-panel";
import { MarkdownContent } from "@/components/markdown";
import { Link } from "@/lib/i18n/navigation";
import { getExtensionBySlug } from "@/lib/db/queries/extensions";
import type { Locale } from "@/types";

export default async function ExtensionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [ext, t] = await Promise.all([
    getExtensionBySlug(slug),
    getTranslations("extensions"),
  ]);
  if (!ext) notFound();

  return (
    <div className="px-7 py-5">
      <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-[12px]">
        <Link href="/extensions" className="hover:text-foreground transition">
          {t("breadcrumb")}
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-foreground">
          {locale === "zh" && ext.nameZh ? ext.nameZh : ext.name}
        </span>
      </nav>

      <ExtHero ext={ext} locale={locale as Locale} />

      <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_280px]">
        <main className="min-w-0">
          {ext.readmeMd ? (
            <MarkdownContent>{ext.readmeMd}</MarkdownContent>
          ) : (
            <p className="text-muted-foreground py-12 text-center text-[13px]">
              {t("noReadme")}
            </p>
          )}

          <section className="border-border mt-10 border-t pt-6">
            <h2 className="serif mb-3 text-xl tracking-tight">
              {t("versionsTitle")}
            </h2>
            <p className="text-muted-foreground text-[13px]">
              {t("noVersions")}
            </p>
          </section>
        </main>

        <ExtMetadataPanel ext={ext} locale={locale as Locale} />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const ext = await getExtensionBySlug(slug);
  if (!ext) return { title: "Not found · AgentCenter" };
  const name = locale === "zh" && ext.nameZh ? ext.nameZh : ext.name;
  return {
    title: `${name} · AgentCenter`,
    description: ext.tagline ?? ext.description ?? undefined,
  };
}
