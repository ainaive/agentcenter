"use client";

import { AlertCircle, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Link } from "@/lib/i18n/navigation";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ExtensionDetailError({ error, reset }: Props) {
  const t = useTranslations("detail.errorBoundary");

  useEffect(() => {
    console.error("[extensions/detail]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[1180px] px-7 py-12">
      <div className="border-border bg-card/40 mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
        <AlertCircle className="text-destructive size-8" />
        <h2 className="text-foreground text-base font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted-foreground max-w-sm text-[13.5px] leading-relaxed">
          {t("body")}
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:opacity-90 rounded-md px-4 py-2 text-[13px] font-semibold transition-opacity"
          >
            {t("retry")}
          </button>
          <Link
            href="/extensions"
            className="border-border text-foreground hover:border-primary/50 hover:text-primary inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            {t("back")}
          </Link>
        </div>
        {error.digest && (
          <code className="text-muted-foreground mt-1 font-mono text-[10.5px]">
            {error.digest}
          </code>
        )}
      </div>
    </div>
  );
}
