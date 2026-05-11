"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { updateProfile } from "@/lib/actions/user";
import { DEPARTMENTS } from "@/lib/data/departments";
import type { Department } from "@/types";

type ProfileSettingsUser = {
  name: string | null;
  email: string;
  bio: string | null;
  defaultDeptId: string | null;
  joinedLabel: string;
};

function flattenDepts(
  list: Department[],
  indent = 0,
): { id: string; label: string; indent: number }[] {
  return list.flatMap((d) => [
    { id: d.id, label: d.name, indent },
    ...(d.children ? flattenDepts(d.children, indent + 1) : []),
  ]);
}

const ALL_DEPTS = flattenDepts(DEPARTMENTS);

export function ProfileSettingsForm({ user }: { user: ProfileSettingsUser }) {
  const t = useTranslations("profile");
  const [name, setName] = useState(user.name ?? "");
  const [deptId, setDeptId] = useState(user.defaultDeptId ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "saved" }
    | { kind: "error"; key: "unauthenticated" | "invalid_input" | "generic" }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "idle" });
    startTransition(async () => {
      const result = await updateProfile({
        name,
        defaultDeptId: deptId,
        bio,
      });
      if (result.ok) {
        setStatus({ kind: "saved" });
      } else {
        const key =
          result.error === "unauthenticated" ||
          result.error === "invalid_input"
            ? result.error
            : "generic";
        setStatus({ kind: "error", key });
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid max-w-[680px] grid-cols-1 gap-4 md:grid-cols-2"
    >
      <Field label={t("settings.fields.name")}>
        <input
          aria-label={t("settings.fields.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-card border-input focus:border-ring rounded-md border px-3 py-2 text-[13px] outline-none"
        />
      </Field>

      <Field label={t("settings.fields.email")}>
        <input
          aria-label={t("settings.fields.email")}
          value={user.email}
          disabled
          className="bg-secondary border-input text-muted-foreground rounded-md border px-3 py-2 text-[13px] outline-none"
        />
      </Field>

      <Field label={t("settings.fields.dept")}>
        <select
          aria-label={t("settings.fields.dept")}
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
          className="bg-card border-input focus:border-ring rounded-md border px-3 py-2 text-[13px] outline-none"
        >
          <option value="">{t("settings.deptPlaceholder")}</option>
          {ALL_DEPTS.map((d) => (
            <option key={d.id} value={d.id}>
              {"  ".repeat(d.indent)}
              {d.indent > 0 ? "└ " : ""}
              {d.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("settings.fields.joined")}>
        <input
          aria-label={t("settings.fields.joined")}
          value={user.joinedLabel}
          disabled
          className="bg-secondary border-input text-muted-foreground rounded-md border px-3 py-2 text-[13px] outline-none"
        />
      </Field>

      <div className="md:col-span-2">
        <Field label={t("settings.fields.bio")}>
          <textarea
            aria-label={t("settings.fields.bio")}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="bg-card border-input focus:border-ring resize-y rounded-md border px-3 py-2 text-[13px] outline-none"
          />
        </Field>
      </div>

      <div className="md:col-span-2 mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t("settings.saving") : t("settings.save")}
        </button>
        {status.kind === "saved" && (
          <span
            role="status"
            className="text-primary text-[12.5px] font-medium"
          >
            {t("settings.saved")}
          </span>
        )}
        {status.kind === "error" && (
          <span
            role="alert"
            className="text-destructive text-[12.5px] font-medium"
          >
            {t(`errors.${status.key}`)}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}
