"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Link } from "@/lib/i18n/navigation";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

// Single error boundary for /publish, /publish/new, and
// /publish/[id]/edit. Next.js cascades a parent `error.tsx` into nested
// segments unless they own one — these three surfaces share the same
// recovery affordance (retry + back to dashboard) so one boundary fits.
export default function PublishError({ error, reset }: Props) {
  const t = useTranslations("publish.errorBoundary");

  useEffect(() => {
    console.error("[publish]", error);
  }, [error]);

  return (
    <div className="px-7 py-12">
      <div className="border-border bg-card/40 mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
        <AlertCircle className="text-destructive size-8" />
        <h2 className="text-foreground text-base font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted-foreground max-w-sm text-[13.5px] leading-relaxed">
          {t("body")}
        </p>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:opacity-90 rounded-md px-4 py-2 text-[13px] font-semibold transition-opacity"
          >
            {t("retry")}
          </button>
          <Link
            href="/publish"
            className="border-border text-muted-foreground hover:bg-muted rounded-md border px-4 py-2 text-[13px] font-semibold transition-colors"
          >
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
