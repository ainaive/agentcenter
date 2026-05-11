import { FileText, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import type { ProfileDraftRow } from "@/lib/db/queries/profile";

export function SectionDrafts({ rows }: { rows: ProfileDraftRow[] }) {
  const t = useTranslations("profile");

  if (rows.length === 0) {
    return (
      <div className="border-border bg-card/40 flex flex-col items-center gap-3 rounded-xl border border-dashed px-8 py-16 text-center">
        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
          <FileText className="text-primary size-5" aria-hidden />
        </div>
        <h2 className="text-foreground text-base font-semibold">
          {t("emptyDrafts.title")}
        </h2>
        <p className="text-muted-foreground max-w-xs text-[13px] leading-relaxed">
          {t("emptyDrafts.body")}
        </p>
        <Link
          href="/publish/new"
          className="bg-primary text-primary-foreground hover:opacity-90 mt-1 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-semibold transition-opacity"
        >
          <Plus className="size-3.5" aria-hidden />
          {t("publishOne")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li
          key={r.extensionId}
          className="border-border bg-card hover:border-primary/60 rounded-xl border transition-colors"
        >
          <Link
            href={`/publish/${r.extensionId}/edit`}
            className="flex items-center justify-between gap-3 px-5 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="text-foreground truncate text-[14px] font-semibold">
                {r.name}
              </div>
              <div className="text-muted-foreground mt-0.5 text-[12px]">
                <span className="font-mono">{r.slug}</span>
                {/* Only surface statuses the user can act on: `scanning`
                    (waiting on the scanner) and `rejected` (needs a fix
                    before resubmit). `pending` and `ready` are noisy and
                    don't add information when the row already says
                    Continue. */}
                {(r.latestStatus === "scanning" ||
                  r.latestStatus === "rejected") && (
                  <span> · {t(`draftStatus.${r.latestStatus}`)}</span>
                )}
              </div>
            </div>
            <span className="text-primary shrink-0 text-[12px] font-semibold">
              {t("continueDraft")} →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
