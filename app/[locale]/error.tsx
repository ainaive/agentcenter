"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: Props) {
  const t = useTranslations("errors.generic");

  useEffect(() => {
    console.error("[locale-error-boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <AlertCircle className="text-destructive h-10 w-10" />
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      {/* Don't surface error.message — it can include SQL fragments, file
          paths, or other internals. Show a generic message and surface the
          opaque digest for support correlation. */}
      <p className="text-muted-foreground max-w-sm text-sm">{t("body")}</p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground mt-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
      >
        {t("retry")}
      </button>
      {error.digest && (
        <code className="text-muted-foreground mt-1 font-mono text-[11px]">
          {error.digest}
        </code>
      )}
    </div>
  );
}
