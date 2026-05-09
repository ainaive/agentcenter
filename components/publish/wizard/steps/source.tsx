"use client";

import { Check, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { attachFile } from "@/lib/actions/publish";
import type { ManifestFormValues } from "@/lib/validators/manifest";
import { cn } from "@/lib/utils";

import { PubChoice, PubField } from "../shared";

type SourceTab = "zip" | "git" | "cli";

export function SourceStep({
  draft,
  versionId,
  bundleUploaded,
  onBundleUploaded,
  onError,
}: {
  draft: ManifestFormValues;
  // Server-side identifiers needed for the upload — only available
  // after Step 1 has persisted a draft.
  versionId: string | null;
  bundleUploaded: boolean;
  onBundleUploaded: () => void;
  // Surface upload-pipeline failures via the wizard's shared error rail.
  onError: (msg: string, detail?: string | null) => void;
}) {
  const t = useTranslations("publish.source");
  const tu = useTranslations("publish.upload");
  const te = useTranslations("publish.errors");

  const [tab, setTab] = useState<SourceTab>("zip");
  const [progress, setProgress] = useState<"idle" | "uploading" | "done">(
    bundleUploaded ? "done" : "idle",
  );
  const [fileName, setFileName] = useState<string | null>(
    bundleUploaded ? draft.slug + " bundle" : null,
  );
  const [copied, setCopied] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!versionId) {
      onError(te("invalid_input"));
      return;
    }
    if (!file.name.endsWith(".zip")) {
      onError(tu("errorType"));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      onError(tu("errorSize"));
      return;
    }
    setProgress("uploading");
    setFileName(file.name);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: draft.slug,
          version: draft.version,
          contentType: "application/zip",
          size: file.size,
        }),
      });
      if (!signRes.ok) {
        let detail: string | null = null;
        try {
          const body = (await signRes.json()) as { detail?: string };
          detail = body.detail ?? null;
        } catch {
          /* non-JSON response */
        }
        onError(te("uploadSign"), detail);
        setProgress("idle");
        return;
      }
      const { uploadUrl, r2Key } = (await signRes.json()) as {
        uploadUrl: string;
        r2Key: string;
      };
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/zip" },
        body: file,
      });
      if (!putRes.ok) {
        onError(te("uploadFailed"));
        setProgress("idle");
        return;
      }
      const attachResult = await attachFile(
        versionId,
        r2Key,
        file.size,
        "pending",
      );
      if (!attachResult.ok) {
        onError(te("fallback"), attachResult.detail ?? null);
        setProgress("idle");
        return;
      }
      setProgress("done");
      onBundleUploaded();
    } catch (err) {
      console.error("[publish] zip upload threw", err);
      onError(te("fallback"));
      setProgress("idle");
    }
  }

  function copy(idx: number, text: string) {
    void navigator.clipboard?.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  }

  const cliCommands = [
    {
      label: t("cliStep1"),
      code: "npm install -g @agentcenter/cli",
    },
    { label: t("cliStep2"), code: "agentcenter login" },
    {
      label: t("cliStep3"),
      code: `agentcenter publish --slug ${draft.slug || "your-extension"}`,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PubField label={t("methodLabel")} required>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <PubChoice
            value="zip"
            current={tab}
            onClick={() => setTab("zip")}
            title={t("zipTitle")}
            desc={t("zipDesc")}
          />
          <PubChoice
            value="git"
            current={tab}
            onClick={() => setTab("git")}
            title={t("gitTitle")}
            desc={t("gitDesc")}
            badge={t("comingSoon")}
          />
          <PubChoice
            value="cli"
            current={tab}
            onClick={() => setTab("cli")}
            title={t("cliTitle")}
            desc={t("cliDesc")}
          />
        </div>
      </PubField>

      {tab === "zip" && (
        <div
          onClick={() => versionId && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-8 transition-all",
            progress === "done"
              ? "border-primary bg-primary/[0.04]"
              : "border-border bg-card hover:border-primary/40",
            !versionId && "cursor-not-allowed opacity-60",
            versionId && progress !== "done" && "cursor-pointer",
          )}
        >
          {progress === "done" ? (
            <>
              <Check aria-hidden className="size-8 text-primary" />
              <div className="text-[14px] font-semibold">
                {fileName ?? tu("uploaded")}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProgress("idle");
                  setFileName(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-[12px] text-muted-foreground underline transition-colors hover:text-foreground"
              >
                {t("replace")}
              </button>
            </>
          ) : progress === "uploading" ? (
            <>
              <Upload
                aria-hidden
                className="size-7 animate-pulse text-primary"
              />
              <div className="text-[14px] font-semibold">{tu("uploading")}</div>
            </>
          ) : (
            <>
              <Upload aria-hidden className="size-7 text-muted-foreground" />
              <div className="text-[14px] font-semibold">{t("dropHere")}</div>
              <div className="rounded-md bg-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-primary-foreground">
                {t("orBrowse")}
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">
                {t("zipHint")}
              </div>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </div>
      )}

      {tab === "git" && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-card/40 p-5">
          <div className="text-[13px] font-semibold text-foreground">
            {t("gitTitle")}
          </div>
          <div className="text-[12.5px] text-muted-foreground">
            {t("gitDeferred")}
          </div>
          <input
            disabled
            placeholder={t("gitPlaceholder")}
            className="w-full cursor-not-allowed rounded-md border border-border bg-muted px-3 py-2 font-mono text-[13px] text-muted-foreground"
          />
        </div>
      )}

      {tab === "cli" && (
        <div className="flex flex-col gap-3.5">
          {cliCommands.map((c, i) => (
            <div key={c.label}>
              <div className="mb-1.5 text-[12px] font-semibold text-muted-foreground">
                {i + 1}. {c.label}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 py-2.5 font-mono text-[12.5px]">
                <span className="truncate">$ {c.code}</span>
                <button
                  type="button"
                  onClick={() => copy(i, c.code)}
                  className="inline-flex shrink-0 items-center gap-1 rounded border border-border px-2 py-0.5 font-sans text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copied === i ? (
                    <>
                      <Check aria-hidden className="size-3 text-primary" />
                      {t("copied")}
                    </>
                  ) : (
                    t("copy")
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
