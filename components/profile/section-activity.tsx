import { CheckCircle, Clock, Star, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import type { ProfileActivityEvent } from "@/lib/db/queries/profile";

function ActivityIcon({ kind }: { kind: ProfileActivityEvent["kind"] }) {
  if (kind === "installed")
    return <CheckCircle className="text-primary size-4 shrink-0" aria-hidden />;
  if (kind === "published")
    return <Upload className="text-primary size-4 shrink-0" aria-hidden />;
  return <Star className="text-primary size-4 shrink-0" aria-hidden />;
}

export function SectionActivity({
  events,
}: {
  events: ProfileActivityEvent[];
}) {
  const t = useTranslations("profile");

  if (events.length === 0) {
    return (
      <div className="border-border bg-card/40 flex flex-col items-center gap-3 rounded-xl border border-dashed px-8 py-16 text-center">
        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
          <Clock className="text-primary size-5" aria-hidden />
        </div>
        <h2 className="text-foreground text-base font-semibold">
          {t("emptyActivity.title")}
        </h2>
        <p className="text-muted-foreground max-w-xs text-[13px] leading-relaxed">
          {t("emptyActivity.body")}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {events.map((e, i) => (
        <li
          key={`${e.kind}-${e.extensionId}-${e.at.toISOString()}-${i}`}
          className={
            "flex items-center gap-3 py-3 " +
            (i > 0 ? "border-border border-t" : "")
          }
        >
          <ActivityIcon kind={e.kind} />
          <div className="min-w-0 flex-1">
            <div className="text-foreground text-[13px]">
              <span className="text-muted-foreground">
                {t(`activity.${e.kind}`)}
              </span>{" "}
              <Link
                href={`/extensions/${e.slug}`}
                className="hover:text-primary font-semibold transition-colors"
              >
                {e.name}
              </Link>
              {e.kind === "rated" ? (
                <span className="text-primary ml-1.5">
                  {"★".repeat(e.stars)}
                </span>
              ) : (
                <span className="text-muted-foreground ml-1.5 font-mono text-[12px]">
                  {e.version}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
