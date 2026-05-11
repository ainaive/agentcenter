import {
  Bookmark,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";

// Source-of-truth ordered list of section keys. `parseSection()` in the page
// uses this to validate the query param before passing it back here.
export const PROFILE_SECTIONS = [
  "installed",
  "published",
  "drafts",
  "saved",
  "activity",
  "settings",
] as const;

export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

const ICONS: Record<ProfileSection, typeof CheckCircle> = {
  installed: CheckCircle,
  published: Upload,
  drafts: FileText,
  saved: Bookmark,
  activity: Clock,
  settings: Settings,
};

type SectionRailProps = {
  activeKey: ProfileSection;
};

export function SectionRail({ activeKey }: SectionRailProps) {
  const t = useTranslations("profile");
  return (
    <nav
      aria-label={t("title")}
      className="flex w-[200px] flex-shrink-0 flex-col gap-0.5"
    >
      {PROFILE_SECTIONS.map((key) => {
        const Icon = ICONS[key];
        const active = key === activeKey;
        return (
          <Link
            key={key}
            href={{ pathname: "/profile", query: { section: key } }}
            aria-current={active ? "page" : undefined}
            className={
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors " +
              (active
                ? "bg-primary/10 text-foreground font-semibold"
                : "text-muted-foreground hover:bg-secondary font-medium")
            }
          >
            <Icon
              className={"size-3.5 " + (active ? "text-primary" : "")}
              aria-hidden
            />
            <span className="flex-1">{t(`sections.${key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
