"use client";

import { Folder, FolderCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { saveExtension } from "@/lib/actions/collections";
import { useRouter } from "@/lib/i18n/navigation";

type SaveVariant = "icon" | "pill";

interface SaveButtonProps {
  extensionId: string;
  variant?: SaveVariant;
}

export function SaveButton({
  extensionId,
  variant = "icon",
}: SaveButtonProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function handleClick() {
    startTransition(async () => {
      const result = await saveExtension(extensionId);

      if (!result.ok && result.error === "unauthenticated") {
        router.push("/sign-in");
        return;
      }

      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="border-border text-foreground hover:border-primary/50 hover:text-primary inline-flex items-center gap-1.5 rounded-md border bg-transparent px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-60"
      >
        {saved ? (
          <FolderCheck className="text-primary size-3.5" />
        ) : (
          <Folder className="size-3.5" />
        )}
        {saved ? t("saved") : t("addToGroup")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={saved ? t("saved") : t("addToGroup")}
      className="bg-secondary border-border hover:bg-accent flex size-7 items-center justify-center rounded-md border transition-colors disabled:opacity-60"
    >
      {saved ? (
        <FolderCheck className="text-primary size-3.5" />
      ) : (
        <Folder className="text-muted-foreground size-3.5" />
      )}
    </button>
  );
}
