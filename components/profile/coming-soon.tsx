import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export function ComingSoon({ sectionLabel }: { sectionLabel: string }) {
  const t = useTranslations("profile.comingSoon");
  return (
    <div className="border-border bg-card/40 flex flex-col items-center gap-3 rounded-xl border border-dashed px-8 py-16 text-center">
      <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
        <Sparkles className="text-primary size-5" aria-hidden />
      </div>
      <h2 className="text-foreground text-base font-semibold">
        {sectionLabel} · {t("title")}
      </h2>
      <p className="text-muted-foreground max-w-xs text-[13px] leading-relaxed">
        {t("body")}
      </p>
    </div>
  );
}
