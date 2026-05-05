"use client";

import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

import type { TagWithCount } from "@/lib/db/queries/tags";
import { useFilterUrl } from "@/lib/hooks/use-filter-url";
import { cn } from "@/lib/utils";

interface TagDrawerProps {
  tags: TagWithCount[];
}

const VISIBLE_DEFAULT = 14;

export function TagDrawer({ tags }: TagDrawerProps) {
  const { get, getMulti, set, setMulti } = useFilterUrl();
  const active = getMulti("tags");
  const tagMatch = get("tagMatch") ?? "any";
  const initiallyOpen = active.length > 0;
  const [open, setOpen] = useState(initiallyOpen);
  const [showAll, setShowAll] = useState(false);

  function toggle(id: string) {
    setMulti(
      "tags",
      active.includes(id) ? active.filter((t) => t !== id) : [...active, id],
    );
  }

  const visible = showAll ? tags : tags.slice(0, VISIBLE_DEFAULT);
  const hiddenCount = Math.max(0, tags.length - VISIBLE_DEFAULT);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold transition-colors"
      >
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
        # Tags
        {active.length > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold">
            {active.length}
          </span>
        )}
      </button>

      {open && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {visible.map((t) => {
            const isActive = active.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold transition",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                )}
              >
                {t.id}
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "opacity-70" : "opacity-50",
                  )}
                >
                  {t.count}
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
              +{hiddenCount} more
            </button>
          )}
          {showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="text-muted-foreground hover:text-foreground text-[11.5px] font-semibold underline underline-offset-2 transition-colors"
            >
              − less
            </button>
          )}

          {active.length > 0 && (
            <>
              <div className="bg-muted ml-2 flex rounded p-0.5">
                {(["any", "all"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      set("tagMatch", m === "any" ? null : m)
                    }
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition",
                      tagMatch === m
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setMulti("tags", [])}
                className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition"
              >
                <X className="size-3" />
                Clear tags
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
