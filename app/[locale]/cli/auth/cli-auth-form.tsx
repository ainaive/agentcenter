"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { authorizeDevice } from "@/lib/actions/device-auth";

export function CliAuthForm() {
  const t = useTranslations("cliAuth");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setLoading(true);
    const result = await authorizeDevice(code.trim());
    setLoading(false);

    if (!result.ok) {
      setError(
        result.error === "invalid_code" || result.error === "expired"
          ? t("errorInvalid")
          : t("errorGeneric"),
      );
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
          <Check className="text-primary size-6" />
        </div>
        <p className="text-foreground text-[14px] font-semibold">
          {t("success")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder={t("codePlaceholder")}
        maxLength={9}
        autoFocus
        className="bg-background border-input focus:border-ring focus:ring-ring/20 w-full rounded-lg border px-3 py-2.5 text-center font-mono text-[18px] font-bold tracking-[0.2em] outline-none transition focus:ring-3"
      />

      {error && (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-[12.5px]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || code.length < 9}
        className="bg-primary text-primary-foreground w-full rounded-lg py-2 text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "…" : t("submit")}
      </button>
    </form>
  );
}
