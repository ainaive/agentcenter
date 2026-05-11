import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/profile/coming-soon";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import {
  PROFILE_SECTIONS,
  SectionRail,
  type ProfileSection,
} from "@/components/profile/section-rail";
import {
  SettingsTabLink,
  type SettingsTab,
} from "@/components/profile/settings-tab-link";
import { getSession } from "@/lib/auth/session";
import { deptPath } from "@/lib/data/departments";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/auth";
import type { Locale } from "@/types";

export async function generateMetadata() {
  const t = await getTranslations("profile");
  return { title: t("title") };
}

function formatJoined(date: Date, locale: Locale): string {
  // Intl gives us "Apr 2024" / "2024年4月" cleanly without bespoke per-locale code.
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
  }).format(date);
}

function parseSection(raw: string | string[] | undefined): ProfileSection {
  if (
    typeof raw === "string" &&
    (PROFILE_SECTIONS as readonly string[]).includes(raw)
  ) {
    return raw as ProfileSection;
  }
  return "installed";
}

const SETTINGS_TABS: readonly SettingsTab[] = [
  "profile",
  "notifications",
  "tokens",
];

function parseSettingsTab(raw: string | string[] | undefined): SettingsTab {
  if (
    typeof raw === "string" &&
    (SETTINGS_TABS as readonly string[]).includes(raw)
  ) {
    return raw as SettingsTab;
  }
  return "profile";
}

type SearchParams = Promise<{
  section?: string | string[];
  tab?: string | string[];
}>;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("profile");

  const row = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      bio: users.bio,
      defaultDeptId: users.defaultDeptId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  // A signed-in session should always have a matching user row. If it
  // doesn't, the session is stale — bounce to sign-in so a clean login
  // restores invariants.
  if (row.length === 0) redirect("/sign-in");
  const user = row[0];

  const deptLabel = user.defaultDeptId
    ? deptPath(user.defaultDeptId, locale).reverse().join(" · ") || null
    : null;
  const joinedShort = formatJoined(user.createdAt, locale);
  const joinedLabel = t("joined", { date: joinedShort });

  const params = await searchParams;
  const activeSection = parseSection(params.section);
  const activeTab = parseSettingsTab(params.tab);

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8">
      <ProfileHero
        name={user.name}
        email={user.email}
        joinedLabel={joinedLabel}
        deptLabel={deptLabel}
      />
      <div className="flex items-start gap-7">
        <SectionRail activeKey={activeSection} />
        <div className="min-w-0 flex-1">
          {activeSection === "settings" ? (
            <SettingsBody
              activeTab={activeTab}
              user={{
                name: user.name,
                email: user.email,
                bio: user.bio,
                defaultDeptId: user.defaultDeptId,
                joinedLabel: joinedShort,
              }}
            />
          ) : (
            <ComingSoon sectionLabel={t(`sections.${activeSection}`)} />
          )}
        </div>
      </div>
    </main>
  );
}

function SettingsBody({
  activeTab,
  user,
}: {
  activeTab: SettingsTab;
  user: {
    name: string | null;
    email: string;
    bio: string | null;
    defaultDeptId: string | null;
    joinedLabel: string;
  };
}) {
  return (
    <div>
      <div className="border-border mb-5 flex gap-1 border-b">
        {SETTINGS_TABS.map((tab) => (
          <SettingsTabLink key={tab} tab={tab} active={tab === activeTab} />
        ))}
      </div>
      {activeTab === "profile" ? (
        <ProfileSettingsForm user={user} />
      ) : (
        <SettingsTabPlaceholder tab={activeTab} />
      )}
    </div>
  );
}

async function SettingsTabPlaceholder({ tab }: { tab: SettingsTab }) {
  const t = await getTranslations("profile.settings.tabs");
  return <ComingSoon sectionLabel={t(tab)} />;
}
