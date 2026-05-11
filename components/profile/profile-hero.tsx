import { useTranslations } from "next-intl";

type ProfileHeroProps = {
  name: string | null;
  email: string;
  joinedLabel: string;
  deptLabel: string | null;
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
}: ProfileHeroProps) {
  const t = useTranslations("profile");
  const initials = initialsFor(name, email);
  const displayName = name ?? email;

  return (
    <section className="bg-card border-border mb-6 flex items-center gap-6 rounded-2xl border px-7 py-6">
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
    </section>
  );
}
