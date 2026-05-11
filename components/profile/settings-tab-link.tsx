"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";

export type SettingsTab = "profile" | "notifications" | "tokens";

export function SettingsTabLink({
  tab,
  active,
}: {
  tab: SettingsTab;
  active: boolean;
}) {
  const t = useTranslations("profile.settings.tabs");
  return (
    <Link
      href={{
        pathname: "/profile",
        query: { section: "settings", tab },
      }}
      aria-current={active ? "page" : undefined}
      className={
        "border-b-2 px-3.5 py-2 text-[13px] transition-colors " +
        (active
          ? "border-primary text-foreground font-semibold"
          : "text-muted-foreground border-transparent font-medium hover:text-foreground")
      }
    >
      {t(tab)}
    </Link>
  );
}
