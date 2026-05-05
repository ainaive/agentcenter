"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Upload } from "lucide-react";

import { ManifestForm } from "./manifest-form";
import { createDraftExtension, attachFile, submitForReview } from "@/lib/actions/publish";
import type { ManifestFormValues } from "@/lib/validators/manifest";
import { Link } from "@/lib/i18n/navigation";

type Step = 1 | 2 | 3;

interface DraftState {
  extensionId: string;
  versionId: string;
  slug: string;
  version: string;
}

export function UploadWizard() {
  const tw = useTranslations("publish.wizard");
  const tu = useTranslations("publish.upload");

  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleManifestSubmit(values: ManifestFormValues) {
    setError(null);
    const result = await createDraftExtension(values);
    if (!result.ok) {
      setError(result.error === "slug_taken" ? "Slug already taken — choose another." : result.error);
      return;
    }
    setDraft({ extensionId: result.extensionId, versionId: result.versionId, slug: values.slug, version: values.version });
    setStep(2);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;

    if (!file.name.endsWith(".zip")) { setError(tu("errorType")); return; }
    if (file.size > 50 * 1024 * 1024) { setError(tu("errorSize")); return; }
    setError(null);
    setUploadProgress("uploading");

    // 1. Get presigned URL
    const signRes = await fetch("/api/upload/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: draft.slug, version: draft.version, contentType: "application/zip", size: file.size }),
    });
    if (!signRes.ok) { setError("Failed to get upload URL."); setUploadProgress("idle"); return; }
    const { uploadUrl, r2Key } = await signRes.json() as { uploadUrl: string; r2Key: string };

    // 2. Upload directly to R2
    const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "application/zip" }, body: file });
    if (!putRes.ok) { setError("Upload failed. Please try again."); setUploadProgress("idle"); return; }

    // 3. Record file in DB (checksum placeholder — real checksum done by Inngest scan)
    const attachResult = await attachFile(draft.versionId, r2Key, file.size, "pending");
    if (!attachResult.ok) { setError(attachResult.error); setUploadProgress("idle"); return; }

    setUploadProgress("done");
    setFileUploaded(true);
  }

  async function handleSubmit() {
    if (!draft) return;
    setSubmitting(true);
    setError(null);
    const result = await submitForReview(draft.versionId);
    setSubmitting(false);
    if (!result.ok) { setError(result.error); return; }
    setSubmitted(true);
  }

  const stepLabels = [tw("step1Title"), tw("step2Title"), tw("step3Title")];

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="text-xl font-semibold">{tw("successTitle")}</h2>
        <p className="text-[var(--color-text-secondary)] max-w-sm">{tw("successBody")}</p>
        <Link href="/publish" className="mt-4 text-sm underline text-[var(--color-accent)]">
          {tw("backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border ${
              s === step
                ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                : s < step
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}>{s < step ? "✓" : s}</span>
            <span className={`text-sm ${s === step ? "font-medium" : "text-[var(--color-text-muted)]"}`}>
              {stepLabels[s - 1]}
            </span>
            {s < 3 && <span className="text-[var(--color-text-muted)] mx-1">›</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Manifest */}
      {step === 1 && <ManifestForm onSubmit={handleManifestSubmit} />}

      {/* Step 2: File upload */}
      {step === 2 && (
        <div className="space-y-6">
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] p-12 text-center cursor-pointer hover:border-[var(--color-accent)] transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {uploadProgress === "done" ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                <p className="font-medium">{tu("uploaded")}</p>
              </>
            ) : uploadProgress === "uploading" ? (
              <>
                <Upload className="h-10 w-10 text-[var(--color-accent)] mb-3 animate-pulse" />
                <p className="font-medium">{tu("uploading")}</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-[var(--color-text-muted)] mb-3" />
                <p className="font-medium">{tu("dropzone")}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{tu("maxSize")}</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              {tw("backButton")}
            </button>
            <button
              type="button"
              disabled={!fileUploaded}
              onClick={() => setStep(3)}
              className="rounded-md bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {tw("nextButton")}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & submit */}
      {step === 3 && draft && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Slug</span>
              <span className="font-mono font-medium">{draft.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Version</span>
              <span className="font-mono font-medium">{draft.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Bundle</span>
              <span className="text-green-600 font-medium">✓ Uploaded</span>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              {tw("backButton")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {submitting ? tw("submitting") : tw("submitButton")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
