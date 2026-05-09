"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Form-row wrapper. Lays out a label, optional/required hint, content,
// and helper text in the same vertical rhythm across every step.
export function PubField({
  label,
  hint,
  required,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  optional?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <label className="text-[13px] font-semibold">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
        {optional && (
          <span className="text-[11px] font-normal text-muted-foreground">
            {optional}
          </span>
        )}
      </div>
      {children}
      {hint && (
        <div className="text-[11.5px] leading-relaxed text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  );
}

// Single-line text input used everywhere except specialised pickers.
// `mono` flips the family for slug/version/git-URL fields.
export function PubInput({
  value,
  onChange,
  placeholder,
  mono,
  readOnly,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  readOnly?: boolean;
  type?: "text" | "url";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        "w-full rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none transition-shadow",
        "focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_18%,transparent)]",
        readOnly && "cursor-not-allowed bg-muted text-muted-foreground",
        mono && "font-mono",
      )}
    />
  );
}

// Multiline variant of PubInput. Mirrors the design's mono README field.
export function PubTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        "w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none transition-shadow",
        "focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_18%,transparent)]",
        mono && "font-mono",
      )}
    />
  );
}

// Selectable card used for type, scope, and source-method choices.
export function PubChoice({
  value,
  current,
  onClick,
  title,
  desc,
  disabled,
  badge,
}: {
  value: string;
  current: string | null | undefined;
  onClick: () => void;
  title: string;
  desc?: string;
  disabled?: boolean;
  badge?: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-[1.5px] px-3.5 py-3 text-left transition-all",
        active
          ? "border-primary bg-primary/[0.04]"
          : "border-border bg-card hover:border-primary/40",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-semibold text-foreground">
          {title}
        </span>
        <span className="flex items-center gap-2">
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {badge}
            </span>
          )}
          {active && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check aria-hidden className="size-2.5" />
            </span>
          )}
        </span>
      </div>
      {desc && (
        <span className="text-[12px] leading-relaxed text-muted-foreground">
          {desc}
        </span>
      )}
    </button>
  );
}
