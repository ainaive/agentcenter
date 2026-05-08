"use client";

import { useState } from "react";

interface InstallCommandProps {
  command: string;
  copyLabel: string;
  copiedLabel: string;
}

export function InstallCommand({
  command,
  copyLabel,
  copiedLabel,
}: InstallCommandProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard?.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard blocked
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#1a1a1e] px-4 py-3.5 font-mono text-[13.5px] text-zinc-100">
      <span className="truncate">
        <span className="mr-2.5 text-zinc-400">$</span>
        {command}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className={`shrink-0 rounded px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
          copied
            ? "bg-primary/20 text-primary"
            : "bg-white/10 text-zinc-100 hover:bg-white/15"
        }`}
      >
        {copied ? `✓ ${copiedLabel}` : copyLabel}
      </button>
    </div>
  );
}
