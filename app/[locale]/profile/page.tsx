import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ProfileHero } from "@/components/profile/profile-hero";
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

export default async function ProfilePage() {
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
  const joinedLabel = t("joined", {
    date: formatJoined(user.createdAt, locale),
  });

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8">
      <ProfileHero
        name={user.name}
        email={user.email}
        joinedLabel={joinedLabel}
        deptLabel={deptLabel}
      />
    </main>
  );
}
