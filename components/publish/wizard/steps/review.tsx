"use client";

import { Check, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { deptPath } from "@/lib/data/departments";
import type { Locale } from "@/types";
import type { ManifestFormValues } from "@/lib/validators/manifest";
import { cn } from "@/lib/utils";

const SECTION_HEADER =
  "px-4 pb-2 pt-3 text-[11.5px] font-bold uppercase tracking-[0.06em] text-foreground";

export function ReviewStep({
  draft,
  locale,
  bundleUploaded,
  onJump,
}: {
  draft: ManifestFormValues;
  locale: Locale;
  bundleUploaded: boolean;
  onJump: (step: number) => void;
}) {
  const t = useTranslations("publish.review");
  const tBasics = useTranslations("publish.basics");
  const tType = useTranslations("publish.type");
  const tScope = useTranslations("publish.scope");
  const tListing = useTranslations("publish.listing");
  const tSource = useTranslations("publish.source");
  const tPerm = useTranslations("publish.permissions");

  const willAutoPublish = draft.scope === "personal";
  const deptLabel = draft.deptId
    ? deptPath(draft.deptId, locale).join(" / ")
    : null;
  const permsOn = Object.entries(draft.permissions ?? {})
    .filter(([, v]) => v)
    .map(([k]) => tPerm(k));
  const editLabel = t("edit");

  return (
    <div className="flex flex-col gap-5">
      <div className="text-[13.5px] leading-relaxed text-muted-foreground">
        {t("intro")}
      </div>

      <SummaryCard title={t("basics")}>
        <Row label={tBasics("name")} value={draft.name} editLabel={editLabel} onEdit={() => onJump(0)} />
        <Row label={tBasics("slug")} value={draft.slug} mono editLabel={editLabel} onEdit={() => onJump(0)} />
        <Row
          label={tBasics("version")}
          value={draft.version}
          mono
          editLabel={editLabel}
          onEdit={() => onJump(0)}
        />
        <Row
          label={tBasics("summary")}
          value={draft.summary}
          editLabel={editLabel}
          onEdit={() => onJump(0)}
        />
        <Row
          label={tType("label")}
          value={tType(draft.category)}
          editLabel={editLabel}
          onEdit={() => onJump(0)}
        />
        <Row
          label={tScope("label")}
          value={tScope(`${draft.scope}Title`)}
          editLabel={editLabel}
          onEdit={() => onJump(0)}
        />
      </SummaryCard>

      <SummaryCard title={t("source")}>
        <Row
          label={tSource("methodLabel")}
          value={tSource(`${draft.sourceMethod}Title`)}
          editLabel={editLabel}
          onEdit={() => onJump(1)}
        />
        <Row
          label={t("bundle")}
          value={bundleUploaded ? t("bundleUploaded") : t("bundleMissing")}
          editLabel={editLabel}
          onEdit={() => onJump(1)}
        />
      </SummaryCard>

      <SummaryCard title={t("listing")}>
        <Row
          label={tListing("tags")}
          value={draft.tagIds.length ? draft.tagIds.join(", ") : null}
          editLabel={editLabel}
          onEdit={() => onJump(2)}
        />
        <Row
          label={tListing("dept")}
          value={deptLabel}
          editLabel={editLabel}
          onEdit={() => onJump(2)}
        />
        <Row
          label={tListing("readme")}
          value={
            draft.readmeMd
              ? `${draft.readmeMd.slice(0, 60)}${
                  draft.readmeMd.length > 60 ? "…" : ""
                }`
              : null
          }
          editLabel={editLabel}
          onEdit={() => onJump(2)}
        />
        <Row
          label={tPerm("label")}
          value={permsOn.length ? permsOn.join(", ") : t("permsNone")}
          editLabel={editLabel}
          onEdit={() => onJump(2)}
        />
      </SummaryCard>

      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border px-4 py-3.5",
          willAutoPublish
            ? "border-emerald-300/60 bg-emerald-50 text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-200",
        )}
      >
        {willAutoPublish ? (
          <Check aria-hidden className="size-5 shrink-0" />
        ) : (
          <Clock aria-hidden className="size-5 shrink-0" />
        )}
        <div className="flex flex-col gap-0.5">
          <div className="text-[12.5px] font-semibold">
            {t("publishTo")}: {tScope(`${draft.scope}Title`)}
          </div>
          <div className="text-[12px]">
            {willAutoPublish ? t("statusAuto") : t("statusReview")}
          </div>
        </div>
      </div>

      {/* Publisher Terms link is intentionally rendered as plain text
          until the actual policy route ships — a dead `href="#"` would
          mislead users who think they can read the terms before agreeing. */}
      <div className="text-[11.5px] leading-relaxed text-muted-foreground">
        {t("terms")}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-1.5">
      <div className={SECTION_HEADER}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  editLabel,
  onEdit,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr_auto] items-start gap-3 border-t border-border px-3 py-2.5">
      <div className="text-[12px] font-medium text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-[13px] text-foreground", mono && "font-mono")}>
        {value ?? <span className="italic text-muted-foreground/60">—</span>}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-[11.5px] font-semibold text-primary hover:underline"
      >
        {editLabel}
      </button>
    </div>
  );
}
