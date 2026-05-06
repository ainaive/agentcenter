import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { getMyExtensions } from "@/lib/actions/publish";
import { Link } from "@/lib/i18n/navigation";

export async function generateMetadata() {
  const t = await getTranslations("publish.dashboard");
  return { title: t("title") };
}

export default async function PublishDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const t = await getTranslations("publish.dashboard");
  const exts = await getMyExtensions(session.user.id);

  const statusLabel: Record<string, string> = {
    draft: t("statusDraft"),
    published: t("statusPublished"),
    archived: t("statusArchived"),
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <Link
          href="/publish/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          {t("newButton")}
        </Link>
      </div>

      {exts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <ul className="space-y-3">
          {exts.map((ext) => (
            <li
              key={ext.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4"
            >
              <div className="min-w-0 flex-1 truncate">
                <span className="font-medium">{ext.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">{ext.slug}</span>
              </div>
              <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                {statusLabel[ext.visibility] ?? ext.visibility}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
