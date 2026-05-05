"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { DEPARTMENTS } from "@/lib/data/departments";
import { updateDepartment } from "@/lib/actions/user";
import { useRouter } from "@/lib/i18n/navigation";
import type { Department } from "@/types";

function flattenDepts(
  depts: Department[],
  indent = 0,
): { id: string; label: string; indent: number }[] {
  return depts.flatMap((d) => [
    { id: d.id, label: d.name, indent },
    ...(d.children ? flattenDepts(d.children, indent + 1) : []),
  ]);
}

const ALL_DEPTS = flattenDepts(DEPARTMENTS);

export default function OnboardPage() {
  const t = useTranslations("auth.onboard");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deptId, setDeptId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deptId) return;
    setLoading(true);
    await updateDepartment(deptId);
    setLoading(false);
    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  function handleSkip() {
    startTransition(() => {
      router.push("/");
    });
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-20">
      <div className="bg-card border-border w-full max-w-[420px] rounded-xl border p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="mb-7 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <span className="serif text-primary text-xl font-light italic">
              A
            </span>
          </div>
          <h1 className="serif text-2xl tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="bg-background border-input focus:border-ring focus:ring-ring/20 w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none transition focus:ring-3"
          >
            <option value="" disabled>
              {t("placeholder")}
            </option>
            {ALL_DEPTS.map((d) => (
              <option key={d.id} value={d.id}>
                {"  ".repeat(d.indent)}
                {d.indent > 0 ? "└ " : ""}
                {d.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!deptId || loading}
            className="bg-primary text-primary-foreground w-full rounded-lg py-2 text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "…" : t("submit")}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground text-[12.5px] transition"
          >
            {t("skip")}
          </button>
        </form>
      </div>
    </div>
  );
}
