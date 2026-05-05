import { Building2, Download, Star } from "lucide-react";

import { Link } from "@/lib/i18n/navigation";

import { deptPath, MY_DEPT_ID } from "@/lib/data/departments";
import type { ExtensionListItem } from "@/lib/db/queries/extensions";
import { tagLabel } from "@/lib/tags";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

import { InstallButton } from "./install-button";
import { SaveButton } from "./save-button";

interface ExtCardProps {
  ext: ExtensionListItem;
  locale?: Locale;
}

const BADGE_LABEL: Record<NonNullable<ExtensionListItem["badge"]>, string> = {
  official: "Official",
  popular: "Popular",
  new: "New",
};

const BADGE_CLASS: Record<NonNullable<ExtensionListItem["badge"]>, string> = {
  official: "badge-official",
  popular: "badge-popular",
  new: "badge-new",
};

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
}

export function ExtCard({ ext, locale = "en" }: ExtCardProps) {
  const name = locale === "zh" && ext.nameZh ? ext.nameZh : ext.name;
  const desc =
    locale === "zh" && ext.descriptionZh ? ext.descriptionZh : ext.description;

  const isMine = ext.deptId
    ? ext.deptId === MY_DEPT_ID || ext.deptId.startsWith(`${MY_DEPT_ID}.`)
    : false;
  const deptTrail = ext.deptId ? deptPath(ext.deptId, locale) : null;
  const deptLeaf = deptTrail?.[deptTrail.length - 1];

  return (
    <article className="bg-card border-border hover:border-primary/30 flex flex-col gap-3 rounded-[10px] border p-[18px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_color-mix(in_oklab,var(--primary)_30%,transparent)]">
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-[17px]"
          style={{
            background: `${ext.iconColor ?? "#888"}1c`,
            borderColor: `${ext.iconColor ?? "#888"}33`,
          }}
        >
          {ext.iconEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Link
              href={`/extensions/${ext.slug}`}
              className="hover:text-primary truncate text-[14px] font-bold transition-colors"
            >
              {name}
            </Link>
            {ext.badge && (
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold",
                  BADGE_CLASS[ext.badge],
                )}
              >
                {BADGE_LABEL[ext.badge]}
              </span>
            )}
          </div>
          {deptLeaf && (
            <div
              className={cn(
                "mt-1 inline-flex items-center gap-1.5 rounded border px-2 py-0.5",
                isMine
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground",
              )}
            >
              <Building2 className="size-3" />
              <span className="text-[10.5px] font-semibold">{deptLeaf}</span>
            </div>
          )}
        </div>
      </div>

      {desc && (
        <p className="text-muted-foreground line-clamp-2 text-[12.5px] leading-[1.55]">
          {desc}
        </p>
      )}

      {ext.tagIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ext.tagIds.map((tag) => (
            <span
              key={tag}
              className="border-border text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold"
            >
              #{tagLabel(tag, locale)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1">
          <Star className="size-3 fill-amber-500 text-amber-500" />
          <span className="text-[12px] font-semibold">
            {Number(ext.starsAvg).toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Download className="text-muted-foreground size-3" />
          <span className="text-muted-foreground font-mono text-[12px]">
            {formatCount(ext.downloadsCount)}
          </span>
        </div>
        <div className="ml-auto flex gap-1.5">
          <SaveButton extensionId={ext.id} />
          <InstallButton extensionId={ext.id} size="sm" />
        </div>
      </div>
    </article>
  );
}
