import { ChevronLeft, Check, Tag as TagIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { ExtAboutCard } from "@/components/extension/ext-about-card";
import { ExtHero } from "@/components/extension/ext-hero";
import { ExtRelatedList } from "@/components/extension/ext-related-list";
import { ExtTabs, type TabPanel } from "@/components/extension/ext-tabs";
import { InstallCommand } from "@/components/extension/install-command";
import { MarkdownContent } from "@/components/markdown";
import {
  getExtensionBySlug,
  getLatestExtensionVersion,
  getRelatedExtensions,
  listExtensionVersions,
  type ExtensionDetail,
} from "@/lib/db/queries/extensions";
import { Link } from "@/lib/i18n/navigation";
import { tagLabel } from "@/lib/tags";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

type CompatRecord = Record<string, unknown> | null;

function compatRows(json: CompatRecord, locale: Locale): string[] {
  if (!json) return [];
  return Object.entries(json).map(([key, value]) => {
    if (value === null || value === undefined) return key;
    if (typeof value === "string") return `${formatKey(key, locale)}: ${value}`;
    if (typeof value === "number" || typeof value === "boolean") {
      return `${formatKey(key, locale)}: ${value}`;
    }
    return `${formatKey(key, locale)}: ${JSON.stringify(value)}`;
  });
}

function formatKey(key: string, _locale: Locale): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export default async function ExtensionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;

  const ext = await getExtensionBySlug(slug);
  if (!ext) notFound();

  const [t, tMetadata, tExt, latest, versions, related] = await Promise.all([
    getTranslations({ locale, namespace: "detail" }),
    getTranslations({ locale, namespace: "metadata" }),
    getTranslations({ locale, namespace: "extensions" }),
    getLatestExtensionVersion(ext.id),
    listExtensionVersions(ext.id),
    getRelatedExtensions(ext.id, ext.category),
  ]);

  const reqHeaders = await headers();
  const host = reqHeaders.get("x-forwarded-host") ?? reqHeaders.get("host");
  const proto = reqHeaders.get("x-forwarded-proto") ?? "https";
  const shareUrl = host
    ? `${proto}://${host}/${locale}/extensions/${ext.slug}`
    : `/${locale}/extensions/${ext.slug}`;

  const installCmd = `agentcenter install ${ext.slug}`;
  const compatLines = compatRows(
    ext.compatibilityJson as CompatRecord,
    locale,
  );

  const tabs: TabPanel[] = [
    {
      key: "overview",
      label: t("tabs.overview"),
      content: <OverviewPanel ext={ext} locale={locale} t={t} />,
    },
    {
      key: "setup",
      label: t("tabs.setup"),
      content: (
        <SetupPanel
          installCmd={installCmd}
          compatLines={compatLines}
          tCopy={t("copy")}
          tCopied={t("copied")}
          tInstallCmd={t("sections.installCmd")}
          tRequirements={t("sections.requirements")}
          tNoRequirements={t("emptyRequirements")}
        />
      ),
    },
    {
      key: "versions",
      label: `${t("tabs.versions")} (${versions.length})`,
      content: (
        <VersionsPanel
          versions={versions}
          locale={locale}
          currentLabel={t("currentLabel")}
          emptyLabel={tExt("noVersions")}
        />
      ),
    },
    {
      key: "reviews",
      label: t("tabs.reviews"),
      content: (
        <EmptyPanel
          icon="reviews"
          message={t("emptyReviews")}
          ctaLabel={t("writeReview")}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-7 py-6">
      <Link
        href="/extensions"
        className="text-muted-foreground hover:text-foreground hover:bg-accent -ml-2 mb-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-semibold transition-colors"
      >
        <ChevronLeft className="size-3.5" />
        {t("back")}
      </Link>

      <ExtHero
        ext={ext}
        locale={locale}
        latestVersion={latest?.version ?? null}
        publishedAt={latest?.publishedAt ?? ext.publishedAt ?? null}
        shareUrl={shareUrl}
        shareLabel={t("share")}
        copiedLabel={t("copied")}
        verifiedLabel={t("verified")}
        ratingLabel={t("stats.rating")}
        downloadsLabel={t("stats.downloads")}
        versionLabel={t("stats.version")}
        updatedLabel={t("stats.updated")}
      />

      <div className="mt-7 grid gap-9 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <ExtTabs tabs={tabs} />
        </main>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-5 lg:self-start">
          <ExtAboutCard
            ext={ext}
            locale={locale}
            latestVersion={latest?.version ?? null}
            bundleSize={latest?.bundleSize ?? null}
            publishedAt={latest?.publishedAt ?? ext.publishedAt ?? null}
            labels={{
              title: t("about"),
              publisher: t("publisher"),
              version: t("stats.version"),
              size: t("size"),
              license: tMetadata("license"),
              updated: t("stats.updated"),
              scope: tMetadata("scope"),
            }}
            scopeValue={tMetadata(`scopeValues.${ext.scope}`)}
          />
          <ExtRelatedList
            related={related}
            locale={locale}
            title={t("related")}
          />
        </aside>
      </div>
    </div>
  );
}

function OverviewPanel({
  ext,
  locale,
  t,
}: {
  ext: ExtensionDetail;
  locale: Locale;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className="flex flex-col gap-7">
      {ext.readmeMd ? (
        <MarkdownContent>{ext.readmeMd}</MarkdownContent>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-[13px]">
          {t("emptyReadme")}
        </p>
      )}

      {ext.tagIds.length > 0 && (
        <section>
          <h2 className="serif mb-3 text-[18px] font-semibold tracking-[-0.01em]">
            {t("sections.tags")}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {ext.tagIds.map((tag) => (
              <Link
                key={tag}
                href={`/extensions?tags=${encodeURIComponent(tag)}&dept=__all`}
                className="border-border text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/10 rounded border bg-transparent px-2.5 py-1 font-mono text-[12px] font-semibold transition-colors"
              >
                #{tagLabel(tag, locale)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SetupPanel({
  installCmd,
  compatLines,
  tCopy,
  tCopied,
  tInstallCmd,
  tRequirements,
  tNoRequirements,
}: {
  installCmd: string;
  compatLines: string[];
  tCopy: string;
  tCopied: string;
  tInstallCmd: string;
  tRequirements: string;
  tNoRequirements: string;
}) {
  return (
    <div className="flex flex-col gap-7">
      <section>
        <h2 className="serif mb-3.5 text-[20px] font-semibold tracking-[-0.01em]">
          {tInstallCmd}
        </h2>
        <InstallCommand
          command={installCmd}
          copyLabel={tCopy}
          copiedLabel={tCopied}
        />
      </section>

      <section>
        <h2 className="serif mb-3.5 text-[20px] font-semibold tracking-[-0.01em]">
          {tRequirements}
        </h2>
        {compatLines.length === 0 ? (
          <p className="text-muted-foreground text-[13px]">
            {tNoRequirements}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {compatLines.map((line, i) => (
              <li
                key={i}
                className="bg-secondary border-border flex items-center gap-2.5 rounded-lg border px-3 py-2.5"
              >
                <Check className="text-primary size-3.5 shrink-0" />
                <span className="font-mono text-[12.5px]">{line}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function VersionsPanel({
  versions,
  locale,
  currentLabel,
  emptyLabel,
}: {
  versions: Array<{
    version: string;
    changelog: string | null;
    changelogZh: string | null;
    publishedAt: Date | null;
  }>;
  locale: Locale;
  currentLabel: string;
  emptyLabel: string;
}) {
  if (versions.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-[13px]">
        {emptyLabel}
      </p>
    );
  }
  const fmt = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <ul className="flex flex-col">
      {versions.map((v, i) => {
        const note =
          locale === "zh" && v.changelogZh
            ? v.changelogZh
            : (v.changelog ?? "");
        return (
          <li
            key={`${v.version}-${i}`}
            className={cn(
              "flex gap-6 py-5",
              i === 0 ? "" : "border-border border-t",
            )}
          >
            <div className="w-[120px] shrink-0">
              <div
                className={cn(
                  "font-mono text-[14px] font-bold",
                  i === 0 ? "text-primary" : "text-foreground",
                )}
              >
                v{v.version}
              </div>
              <div className="text-muted-foreground mt-1 text-[11.5px]">
                {v.publishedAt ? fmt.format(v.publishedAt) : ""}
              </div>
              {i === 0 && (
                <div className="text-primary mt-1.5 text-[10px] font-bold tracking-[0.08em] uppercase">
                  {currentLabel}
                </div>
              )}
            </div>
            <p className="text-foreground m-0 flex-1 text-[14px] leading-[1.6] text-pretty">
              {note}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyPanel({
  icon,
  message,
  ctaLabel,
}: {
  icon: "reviews";
  message: string;
  ctaLabel: string;
}) {
  return (
    <div className="border-border bg-card/40 flex flex-col items-center gap-4 rounded-lg border border-dashed py-12 text-center">
      <TagIcon className="text-muted-foreground/60 size-7" />
      <p className="text-muted-foreground max-w-sm text-[13.5px]">{message}</p>
      <button
        type="button"
        className="border-border text-foreground hover:border-primary/50 hover:text-primary rounded-md border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors"
        // Reviews submission flow not implemented yet — disabled placeholder.
        disabled
      >
        + {ctaLabel}
      </button>
      <span className="sr-only">{icon}</span>
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
