"use client";

import { Bolt, Globe, Plug, SlashSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { ManifestFormValues } from "@/lib/validators/manifest";
import { cn } from "@/lib/utils";

import { PubChoice, PubField, PubInput } from "../shared";

type Patch = Partial<ManifestFormValues>;

// Slugify the user's name into the slug field. Same rules the design
// uses (line 2669): lowercase, runs of non-alphanumerics collapse to
// single hyphens, trim leading/trailing hyphens, cap at 40 chars.
export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function BasicsStep({
  draft,
  patch,
  lockedFields,
}: {
  draft: ManifestFormValues;
  patch: (p: Patch) => void;
  lockedFields?: ReadonlyArray<keyof ManifestFormValues>;
}) {
  const t = useTranslations("publish.basics");
  const tType = useTranslations("publish.type");
  const tScope = useTranslations("publish.scope");
  const [zhOpen, setZhOpen] = useState(
    Boolean(draft.nameZh) || Boolean(draft.taglineZh),
  );

  const isLocked = (k: keyof ManifestFormValues) =>
    lockedFields?.includes(k) ?? false;

  // Re-derive slug from name unless the user has hand-edited the slug
  // (we detect that by checking whether the current slug matches what
  // we'd derive — same rule as the design).
  function setName(next: string) {
    const auto = slugFromName(draft.name);
    const update: Patch = { name: next };
    if (!isLocked("slug") && (!draft.slug || draft.slug === auto)) {
      update.slug = slugFromName(next);
    }
    patch(update);
  }

  const types = [
    { k: "skills" as const, icon: Bolt },
    { k: "mcp" as const, icon: Globe },
    { k: "slash" as const, icon: SlashSquare },
    { k: "plugins" as const, icon: Plug },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PubField label={t("name")} hint={t("nameHint")} required>
        <PubInput
          value={draft.name}
          onChange={setName}
          placeholder={t("namePlaceholder")}
        />
      </PubField>

      <PubField label={t("slug")} hint={t("slugHint")} required>
        <PubInput
          value={draft.slug}
          onChange={(v) => patch({ slug: v })}
          placeholder="web-search-pro"
          mono
          readOnly={isLocked("slug")}
        />
      </PubField>

      <PubField label={t("version")} required>
        <PubInput
          value={draft.version}
          onChange={(v) => patch({ version: v })}
          placeholder="1.0.0"
          mono
          readOnly={isLocked("version")}
        />
      </PubField>

      <PubField label={t("summary")} required>
        <PubInput
          value={draft.summary}
          onChange={(v) => patch({ summary: v })}
          placeholder={t("summaryPlaceholder")}
        />
      </PubField>

      <PubField label={tType("label")} required>
        {/* radiogroup semantics so screen readers announce the selected
            type — visual highlight alone is invisible to assistive tech. */}
        <div
          role="radiogroup"
          aria-label={tType("label")}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {types.map(({ k, icon: Icon }) => {
            const active = draft.category === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => patch({ category: k })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border border-[1.5px] px-2 py-3.5 text-[12px] font-semibold transition-all",
                  active
                    ? "border-primary bg-primary/[0.05] text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "size-[18px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span>{tType(k)}</span>
              </button>
            );
          })}
        </div>
      </PubField>

      <PubField label={tScope("label")} required>
        <div
          role="radiogroup"
          aria-label={tScope("label")}
          className="flex flex-col gap-2.5"
        >
          <PubChoice
            value="personal"
            current={draft.scope}
            onClick={() => patch({ scope: "personal" })}
            title={tScope("personalTitle")}
            desc={tScope("personalDesc")}
          />
          <PubChoice
            value="org"
            current={draft.scope}
            onClick={() => patch({ scope: "org" })}
            title={tScope("orgTitle")}
            desc={tScope("orgDesc")}
          />
          <PubChoice
            value="enterprise"
            current={draft.scope}
            onClick={() => patch({ scope: "enterprise" })}
            title={tScope("enterpriseTitle")}
            desc={tScope("enterpriseDesc")}
          />
        </div>
      </PubField>

      {/* Optional Chinese-translation panel. Collapsed by default; the
          fields exist in the schema so anyone publishing for a bilingual
          marketplace can still fill them in without leaving the wizard. */}
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-3.5 py-3">
        <button
          type="button"
          onClick={() => setZhOpen((v) => !v)}
          className="flex w-full items-center justify-between text-[12.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>{t("zhToggle")}</span>
          <span className="text-[11px]">{zhOpen ? "−" : "+"}</span>
        </button>
        {zhOpen && (
          <div className="mt-3 flex flex-col gap-4">
            <PubField label={t("nameZh")} optional={t("optional")}>
              <PubInput
                value={draft.nameZh ?? ""}
                onChange={(v) => patch({ nameZh: v })}
                placeholder="例如：网页搜索 Pro"
              />
            </PubField>
            <PubField label={t("summaryZh")} optional={t("optional")}>
              <PubInput
                value={draft.taglineZh ?? ""}
                onChange={(v) => patch({ taglineZh: v })}
                placeholder="一句话简介"
              />
            </PubField>
          </div>
        )}
      </div>
    </div>
  );
}
