import { useLocale, useTranslations } from "next-intl";

export type ProfileHeroStats = {
  installedCount: number;
  publishedCount: number;
  totalInstallsOfMine: number;
  avgRatingOfMine: number | null;
};

type ProfileHeroProps = {
  name: string | null;
  email: string;
  joinedLabel: string;
  deptLabel: string | null;
  stats?: ProfileHeroStats;
};

function initialsFor(name: string | null, email: string): string {
  // Guard against empty / whitespace-only names (a real DB shape — the column
  // is nullable and better-auth sometimes round-trips ""), and against
  // consecutive spaces which would otherwise insert `undefined`s.
  if (name && name.trim()) {
    return name
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "?";
}

export function ProfileHero({
  name,
  email,
  joinedLabel,
  deptLabel,
  stats,
}: ProfileHeroProps) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const initials = initialsFor(name, email);
  const displayName = name ?? email;

  return (
    <section className="bg-card border-border mb-6 flex flex-wrap items-center gap-6 rounded-2xl border px-7 py-6">
      <div
        aria-hidden
        className="bg-primary text-primary-foreground flex size-[72px] flex-shrink-0 items-center justify-center rounded-full font-display text-2xl font-semibold tracking-tight shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-foreground m-0 truncate text-3xl font-semibold tracking-tight">
          {displayName}
        </h1>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
          <span>{t("role")}</span>
          <span aria-hidden className="opacity-50">·</span>
          <span>{deptLabel ?? t("deptUnset")}</span>
          <span aria-hidden className="opacity-50">·</span>
          <span>{joinedLabel}</span>
        </div>
      </div>
      {stats && <HeroStats stats={stats} locale={locale} t={t} />}
    </section>
  );
}

function HeroStats({
  stats,
  locale,
  t,
}: {
  stats: ProfileHeroStats;
  locale: string;
  t: (key: string) => string;
}) {
  const fmt = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US");
  const items = [
    { value: fmt.format(stats.installedCount), label: t("stats.installed") },
    { value: fmt.format(stats.publishedCount), label: t("stats.published") },
    {
      value: fmt.format(stats.totalInstallsOfMine),
      label: t("stats.installs"),
    },
    {
      value:
        stats.avgRatingOfMine != null
          ? stats.avgRatingOfMine.toFixed(1)
          : "—",
      label: t("stats.rating"),
      // Star suffix only when there's at least one rated extension.
      suffix: stats.avgRatingOfMine != null ? "★" : null,
    },
  ];
  return (
    <div className="flex items-center gap-7 pr-2">
      {items.map((it, i) => (
        <div key={it.label} className="flex items-center gap-7">
          {i > 0 && (
            <span aria-hidden className="bg-border h-9 w-px" />
          )}
          <div className="flex flex-col items-start">
            <div className="text-foreground font-display text-2xl font-semibold leading-none tracking-tight tabular-nums">
              {it.value}
              {it.suffix && (
                <span className="text-primary ml-0.5">{it.suffix}</span>
              )}
            </div>
            <div className="text-muted-foreground mt-1.5 text-[11.5px] font-medium uppercase tracking-wider">
              {it.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
