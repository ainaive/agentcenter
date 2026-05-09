"use client";

import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEPARTMENTS,
  deptPath,
  MY_DEPT_ID,
} from "@/lib/data/departments";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";
import type { Department } from "@/types";

const ALL_DEPTS_TOKEN = "__all";

export function DeptPicker() {
  const t = useTranslations("filters.dept");
  const { filters, update } = useFilters();
  // Default = MY_DEPT_ID per the prototype's behavior; explicit "__all"
  // disables the filter.
  const active = filters.dept ?? MY_DEPT_ID;
  const isAll = active === ALL_DEPTS_TOKEN;
  const isMine = active === MY_DEPT_ID;
  const path = isAll ? null : deptPath(active, "en");

  function pick(id: string) {
    if (id === MY_DEPT_ID) {
      update({ dept: undefined }); // undefined falls back to default = MY_DEPT_ID
    } else {
      update({ dept: id });
    }
  }

  const trigger = (
    <button
      type="button"
      className="bg-card border-border hover:border-primary/40 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12.5px] outline-none transition data-[popup-open]:border-primary"
    >
      <Building2 aria-hidden className="text-muted-foreground size-3.5" />
      <span className="flex min-w-0 items-center gap-1.5">
        {isMine && (
          <span aria-hidden className="bg-primary size-1.5 shrink-0 rounded-full" />
        )}
        {isAll ? (
          <span className="font-semibold">{t("all")}</span>
        ) : (
          path && (
            <>
              {path.length > 1 && (
                <span className="text-muted-foreground truncate text-[11.5px]">
                  {path.slice(0, -1).join(" / ")} /
                </span>
              )}
              <span className="font-semibold">{path[path.length - 1]}</span>
            </>
          )
        )}
      </span>
      <ChevronDown aria-hidden className="text-muted-foreground size-3.5" />
    </button>
  );

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        className="w-[360px] p-0"
        align="start"
        sideOffset={6}
      >
        <div className="border-border flex flex-wrap gap-1.5 border-b p-2.5">
          <Chip active={isMine} onClick={() => pick(MY_DEPT_ID)}>
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                isMine ? "bg-primary-foreground" : "bg-primary",
              )}
            />
            {t("mine")}
          </Chip>
          <Chip active={active === "eng"} onClick={() => pick("eng")}>
            {t("org")}
          </Chip>
          <Chip active={isAll} onClick={() => pick(ALL_DEPTS_TOKEN)}>
            {t("all")}
          </Chip>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          <DeptTree
            list={DEPARTMENTS}
            depth={0}
            active={active}
            onPick={pick}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Chip({
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

interface DeptTreeProps {
  list: Department[];
  depth: number;
  active: string;
  onPick: (id: string) => void;
}

function DeptTree({ list, depth, active, onPick }: DeptTreeProps) {
  return (
    <div>
      {list.map((d) => (
        <DeptNode
          key={d.id}
          dept={d}
          depth={depth}
          active={active}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

function DeptNode({
  dept,
  depth,
  active,
  onPick,
}: {
  dept: Department;
  depth: number;
  active: string;
  onPick: (id: string) => void;
}) {
  const t = useTranslations("filters.dept");
  // Auto-expand the path leading to MY_DEPT_ID.
  const initial =
    MY_DEPT_ID === dept.id || MY_DEPT_ID.startsWith(`${dept.id}.`);
  const [expanded, setExpanded] = useState(initial);
  const isActive = active === dept.id;
  const indent = 8 + depth * 14;

  return (
    <>
      <div
        className="flex items-center"
        style={{ paddingLeft: indent }}
      >
        {dept.children ? (
          <button
            type="button"
            aria-label={`${expanded ? t("collapse") : t("expand")} ${dept.name}`}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((p) => !p);
            }}
            className="text-muted-foreground hover:text-foreground flex size-5 items-center justify-center rounded transition-colors"
          >
            {expanded ? (
              <ChevronDown aria-hidden className="size-3" />
            ) : (
              <ChevronRight aria-hidden className="size-3" />
            )}
          </button>
        ) : (
          <span aria-hidden className="size-5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onPick(dept.id)}
          aria-pressed={isActive}
          className={cn(
            "mx-1 flex flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-[12.5px] transition",
            isActive
              ? "bg-primary/10 text-primary font-semibold"
              : "text-foreground hover:bg-accent",
          )}
        >
          <span className="flex-1">{dept.name}</span>
          {dept.id === MY_DEPT_ID && (
            <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider">
              MINE
            </span>
          )}
        </button>
      </div>
      {dept.children && expanded && (
        <DeptTree
          list={dept.children}
          depth={depth + 1}
          active={active}
          onPick={onPick}
        />
      )}
    </>
  );
}
