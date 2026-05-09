"use client";

import { useTranslations } from "next-intl";

import type { ManifestFormValues } from "@/lib/validators/manifest";

import { ICON_COLORS, type IconColor } from "./icon-colors";

// Sticky right-rail preview that mirrors what the published listing card
// will look like and the JSON manifest the CLI would consume. Pure
// derivation from the current draft state — no fetching, no effects.
export function LivePreview({ draft }: { draft: ManifestFormValues }) {
  const t = useTranslations("publish.preview");
  const tType = useTranslations("publish.type");
  const ic = ICON_COLORS[(draft.iconColor ?? "indigo") as IconColor];
  const initial = (draft.name?.[0] ?? "A").toUpperCase();
  const summary = draft.summary || t("placeholderSummary");

  // Manifest mirror used in the side preview. Stable JSON serialisation —
  // we strip empty strings and undefined permissions so the rendered
  // panel doesn't churn on every keystroke when the user clears a field.
  const manifest = JSON.stringify(
    {
      name: draft.slug || "your-extension",
      displayName: draft.name || "Your Extension",
      type: draft.category,
      version: draft.version || "0.0.0",
      scope: draft.scope,
      description: draft.summary || "",
      tags: draft.tagIds ?? [],
      department: draft.deptId || undefined,
      permissions: Object.entries(draft.permissions ?? {})
        .filter(([, on]) => on)
        .map(([k]) => k),
    },
    null,
    2,
  );

  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {t("cardLabel")}
        </div>
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-start gap-2.5">
            <div
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-display text-base font-bold"
              style={{ background: ic.bg, color: ic.fg }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-foreground">
                {draft.name || t("placeholderName")}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {tType(draft.category)}
              </div>
            </div>
          </div>
          <div className="min-h-[34px] text-[12px] leading-relaxed text-muted-foreground">
            {summary}
          </div>
          {draft.tagIds && draft.tagIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {draft.tagIds.slice(0, 4).map((tg) => (
                <span
                  key={tg}
                  className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary"
                >
                  {tg}
                </span>
              ))}
              {draft.tagIds.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{draft.tagIds.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {t("manifestLabel")}
        </div>
        <pre className="m-0 max-h-72 overflow-auto rounded-md border border-border bg-muted px-3 py-3 font-mono text-[11px] leading-relaxed text-foreground">
          {manifest}
        </pre>
      </section>
    </div>
  );
}
