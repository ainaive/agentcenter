"use client";

import { Folder, FolderCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { saveExtension } from "@/lib/actions/collections";
import { useRouter } from "@/lib/i18n/navigation";

export function SaveButton({ extensionId }: { extensionId: string }) {
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
