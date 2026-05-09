"use client";

import { ChevronDown, User } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CreatorFacet } from "@/lib/db/queries/facets";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";

interface CreatorPickerProps {
  creators: CreatorFacet[];
}

function creatorLabel(c: CreatorFacet): string {
  return c.name?.trim() || c.email;
}

export function CreatorPicker({ creators }: CreatorPickerProps) {
  const t = useTranslations("filters.creator");
  const { filters, update } = useFilters();
  const active = filters.creator;
  const activeCreator = creators.find((c) => c.id === active);

  function pick(id: string | undefined) {
    update({ creator: id });
  }

  const trigger = (
    <button
      type="button"
      className="bg-card border-border hover:border-primary/40 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12.5px] outline-none transition data-[popup-open]:border-primary"
    >
      <User aria-hidden className="text-muted-foreground size-3.5" />
      <span className="font-semibold">
        {activeCreator ? creatorLabel(activeCreator) : t("any")}
      </span>
      <ChevronDown aria-hidden className="text-muted-foreground size-3.5" />
    </button>
  );

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent className="w-[280px] p-0" align="start" sideOffset={6}>
        <div className="max-h-72 overflow-y-auto py-1">
          <Option active={active === undefined} onClick={() => pick(undefined)}>
            <span className="flex-1">{t("any")}</span>
          </Option>
          {creators.length === 0 && (
            <div className="text-muted-foreground px-3 py-2 text-[12px]">
              {t("empty")}
            </div>
          )}
          {creators.map((c) => (
            <Option
              key={c.id}
              active={active === c.id}
              onClick={() => pick(c.id)}
            >
              <span className="flex-1 truncate">{creatorLabel(c)}</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {c.count}
              </span>
            </Option>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Option({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-md px-2 py-1 text-left text-[12.5px] transition",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
