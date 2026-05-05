import { Building2, Download, Star } from "lucide-react";

import { InstallButton } from "./install-button";

import { deptPath, MY_DEPT_ID } from "@/lib/data/departments";
import type { ExtensionDetail } from "@/lib/db/queries/extensions";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

interface ExtHeroProps {
  ext: ExtensionDetail;
  locale?: Locale;
}

const BADGE_CLASS: Record<
  NonNullable<ExtensionDetail["badge"]>,
  string
> = {
  official: "badge-official",
  popular: "badge-popular",
  new: "badge-new",
};

const BADGE_LABEL: Record<
  NonNullable<ExtensionDetail["badge"]>,
  string
> = {
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

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
}

export function ExtHero({ ext, locale = "en" }: ExtHeroProps) {
  const name = locale === "zh" && ext.nameZh ? ext.nameZh : ext.name;
  const desc =
    locale === "zh" && ext.descriptionZh ? ext.descriptionZh : ext.description;
  const isMine = ext.deptId
    ? ext.deptId === MY_DEPT_ID || ext.deptId.startsWith(`${MY_DEPT_ID}.`)
    : false;
  const deptTrail = ext.deptId ? deptPath(ext.deptId, locale) : null;
  const deptLeaf = deptTrail?.[deptTrail.length - 1];

  return (
    <header className="bg-card border-border relative overflow-hidden rounded-xl border p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div
        aria-hidden
        className="bg-primary/8 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl"
      />
      <div className="relative flex items-start gap-5">
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-xl border-[1.5px] text-2xl"
          style={{
            background: `${ext.iconColor ?? "#888"}1c`,
            borderColor: `${ext.iconColor ?? "#888"}33`,
          }}
        >
          {ext.iconEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="serif text-3xl tracking-tight">{name}</h1>
            {ext.badge && (
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-bold",
                  BADGE_CLASS[ext.badge],
                )}
              >
                {BADGE_LABEL[ext.badge]}
              </span>
            )}
            <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
              {CATEGORY_LABEL[ext.category]}
            </span>
          </div>
          {(ext.tagline || desc) && (
            <p className="text-muted-foreground mt-2 max-w-3xl text-[14px] leading-relaxed">
              {ext.tagline ?? desc}
            </p>
          )}

          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]">
            <span>
              by{" "}
              <span className="text-foreground font-mono text-[12px] font-medium">
                {ext.publishedAt
                  ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(ext.publishedAt))
                  : ""}
              </span>
            </span>
            {deptLeaf && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5",
                  isMine
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "border-border bg-secondary",
                )}
              >
                <Building2 className="size-3" />
                <span className="text-[11px] font-semibold">{deptLeaf}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
              <span className="text-foreground font-semibold">
                {Number(ext.starsAvg).toFixed(1)}
              </span>
              {ext.ratingsCount > 0 && (
                <span className="opacity-70">({ext.ratingsCount})</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <Download className="size-3.5" />
              <span className="font-mono">
                {formatCount(ext.downloadsCount)}
              </span>
            </span>
          </div>
        </div>

        <InstallButton extensionId={ext.id} size="lg" />
      </div>
    </header>
  );
}
