"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

import { discardDraft } from "@/lib/actions/publish";

interface Props {
  extensionId: string;
  extensionName: string;
}

// "Discard" affordance for a draft row on the publish dashboard. Confirms
// via `window.confirm` rather than a custom dialog — the surface is
// owner-only, the action is reversible only by re-creating, and we don't
// want to pull in a new shadcn component for one button.
export function DiscardButton({ extensionId, extensionName }: Props) {
  const td = useTranslations("publish.discard");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!confirm(td("confirm", { name: extensionName }))) return;
    startTransition(async () => {
      setError(null);
      try {
        const result = await discardDraft(extensionId);
        if (!result.ok) {
          setError(td(`error_${result.error}`));
          return;
        }
        // Server-side `getMyExtensions` won't pick up the deletion until
        // the route revalidates. `router.refresh()` re-runs the server
        // component without a full reload.
        router.refresh();
      } catch (err) {
        console.error("[publish] discardDraft threw", err);
        setError(td("error_fallback"));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={td("ariaLabel", { name: extensionName })}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-40 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
