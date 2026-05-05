"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { Link, useRouter } from "@/lib/i18n/navigation";

export default function SignInPage() {
  const t = useTranslations("auth.signIn");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    setError(null);
    setLoading(true);

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(
        authError.status === 401 ? t("errorInvalid") : t("errorGeneric"),
      );
      return;
    }

    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-20">
      <div className="bg-card border-border w-full max-w-[380px] rounded-xl border p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="mb-7 text-center">
          <h1 className="serif text-2xl tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1.5 text-[13px]">
            {t("subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label={t("email")}>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="bg-background border-input focus:border-ring focus:ring-ring/20 w-full rounded-lg border px-3 py-2 text-[13px] outline-none transition focus:ring-3"
            />
          </Field>

          <Field label={t("password")}>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="bg-background border-input focus:border-ring focus:ring-ring/20 w-full rounded-lg border px-3 py-2 text-[13px] outline-none transition focus:ring-3"
            />
          </Field>

          {error && (
            <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-[12.5px]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground mt-1 w-full rounded-lg py-2 text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "…" : t("submit")}
          </button>
        </form>

        <p className="text-muted-foreground mt-5 text-center text-[12.5px]">
          {t("noAccount")}{" "}
          <Link
            href="/sign-up"
            className="text-primary font-semibold hover:underline"
          >
            {t("signUpLink")}
          </Link>
        </p>
      </div>
    </div>
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
    <div className="flex flex-col gap-1.5">
      <label className="text-foreground text-[12.5px] font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}
