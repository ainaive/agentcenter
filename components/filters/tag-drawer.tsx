"use client";

import { ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import type { TagWithCount } from "@/lib/db/queries/tags";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";

interface TagDrawerProps {
  tags: TagWithCount[];
}

const VISIBLE_DEFAULT = 14;

export function TagDrawer({ tags }: TagDrawerProps) {
  const t = useTranslations("filters");
  const panelId = useId();
  const { filters, update } = useFilters();
  const active = filters.tags ?? [];
  const tagMatch = filters.tagMatch ?? "any";
  const initiallyOpen = active.length > 0;
  const [open, setOpen] = useState(initiallyOpen);
  const [showAll, setShowAll] = useState(false);

  function toggle(id: string) {
    update({
      tags: active.includes(id) ? active.filter((t) => t !== id) : [...active, id],
    });
  }

  const visible = showAll ? tags : tags.slice(0, VISIBLE_DEFAULT);
  const hiddenCount = Math.max(0, tags.length - VISIBLE_DEFAULT);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold transition-colors"
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
        # {t("tagsToggle")}
        {active.length > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold">
            {active.length}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={t("tagsToggle")}
          className="flex flex-wrap items-center gap-1.5 pt-1"
        >
          {visible.map((tag) => {
            const isActive = active.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => toggle(tag.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold transition",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                )}
              >
                {tag.id}
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "opacity-70" : "opacity-50",
                  )}
                >
                  {tag.count}
                </span>
              </button>
            );
          })}

          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-muted-foreground hover:text-foreground text-[11.5px] font-semibold underline underline-offset-2 transition-colors"
            >
              +{t("showMoreCount", { count: hiddenCount })}
            </button>
          )}
          {showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="text-muted-foreground hover:text-foreground text-[11.5px] font-semibold underline underline-offset-2 transition-colors"
            >
              − {t("showLess")}
            </button>
          )}

          {active.length > 0 && (
            <>
              <div
                role="group"
                aria-label={t("matchModeGroupLabel")}
                className="bg-muted ml-2 flex rounded p-0.5"
              >
                {(["any", "all"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={tagMatch === m}
                    onClick={() =>
                      update({ tagMatch: m === "any" ? undefined : m })
                    }
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition",
                      tagMatch === m
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    {t(`tags.${m}`)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => update({ tags: undefined })}
                className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition"
              >
                <X aria-hidden className="size-3" />
                {t("tags.clear")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
