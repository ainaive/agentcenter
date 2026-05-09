"use client";

import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import type { Locale } from "@/types";

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const nextLocale: Locale = locale === "en" ? "zh" : "en";
  const label = locale === "en" ? "中文" : "EN";
  const ariaLabel = locale === "en" ? t("switchToZh") : t("switchToEn");

  function handleSwitch() {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      aria-label={ariaLabel}
      className="bg-secondary border-border text-foreground hover:bg-secondary/70 flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-semibold transition-colors"
    >
      <Globe aria-hidden className="text-muted-foreground size-[13px]" />
      {label}
    </button>
  );
}
