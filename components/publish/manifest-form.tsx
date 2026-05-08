"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { TAG_LABELS } from "@/lib/tags";
import { DEPARTMENTS } from "@/lib/data/departments";
import {
  SEMVER_PATTERN,
  SLUG_PATTERN,
  type ManifestFormValues,
} from "@/lib/validators/manifest";
import type { Department } from "@/types";

interface Props {
  onSubmit: (values: ManifestFormValues) => void;
  defaultValues?: Partial<ManifestFormValues>;
}

function flattenDepts(list: Department[], depth = 0): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const d of list) {
    out.push({ id: d.id, label: "  ".repeat(depth) + d.name });
    if (d.children) out.push(...flattenDepts(d.children, depth + 1));
  }
  return out;
}

const DEPT_OPTIONS = flattenDepts(DEPARTMENTS);
const TAG_OPTIONS = Object.entries(TAG_LABELS).map(([id, label]) => ({ id, label: label.en }));

export function ManifestForm({ onSubmit, defaultValues }: Props) {
  const t = useTranslations("publish.form");
  const tw = useTranslations("publish.wizard");

  const [values, setValues] = useState<ManifestFormValues>({
    slug: "",
    name: "",
    nameZh: "",
    version: "1.0.0",
    category: "skills",
    scope: "personal",
    funcCat: "workTask",
    subCat: "",
    l2: "",
    deptId: "",
    tagIds: [],
    description: "",
    descriptionZh: "",
    tagline: "",
    homepageUrl: "",
    repoUrl: "",
    licenseSpdx: "",
    ...defaultValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ManifestFormValues, string>>>({});

  function field(key: keyof ManifestFormValues) {
    return {
      value: String(values[key] ?? ""),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setValues((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!values.slug) errs.slug = "Required";
    else if (values.slug.length < 3) errs.slug = "Min 3 chars";
    else if (!SLUG_PATTERN.test(values.slug)) errs.slug = t("slug");
    if (!values.name) errs.name = "Required";
    else if (values.name.length < 2) errs.name = "Min 2 chars";
    if (!values.version || !SEMVER_PATTERN.test(values.version)) errs.version = t("versionHint");
    if (!values.subCat) errs.subCat = "Required";
    if (!values.description) errs.description = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(values);
  }

  function toggleTag(id: string) {
    setValues((v) => ({
      ...v,
      tagIds: v.tagIds.includes(id)
        ? v.tagIds.filter((t) => t !== id)
        : v.tagIds.length < 8
          ? [...v.tagIds, id]
          : v.tagIds,
    }));
  }

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelCls = "block text-sm font-medium text-muted-foreground mb-1";
  const errorCls = "mt-1 text-xs text-destructive";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Slug + Version */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t("slug")} *</label>
          <input className={inputCls} {...field("slug")} placeholder="my-extension" minLength={3} maxLength={64} />
          {errors.slug && <p className={errorCls}>{errors.slug}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{t("slugHint")}</p>
        </div>
        <div>
          <label className={labelCls}>{t("version")} *</label>
          <input className={inputCls} {...field("version")} placeholder="1.0.0" />
          {errors.version && <p className={errorCls}>{errors.version}</p>}
        </div>
      </div>

      {/* Name EN + ZH */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t("name")} *</label>
          <input className={inputCls} {...field("name")} minLength={2} maxLength={80} />
          {errors.name && <p className={errorCls}>{errors.name}</p>}
        </div>
        <div>
          <label className={labelCls}>{t("nameZh")}</label>
          <input className={inputCls} {...field("nameZh")} />
        </div>
      </div>

      {/* Category + Scope */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t("category")} *</label>
          <select className={inputCls} {...field("category")}>
            {(["skills", "mcp", "slash", "plugins"] as const).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("scope")} *</label>
          <select className={inputCls} {...field("scope")}>
            {(["personal", "org", "enterprise"] as const).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* FuncCat + SubCat + L2 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>{t("funcCat")} *</label>
          <select className={inputCls} {...field("funcCat")}>
            {(["workTask", "business", "tools"] as const).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("subCat")} *</label>
          <input className={inputCls} {...field("subCat")} placeholder="e.g. search" />
          {errors.subCat && <p className={errorCls}>{errors.subCat}</p>}
        </div>
        <div>
          <label className={labelCls}>{t("l2")}</label>
          <input className={inputCls} {...field("l2")} />
        </div>
      </div>

      {/* Dept */}
      <div>
        <label className={labelCls}>{t("dept")}</label>
        <select className={inputCls} {...field("deptId")}>
          <option value="">— none —</option>
          {DEPT_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>{t("tags")} <span className="text-muted-foreground font-normal">({t("tagsHint")})</span></label>
        <div className="flex flex-wrap gap-2 mt-1">
          {TAG_OPTIONS.map(({ id, label }) => {
            const active = values.tagIds.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleTag(id)}
                className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tagline */}
      <div>
        <label className={labelCls}>{t("tagline")}</label>
        <input className={inputCls} {...field("tagline")} maxLength={120} />
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t("description")} *</label>
          <textarea className={inputCls} {...field("description")} rows={3} maxLength={280} />
          {errors.description && <p className={errorCls}>{errors.description}</p>}
        </div>
        <div>
          <label className={labelCls}>{t("descriptionZh")}</label>
          <textarea className={inputCls} {...field("descriptionZh")} rows={3} maxLength={280} />
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>{t("homepageUrl")}</label>
          <input className={inputCls} {...field("homepageUrl")} type="url" placeholder="https://" />
        </div>
        <div>
          <label className={labelCls}>{t("repoUrl")}</label>
          <input className={inputCls} {...field("repoUrl")} type="url" placeholder="https://github.com/…" />
        </div>
        <div>
          <label className={labelCls}>{t("licenseSpdx")}</label>
          <input className={inputCls} {...field("licenseSpdx")} placeholder="MIT" />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {tw("nextButton")}
        </button>
      </div>
    </form>
  );
}
