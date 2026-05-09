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

// Render a thrown client-side error's message under the friendly headline,
// but only in development. Mirrors the server-side `devErrorDetail` helper.
function clientErrorDetail(err: unknown): string | null {
  if (process.env.NODE_ENV === "production") return null;
  if (err instanceof Error) return err.message;
  return String(err);
}

// Error codes the server actions can return. Anything else falls through to
// the generic "fallback" message.
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
  "scan_queue_unavailable",
  "db_error",
]);

export function UploadWizard() {
  const tw = useTranslations("publish.wizard");
  const tu = useTranslations("publish.upload");
  const te = useTranslations("publish.errors");

  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  function clearError() {
    setError(null);
    setErrorDetail(null);
  }

  // Translate a server-action error code into a localized message. Unknown
  // codes fall back to a generic message rather than leaking raw codes (e.g.
  // "db_error") to the user.
  function describeError(code: string): string {
    return KNOWN_ERROR_CODES.has(code) ? te(code) : te("fallback");
  }

  // Reset the file-upload state. Called after a fresh draft is created so
  // a re-edited Step 1 doesn't leave the wizard thinking the previous
  // bundle is still attached to the new versionId.
  function resetUploadState() {
    setFileUploaded(false);
    setUploadProgress("idle");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleManifestSubmit(values: ManifestFormValues) {
    clearError();
    try {
      const result = await createDraftExtension(values);
      if (!result.ok) {
        setError(describeError(result.error));
        setErrorDetail(result.detail ?? null);
        return;
      }
      setDraft({
        extensionId: result.extensionId,
        versionId: result.versionId,
        slug: values.slug,
        version: values.version,
      });
      resetUploadState();
      setStep(2);
    } catch (err) {
      console.error("[publish] handleManifestSubmit threw", err);
      setError(te("fallback"));
      setErrorDetail(clientErrorDetail(err));
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;

    if (!file.name.endsWith(".zip")) { setError(tu("errorType")); setErrorDetail(null); return; }
    if (file.size > 50 * 1024 * 1024) { setError(tu("errorSize")); setErrorDetail(null); return; }
    clearError();
    setUploadProgress("uploading");

    try {
      // 1. Get presigned URL
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: draft.slug, version: draft.version, contentType: "application/zip", size: file.size }),
      });
      if (!signRes.ok) {
        // Try to read a `detail` from the error body — the route attaches
        // the underlying message in development to help diagnose missing
        // R2 config etc. Tolerate non-JSON bodies (e.g. proxy errors).
        let detail: string | null = null;
        try {
          const body = (await signRes.json()) as { detail?: string };
          detail = body.detail ?? null;
        } catch {
          /* non-JSON response, no detail */
        }
        setError(te("uploadSign"));
        setErrorDetail(detail);
        setUploadProgress("idle");
        return;
      }
      const { uploadUrl, r2Key } = await signRes.json() as { uploadUrl: string; r2Key: string };

      // 2. Upload directly to R2
      const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "application/zip" }, body: file });
      if (!putRes.ok) { setError(te("uploadFailed")); setUploadProgress("idle"); return; }

      // 3. Record file in DB (checksum placeholder — real checksum done by Inngest scan)
      const attachResult = await attachFile(draft.versionId, r2Key, file.size, "pending");
      if (!attachResult.ok) {
        setError(describeError(attachResult.error));
        setErrorDetail(attachResult.detail ?? null);
        setUploadProgress("idle");
        return;
      }

      setUploadProgress("done");
      setFileUploaded(true);
    } catch (err) {
      console.error("[publish] handleFileChange threw", err);
      setError(te("fallback"));
      setErrorDetail(clientErrorDetail(err));
      setUploadProgress("idle");
    }
  }

  async function handleSubmit() {
    if (!draft) return;
    setSubmitting(true);
    clearError();
    try {
      const result = await submitForReview(draft.versionId);
      if (!result.ok) {
        setError(describeError(result.error));
        setErrorDetail(result.detail ?? null);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error("[publish] handleSubmit threw", err);
      setError(te("fallback"));
      setErrorDetail(clientErrorDetail(err));
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = [tw("step1Title"), tw("step2Title"), tw("step3Title")];

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="text-xl font-semibold">{tw("successTitle")}</h2>
        <p className="text-muted-foreground max-w-sm">{tw("successBody")}</p>
        <Link href="/publish" className="mt-4 text-sm underline text-primary">
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
                ? "bg-primary text-primary-foreground border-primary"
                : s < step
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "border-border text-muted-foreground"
            }`}>{s < step ? "✓" : s}</span>
            <span className={`text-sm ${s === step ? "font-medium" : "text-muted-foreground"}`}>
              {stepLabels[s - 1]}
            </span>
            {s < 3 && <span className="text-muted-foreground mx-1">›</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div>{error}</div>
          {errorDetail && (
            <pre className="mt-2 whitespace-pre-wrap break-all rounded bg-red-100/70 px-2 py-1 font-mono text-xs text-red-900/80">
              {errorDetail}
            </pre>
          )}
        </div>
      )}

      {/* Step 1: Manifest */}
      {step === 1 && <ManifestForm onSubmit={handleManifestSubmit} />}

      {/* Step 2: File upload */}
      {step === 2 && (
        <div className="space-y-6">
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {uploadProgress === "done" ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                <p className="font-medium">{tu("uploaded")}</p>
              </>
            ) : uploadProgress === "uploading" ? (
              <>
                <Upload className="h-10 w-10 text-primary mb-3 animate-pulse" />
                <p className="font-medium">{tu("uploading")}</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">{tu("dropzone")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{tu("maxSize")}</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              {tw("backButton")}
            </button>
            <button
              type="button"
              disabled={!fileUploaded}
              onClick={() => setStep(3)}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {tw("nextButton")}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & submit */}
      {step === 3 && draft && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono font-medium">{draft.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono font-medium">{draft.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bundle</span>
              <span className="text-green-600 font-medium">✓ Uploaded</span>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              {tw("backButton")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {submitting ? tw("submitting") : tw("submitButton")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
