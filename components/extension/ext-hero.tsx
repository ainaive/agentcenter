import { Building2, Clock, Download, Star, Tag } from "lucide-react";

import { InstallButton } from "./install-button";
import { SaveButton } from "./save-button";
import { ShareButton } from "./share-button";

import { deptPath, MY_DEPT_ID } from "@/lib/data/departments";
import type { ExtensionDetail } from "@/lib/db/queries/extensions";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

interface ExtHeroProps {
  ext: ExtensionDetail;
  locale?: Locale;
  latestVersion?: string | null;
  publishedAt?: Date | null;
  shareUrl: string;
  shareLabel: string;
  copiedLabel: string;
  verifiedLabel: string;
  ratingLabel: string;
  downloadsLabel: string;
  versionLabel: string;
  updatedLabel: string;
}

const BADGE_CLASS: Record<NonNullable<ExtensionDetail["badge"]>, string> = {
  official: "badge-official",
  popular: "badge-popular",
  new: "badge-new",
};

const BADGE_LABEL: Record<NonNullable<ExtensionDetail["badge"]>, string> = {
  official: "Official",
  popular: "Popular",
  new: "New",
};

const CATEGORY_LABEL: Record<ExtensionDetail["category"], string> = {
  skills: "Skill",
  mcp: "MCP Server",
  slash: "Slash Command",
  plugins: "Plugin",
};

const CATEGORY_DOT: Record<ExtensionDetail["category"], string> = {
  skills: "#dc7633",
  mcp: "#7d6cab",
  slash: "#5b8a72",
  plugins: "#b08968",
};

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
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

export function ExtHero({
  ext,
  locale = "en",
  latestVersion,
  publishedAt,
  shareUrl,
  shareLabel,
  copiedLabel,
  verifiedLabel,
  ratingLabel,
  downloadsLabel,
  versionLabel,
  updatedLabel,
}: ExtHeroProps) {
  const name = locale === "zh" && ext.nameZh ? ext.nameZh : ext.name;
  const tagline =
    locale === "zh" && ext.taglineZh ? ext.taglineZh : ext.tagline;
  const desc =
    locale === "zh" && ext.descriptionZh ? ext.descriptionZh : ext.description;
  const blurb = tagline ?? desc ?? "";
  const isMine = ext.deptId
    ? ext.deptId === MY_DEPT_ID || ext.deptId.startsWith(`${MY_DEPT_ID}.`)
    : false;
  const deptTrail = ext.deptId ? deptPath(ext.deptId, locale) : null;
  const dotColor = CATEGORY_DOT[ext.category];
  const iconColor = ext.iconColor ?? dotColor;

  return (
    <header className="border-border flex flex-col gap-6 border-b pb-7 md:flex-row md:items-start md:gap-6">
      <div
        className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-[1.5px] text-[42px] shadow-[0_6px_20px_-8px] md:size-24"
        style={{
          background: `linear-gradient(135deg, ${iconColor}28 0%, ${iconColor}10 100%)`,
          borderColor: `${iconColor}40`,
          boxShadow: `0 6px 20px -8px ${iconColor}80`,
        }}
      >
        {ext.iconEmoji}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-1.5 text-[11.5px] font-semibold tracking-[0.08em] uppercase">
          <span style={{ color: dotColor }} aria-hidden>●</span>
          <span>{CATEGORY_LABEL[ext.category]}</span>
          {deptTrail && (
            <>
              <span aria-hidden>·</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 normal-case tracking-normal",
                  isMine ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Building2 className="size-3" />
                <span className="text-[11.5px] font-medium">
                  {deptTrail.join(" / ")}
                </span>
              </span>
            </>
          )}
        </div>

        <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
          <h1 className="serif text-3xl font-semibold tracking-[-0.02em] md:text-[34px]">
            {name}
          </h1>
          {ext.badge && (
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[10.5px] font-bold tracking-wider uppercase",
                BADGE_CLASS[ext.badge],
              )}
            >
              {BADGE_LABEL[ext.badge]}
            </span>
          )}
        </div>

        <div className="text-muted-foreground mb-3.5 flex flex-wrap items-center gap-3 text-[13px]">
          <span>
            by{" "}
            <span className="text-foreground font-mono text-[12.5px] font-semibold">
              {ext.slug.split("/")[0] ?? ext.slug}
            </span>
          </span>
          {ext.badge === "official" && (
            <span className="text-primary inline-flex items-center gap-1 text-[12px] font-semibold">
              <span
                aria-hidden
                className="bg-primary/15 text-primary flex size-3.5 items-center justify-center rounded-full text-[9px] font-bold"
              >
                ✓
              </span>
              {verifiedLabel}
            </span>
          )}
        </div>

        {blurb && (
          <p className="text-foreground mb-4 max-w-[680px] text-[15px] leading-[1.6] text-pretty">
            {blurb}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <InstallButton extensionId={ext.id} size="lg" />
          <SaveButton extensionId={ext.id} variant="pill" />
          <ShareButton
            url={shareUrl}
            label={shareLabel}
            copiedLabel={copiedLabel}
          />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-x-7 gap-y-5 pt-1">
        <Stat
          icon={<Star className="size-3.5" />}
          value={Number(ext.starsAvg).toFixed(1)}
          label={ratingLabel}
        />
        <Stat
          icon={<Download className="size-3.5" />}
          value={formatCount(ext.downloadsCount)}
          label={downloadsLabel}
          mono
        />
        <Stat
          icon={<Tag className="size-3.5" />}
          value={latestVersion ? `v${latestVersion}` : "—"}
          label={versionLabel}
          mono
        />
        <Stat
          icon={<Clock className="size-3.5" />}
          value={formatRelative(publishedAt ?? null, locale)}
          label={updatedLabel}
        />
      </div>
    </header>
  );
}

function Stat({
  icon,
  value,
  label,
  mono = false,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-muted-foreground flex items-center gap-1.5">
        {icon}
        <span
          className={cn(
            "text-foreground text-[18px] font-bold tracking-[-0.01em]",
            mono && "font-mono",
          )}
        >
          {value}
        </span>
      </div>
      <div className="text-muted-foreground text-[10.5px] font-semibold tracking-[0.06em] uppercase">
        {label}
      </div>
    </div>
  );
}
