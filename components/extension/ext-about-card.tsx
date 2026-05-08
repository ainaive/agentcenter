import { Code2, Globe } from "lucide-react";

import type { ExtensionDetail } from "@/lib/db/queries/extensions";
import type { Locale } from "@/types";

interface ExtAboutCardProps {
  ext: ExtensionDetail;
  locale: Locale;
  latestVersion?: string | null;
  bundleSize?: bigint | null;
  publishedAt?: Date | null;
  labels: {
    title: string;
    publisher: string;
    version: string;
    size: string;
    license: string;
    updated: string;
    scope: string;
  };
  scopeValue: string;
}

function formatBytes(b: bigint | null | undefined): string {
  if (!b) return "—";
  const n = Number(b);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatRelative(d: Date | null | undefined, locale: Locale): string {
  if (!d) return "—";
  const diffMs = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days < 1) return locale === "zh" ? "今天" : "today";
  if (days < 30) return locale === "zh" ? `${days} 天前` : `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return locale === "zh" ? `${months} 月前` : `${months}mo ago`;
  const years = Math.floor(days / 365);
  return locale === "zh" ? `${years} 年前` : `${years}y ago`;
}

export function ExtAboutCard({
  ext,
  locale,
  latestVersion,
  bundleSize,
  publishedAt,
  labels,
  scopeValue,
}: ExtAboutCardProps) {
  const publisher = ext.slug.split("/")[0] ?? ext.slug;

  return (
    <div className="bg-card border-border rounded-xl border p-5">
      <div className="text-muted-foreground mb-3.5 text-[10.5px] font-bold tracking-[0.08em] uppercase">
        {labels.title}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-2.5 text-[12.5px]">
        <Term>{labels.publisher}</Term>
        <Definition mono>{publisher}</Definition>

        <Term>{labels.version}</Term>
        <Definition mono>
          {latestVersion ? `v${latestVersion}` : "—"}
        </Definition>

        <Term>{labels.size}</Term>
        <Definition mono>{formatBytes(bundleSize)}</Definition>

        <Term>{labels.license}</Term>
        <Definition mono>{ext.licenseSpdx ?? "—"}</Definition>

        <Term>{labels.updated}</Term>
        <Definition>{formatRelative(publishedAt, locale)}</Definition>

        <Term>{labels.scope}</Term>
        <Definition bold>{scopeValue}</Definition>
      </dl>

      {(ext.homepageUrl || ext.repoUrl) && (
        <>
          <div className="bg-border my-3.5 h-px" />
          <div className="flex flex-col gap-1">
            {ext.homepageUrl && (
              <a
                href={ext.homepageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary flex items-center gap-2 py-1 text-[12.5px] transition-colors"
              >
                <Globe className="text-muted-foreground size-3.5 shrink-0" />
                <span className="truncate font-mono text-[11.5px]">
                  {ext.homepageUrl.replace(/^https?:\/\//, "")}
                </span>
              </a>
            )}
            {ext.repoUrl && (
              <a
                href={ext.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary flex items-center gap-2 py-1 text-[12.5px] transition-colors"
              >
                <Code2 className="text-muted-foreground size-3.5 shrink-0" />
                <span className="truncate font-mono text-[11.5px]">
                  {ext.repoUrl.replace(/^https?:\/\//, "")}
                </span>
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Term({ children }: { children: React.ReactNode }) {
  return <dt className="text-muted-foreground">{children}</dt>;
}

function Definition({
  children,
  mono = false,
  bold = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <dd
      className={
        "text-foreground m-0 truncate" +
        (mono ? " font-mono text-[11.5px]" : "") +
        (bold ? " font-semibold" : "")
      }
    >
      {children}
    </dd>
  );
}
