"use client";

import { Check, ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createDraftExtension,
  submitForReview,
  updateDraftExtension,
} from "@/lib/actions/publish";
import type { Locale } from "@/types";
import { Link } from "@/lib/i18n/navigation";
import type { ManifestFormValues } from "@/lib/validators/manifest";
import { cn } from "@/lib/utils";

import { LivePreview } from "./live-preview";
import { BasicsStep } from "./steps/basics";
import { ListingStep } from "./steps/listing";
import { ReviewStep } from "./steps/review";
import { SourceStep } from "./steps/source";

const STEP_KEYS = ["basics", "source", "listing", "review"] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4; // 4 = success

const KNOWN_ERROR_CODES = new Set([
  "unauthenticated",
  "invalid_input",
  "slug_taken",
  "version_taken",
  "unique_conflict",
  "invalid_dept",
  "invalid_tag",
  "org_missing",
  "invalid_reference",
  "missing_required",
  "no_bundle",
  "version_not_submittable",
  "version_not_editable",
  "scan_queue_unavailable",
  "db_error",
]);

// Subset of `DraftSnapshot` returned by the resume server action — kept
// here as a structural type so this client component doesn't import
// server-only modules.
export interface ResumeDraft {
  extensionId: string;
  versionId: string;
  slug: string;
  version: string;
  name: string;
  category: string;
  scope: string;
  bundleUploaded: boolean;
  formValues: ManifestFormValues;
}

const EMPTY_DRAFT: ManifestFormValues = {
  slug: "",
  name: "",
  nameZh: "",
  version: "1.0.0",
  category: "skills",
  scope: "personal",
  summary: "",
  taglineZh: "",
  readmeMd: "",
  iconColor: "indigo",
  tagIds: [],
  deptId: "",
  permissions: {},
  sourceMethod: "zip",
};

interface UploadWizardProps {
  resume?: ResumeDraft;
}

export function UploadWizard({ resume }: UploadWizardProps = {}) {
  const tw = useTranslations("publish.wizard");
  const te = useTranslations("publish.errors");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [draft, setDraft] = useState<ManifestFormValues>(
    resume?.formValues ?? EMPTY_DRAFT,
  );
  // Whichever step we land on initially mirrors what is already saved:
  // brand-new drafts start at Basics; a resume with an uploaded bundle
  // can jump straight to Review; everything else lands on Source.
  const [step, setStep] = useState<StepIndex>(() => {
    if (!resume) return 0;
    return resume.bundleUploaded ? 3 : 1;
  });
  const [extensionId, setExtensionId] = useState<string | null>(
    resume?.extensionId ?? null,
  );
  const [versionId, setVersionId] = useState<string | null>(
    resume?.versionId ?? null,
  );
  const [bundleUploaded, setBundleUploaded] = useState(
    resume?.bundleUploaded ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function patch(p: Partial<ManifestFormValues>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function describeError(code: string) {
    return KNOWN_ERROR_CODES.has(code) ? te(code) : te("fallback");
  }
  function reportError(msg: string, detail?: string | null) {
    setError(msg);
    setErrorDetail(detail ?? null);
  }
  function clearError() {
    setError(null);
    setErrorDetail(null);
  }

  // Per-step validity. Drives the Next button and the rail check marks.
  // Source is "valid" once the bundle has been uploaded — picking the
  // method alone isn't enough to advance.
  const stepsValid = [
    Boolean(draft.name && draft.slug && draft.summary && draft.category && draft.scope),
    bundleUploaded,
    Boolean(draft.tagIds.length > 0 && draft.readmeMd),
    true,
  ];

  // Advancing from Basics persists the draft (or updates an existing one),
  // since downstream steps need a versionId to attach the bundle to and
  // a stable slug for the R2 key.
  async function advanceFromBasics() {
    clearError();
    setBusy(true);
    try {
      if (extensionId) {
        const result = await updateDraftExtension(extensionId, draft);
        if (!result.ok) {
          reportError(describeError(result.error), result.detail ?? null);
          return;
        }
      } else {
        const result = await createDraftExtension(draft);
        if (!result.ok) {
          reportError(describeError(result.error), result.detail ?? null);
          return;
        }
        setExtensionId(result.extensionId);
        setVersionId(result.versionId);
      }
      setStep(1);
    } finally {
      setBusy(false);
    }
  }

  // Save Draft persists current edits and bounces to the dashboard.
  // If there's nothing to save (no draft yet AND Basics is incomplete),
  // surface that instead of redirecting — otherwise the user's in-memory
  // edits silently disappear when they land on the dashboard.
  const canSaveDraft = Boolean(extensionId) || stepsValid[0];
  async function saveDraft() {
    if (!canSaveDraft) return;
    clearError();
    setBusy(true);
    try {
      if (extensionId) {
        const result = await updateDraftExtension(extensionId, draft);
        if (!result.ok) {
          reportError(describeError(result.error), result.detail ?? null);
          return;
        }
      } else {
        const result = await createDraftExtension(draft);
        if (!result.ok) {
          reportError(describeError(result.error), result.detail ?? null);
          return;
        }
      }
      router.push(`/${locale}/publish`);
    } finally {
      setBusy(false);
    }
  }

  async function submitFinal() {
    if (!versionId) return;
    clearError();
    setBusy(true);
    try {
      // Persist the latest Listing-step edits before submitting so the
      // server-side review runs against what the user just saw.
      if (extensionId) {
        const upd = await updateDraftExtension(extensionId, draft);
        if (!upd.ok) {
          reportError(describeError(upd.error), upd.detail ?? null);
          return;
        }
      }
      const result = await submitForReview(versionId);
      if (!result.ok) {
        reportError(describeError(result.error), result.detail ?? null);
        return;
      }
      setStep(4);
    } finally {
      setBusy(false);
    }
  }

  // Success view — friendly card with scope-aware copy.
  if (step === 4) {
    const isAuto = draft.scope === "personal";
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Check aria-hidden className="size-10 text-primary" />
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          {tw("successTitle")}
        </h2>
        <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          {isAuto ? tw("successAutoBody") : tw("successReviewBody")}
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href="/publish"
            className="rounded-md bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground hover:opacity-90"
          >
            {tw("backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  const titleKey = STEP_KEYS[step];

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Header — matches the design's centred title + close link + Save */}
      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <Link
            href="/publish"
            className="mb-2 inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft aria-hidden className="size-3" />
            {tw("backToDashboard")}
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {tw("title")}
          </h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
            {tw("subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={saveDraft}
          disabled={busy || !canSaveDraft}
          className="rounded-md border border-border bg-transparent px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {tw("saveDraft")}
        </button>
      </div>

      {resume && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              {tw("resumingLabel")}
            </div>
            <div className="mt-0.5 truncate text-[14px] font-semibold">
              {resume.name}
            </div>
            <div className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
              {resume.slug} · v{resume.version}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/[0.06] px-4 py-3 text-[13px] text-destructive">
          <div>{error}</div>
          {errorDetail && (
            <pre className="mt-2 whitespace-pre-wrap break-all rounded bg-destructive/10 px-2 py-1 font-mono text-[11px] text-destructive/80">
              {errorDetail}
            </pre>
          )}
        </div>
      )}

      {/* Rail layout: 200px step rail · form · 320px live preview */}
      <div className="grid gap-7 lg:grid-cols-[200px_1fr_320px]">
        <div className="hidden flex-col gap-1 lg:flex">
          {STEP_KEYS.map((key, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={key}
                type="button"
                onClick={() => i <= step && setStep(i as StepIndex)}
                disabled={i > step}
                className={cn(
                  "flex items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  active && "bg-primary/[0.07]",
                  i > step && "cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    active || done
                      ? "bg-primary text-primary-foreground"
                      : "border-[1.5px] border-border text-muted-foreground",
                  )}
                >
                  {done ? <Check aria-hidden className="size-3" /> : i + 1}
                </span>
                <span className="flex flex-col">
                  <span
                    className={cn(
                      "text-[13px]",
                      active
                        ? "font-bold text-foreground"
                        : "font-medium text-muted-foreground",
                    )}
                  >
                    {tw(`${key}Title`)}
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    {tw(`${key}Desc`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card px-6 py-7 sm:px-8">
          <h2 className="font-display mb-1 text-xl font-semibold">
            {tw(`${titleKey}Title`)}
          </h2>
          <p className="mb-6 text-[12.5px] text-muted-foreground">
            {tw(`${titleKey}Desc`)}
          </p>

          {step === 0 && (
            <BasicsStep
              draft={draft}
              patch={patch}
              // Slug + version form the R2 bundle key — once a draft exists
              // server-side, `updateDraftExtension` deliberately refuses to
              // change them. Lock them in the form so Review/Preview can't
              // show values that won't be persisted.
              lockedFields={extensionId ? ["slug", "version"] : undefined}
            />
          )}
          {step === 1 && (
            <SourceStep
              draft={draft}
              versionId={versionId}
              bundleUploaded={bundleUploaded}
              onBundleUploaded={() => setBundleUploaded(true)}
              onError={reportError}
            />
          )}
          {step === 2 && (
            <ListingStep draft={draft} patch={patch} locale={locale} />
          )}
          {step === 3 && (
            <ReviewStep
              draft={draft}
              locale={locale}
              bundleUploaded={bundleUploaded}
              onJump={(s) => setStep(s as StepIndex)}
            />
          )}

          <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
            <div className="text-[12px] text-muted-foreground">
              {tw("stepIndicator", { current: step + 1, total: STEP_KEYS.length })}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1) as StepIndex)}
                disabled={step === 0 || busy}
                className="rounded-md border border-border bg-transparent px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                {tw("backButton")}
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!stepsValid[step] || busy) return;
                    if (step === 0) void advanceFromBasics();
                    else setStep((s) => (s + 1) as StepIndex);
                  }}
                  disabled={!stepsValid[step] || busy}
                  className="rounded-md bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {tw("nextButton")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void submitFinal()}
                  disabled={busy || !versionId || !bundleUploaded}
                  className="rounded-md bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? tw("submitting") : tw("submitButton")}
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="sticky top-4 hidden self-start lg:block">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            {tw("livePreview")}
          </div>
          <LivePreview draft={draft} />
        </aside>
      </div>
    </div>
  );
}
