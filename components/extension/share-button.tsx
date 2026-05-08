"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  url: string;
  label: string;
  copiedLabel: string;
}

export function ShareButton({ url, label, copiedLabel }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    // Use the native share sheet when the platform exposes it. Any error from
    // share() (including AbortError when the user dismisses the sheet) means
    // the user has already seen and acted on the share UI — don't silently
    // overwrite their clipboard as a "fallback".
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url });
      } catch {
        // user cancelled or share rejected — stop here
      }
      return;
    }

    if (typeof navigator.clipboard?.writeText !== "function") return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard blocked — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="border-border text-muted-foreground hover:border-primary/50 hover:text-primary inline-flex items-center gap-1.5 rounded-md border bg-transparent px-3.5 py-2 text-[13px] font-semibold transition-colors"
    >
      {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
