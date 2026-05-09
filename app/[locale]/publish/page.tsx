import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Package, Plus } from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { getMyExtensions } from "@/lib/actions/publish";
import { isResumable, rowAction } from "@/lib/publish/row-action";
import { Link } from "@/lib/i18n/navigation";
import { DiscardButton } from "@/components/publish/discard-button";

export async function generateMetadata() {
  const t = await getTranslations("publish.dashboard");
  return { title: t("title") };
}

export default async function PublishDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const t = await getTranslations("publish.dashboard");
  const exts = await getMyExtensions(session.user.id);

  const visibilityLabel: Record<string, string> = {
    draft: t("statusDraft"),
    published: t("statusPublished"),
    archived: t("statusArchived"),
  };

  const versionStatusLabel: Record<string, string> = {
    resume_upload: t("versionPendingUpload"),
    resume_submit: t("versionReadyToSubmit"),
    scanning: t("versionScanning"),
    ready: t("versionReady"),
    rejected: t("versionRejected"),
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
        <div className="border-border bg-card/40 mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <Package className="text-muted-foreground/50 size-9" />
          <h2 className="text-foreground text-base font-semibold">
            {t("emptyTitle")}
          </h2>
          <p className="text-muted-foreground max-w-xs text-[13px] leading-relaxed">
            {t("empty")}
          </p>
          <Link
            href="/publish/new"
            className="bg-primary text-primary-foreground hover:opacity-90 mt-1 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-semibold transition-opacity"
          >
            <Plus className="size-3.5" />
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {exts.map((ext) => {
            const action = rowAction(ext.latestStatus, ext.latestBundleFileId !== null);
            const resumable = isResumable(action);
            const visibility = visibilityLabel[ext.visibility] ?? ext.visibility;
            const versionLabel =
              action !== "none" ? versionStatusLabel[action] : null;

            const body = (
              <>
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{ext.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {ext.slug}
                  </span>
                  {versionLabel && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      · {versionLabel}
                    </span>
                  )}
                </div>
                <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                  {visibility}
                </span>
              </>
            );

            return (
              <li
                key={ext.id}
                className="rounded-xl border border-border bg-card transition-colors hover:border-primary/60"
              >
                <div className="flex items-stretch gap-2">
                  {resumable ? (
                    <Link
                      href={`/publish/${ext.id}/edit`}
                      className="flex flex-1 items-center justify-between gap-3 px-5 py-4"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex flex-1 items-center justify-between gap-3 px-5 py-4">
                      {body}
                    </div>
                  )}
                  {ext.visibility === "draft" && (
                    <div className="flex items-center pr-3">
                      <DiscardButton
                        extensionId={ext.id}
                        extensionName={ext.name}
                      />
                    </div>
                  )}
                </div>
                {/* Surface the scan rejection reason inline so a
                    "Rejected" row isn't a dead end — the user sees
                    *why* without a separate page. */}
                {action === "rejected" && ext.latestScanReason && (
                  <div className="border-t border-border px-5 py-3 text-xs text-destructive">
                    <span className="font-medium">{t("rejectedReasonLabel")}: </span>
                    <span className="text-muted-foreground">
                      {ext.latestScanReason}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
