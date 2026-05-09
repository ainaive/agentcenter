"use client";

import { Building2, Check, ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DEPARTMENTS, deptPath } from "@/lib/data/departments";
import type { Locale } from "@/types";
import type { ManifestFormValues } from "@/lib/validators/manifest";
import { cn } from "@/lib/utils";
import type { Department } from "@/types";

import { ICON_COLORS, ICON_COLOR_KEYS, type IconColor } from "../icon-colors";
import { PubField, PubTextarea } from "../shared";

type Patch = Partial<ManifestFormValues>;

const PERMISSION_KEYS = ["network", "files", "runtime", "data"] as const;
type PermissionKey = (typeof PERMISSION_KEYS)[number];

const SUGGESTED_TAGS = [
  "stable",
  "beta",
  "official",
  "ai",
  "search",
  "data",
  "productivity",
];

export function ListingStep({
  draft,
  patch,
  locale,
}: {
  draft: ManifestFormValues;
  patch: (p: Patch) => void;
  locale: Locale;
}) {
  const t = useTranslations("publish.listing");
  const tPerm = useTranslations("publish.permissions");
  const [tagInput, setTagInput] = useState("");

  const tags = draft.tagIds ?? [];
  const initial = (draft.name?.[0] ?? "A").toUpperCase();
  const ic = ICON_COLORS[(draft.iconColor ?? "indigo") as IconColor];

  function addTag(raw: string) {
    const v = raw.trim().toLowerCase();
    if (!v || tags.includes(v) || tags.length >= 8) return;
    patch({ tagIds: [...tags, v] });
  }
  function removeTag(tag: string) {
    patch({ tagIds: tags.filter((x) => x !== tag) });
  }
  function togglePermission(key: PermissionKey) {
    // PermissionsSchema is `Partial<Record<PermissionKey, boolean>>` —
    // copy as that exact shape so unexpected keys can't sneak through.
    const cur: Partial<Record<PermissionKey, boolean>> =
      draft.permissions ?? {};
    patch({ permissions: { ...cur, [key]: !cur[key] } });
  }

  const suggested = SUGGESTED_TAGS.filter((s) => !tags.includes(s));
  const tagsAtLimit = tags.length >= 8;

  return (
    <div className="flex flex-col gap-5">
      <PubField label={t("icon")} hint={t("iconHint")} optional={t("optional")}>
        <div className="flex items-center gap-3.5">
          <div
            aria-hidden
            className="flex h-16 w-16 items-center justify-center rounded-2xl font-display text-3xl font-bold"
            style={{ background: ic.bg, color: ic.fg }}
          >
            {initial}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ICON_COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patch({ iconColor: c })}
                aria-label={c}
                aria-pressed={draft.iconColor === c}
                style={{ background: ICON_COLORS[c].bg }}
                className={cn(
                  "h-[22px] w-[22px] rounded-md transition-all",
                  draft.iconColor === c
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                    : "ring-1 ring-border",
                )}
              />
            ))}
          </div>
        </div>
      </PubField>

      <PubField
        label={t("tags")}
        hint={t("tagsCount", { count: tags.length, max: 8 })}
        required
      >
        <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border border-border bg-card p-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 py-1 pl-2.5 pr-1 font-mono text-[12px] font-semibold text-primary"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => removeTag(tag)}
                className="inline-flex p-0.5 text-primary hover:opacity-70"
              >
                <X aria-hidden className="size-3" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagInput);
                setTagInput("");
              } else if (
                e.key === "Backspace" &&
                tagInput === "" &&
                tags.length > 0
              ) {
                removeTag(tags[tags.length - 1]);
              }
            }}
            disabled={tagsAtLimit}
            placeholder={
              tagsAtLimit ? t("tagsLimitReached") : t("tagsPlaceholder")
            }
            className="min-w-[120px] flex-1 border-none bg-transparent px-1.5 py-1 text-[13px] outline-none disabled:cursor-not-allowed"
          />
        </div>
        {suggested.length > 0 && !tagsAtLimit && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {suggested.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="rounded border border-dashed border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </PubField>

      <PubField label={t("dept")} hint={t("deptHint")}>
        <DeptDropdown
          value={draft.deptId ?? ""}
          onChange={(id) => patch({ deptId: id || undefined })}
          locale={locale}
          placeholder={t("deptPlaceholder")}
        />
      </PubField>

      <PubField label={t("readme")} hint={t("readmeHint")} required>
        <PubTextarea
          value={draft.readmeMd ?? ""}
          onChange={(v) => patch({ readmeMd: v })}
          placeholder={t("readmePlaceholder")}
          rows={8}
          mono
        />
      </PubField>

      <PubField label={tPerm("label")} hint={tPerm("hint")}>
        <div className="flex flex-col gap-2">
          {PERMISSION_KEYS.map((k) => {
            const on = Boolean(
              (draft.permissions as Record<string, boolean> | undefined)?.[k],
            );
            return (
              <button
                key={k}
                type="button"
                onClick={() => togglePermission(k)}
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-all",
                  on
                    ? "border-primary bg-primary/[0.04]"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px]",
                    on
                      ? "border-primary bg-primary"
                      : "border-border bg-transparent",
                  )}
                >
                  {on && (
                    <Check
                      aria-hidden
                      className="size-2.5 text-primary-foreground"
                    />
                  )}
                </span>
                <span className="text-[12.5px] text-foreground">
                  {tPerm(k)}
                </span>
              </button>
            );
          })}
        </div>
      </PubField>
    </div>
  );
}

// Lightweight, controlled department picker for the publish wizard.
// Different from `components/filters/dept-picker` — that one is wired to
// the URL filter state for browsing; this one is a plain controlled
// input. Flat list with indented children, single-select.
function DeptDropdown({
  value,
  onChange,
  locale,
  placeholder,
}: {
  value: string;
  onChange: (id: string) => void;
  locale: Locale;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const flat = flattenDepartments(DEPARTMENTS, locale);
  const labelPath = value ? deptPath(value, locale).join(" / ") : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2.5 rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none transition-colors hover:border-primary/40 focus:border-primary"
          >
            <span className="inline-flex items-center gap-2 truncate">
              <Building2
                aria-hidden
                className="size-3.5 text-muted-foreground"
              />
              <span className={cn(!value && "text-muted-foreground")}>
                {value ? labelPath : placeholder}
              </span>
            </span>
            <ChevronDown
              aria-hidden
              className="size-3 text-muted-foreground"
            />
          </button>
        }
      />
      <PopoverContent
        align="start"
        sideOffset={4}
        className="max-h-[260px] w-[var(--anchor-width)] overflow-auto p-1"
      >
        {flat.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              onChange(d.id);
              setOpen(false);
            }}
            style={{ paddingLeft: 10 + d.depth * 16 }}
            className={cn(
              "flex w-full items-center rounded px-2.5 py-1.5 text-left text-[12.5px] transition-colors",
              value === d.id
                ? "bg-primary/10 font-semibold text-primary"
                : "text-foreground hover:bg-accent",
            )}
          >
            {d.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function flattenDepartments(
  list: Department[],
  locale: Locale,
  depth = 0,
): Array<{ id: string; name: string; depth: number }> {
  const out: Array<{ id: string; name: string; depth: number }> = [];
  for (const d of list) {
    out.push({
      id: d.id,
      name: locale === "zh" ? d.nameZh : d.name,
      depth,
    });
    if (d.children) {
      out.push(...flattenDepartments(d.children, locale, depth + 1));
    }
  }
  return out;
}
