"use client";

import { Check, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { installExtension } from "@/lib/actions/install";
import { useRouter } from "@/lib/i18n/navigation";

type Size = "sm" | "lg";

interface InstallButtonProps {
  extensionId: string;
  size?: Size;
}

export function InstallButton({
  extensionId,
  size = "sm",
}: InstallButtonProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [installed, setInstalled] = useState(false);

  async function handleClick() {
    startTransition(async () => {
      const result = await installExtension(extensionId);

      if (!result.ok && result.error === "unauthenticated") {
        router.push("/sign-in");
        return;
      }

      if (result.ok) {
        setInstalled(true);
        // Reset after 3 s so the user can see the confirmation.
        setTimeout(() => setInstalled(false), 3000);
      }
    });
  }

  if (size === "lg") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || installed}
        className="bg-primary text-primary-foreground hover:opacity-90 inline-flex shrink-0 items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-bold transition disabled:opacity-70"
      >
        {installed ? (
          <Check className="size-3.5" />
        ) : (
          <Download className="size-3.5" />
        )}
        {isPending
          ? t("installing")
          : installed
            ? t("installed")
            : t("install")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || installed}
      className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-3 py-1 text-[12px] font-bold transition hover:opacity-90 disabled:opacity-70"
    >
      {installed ? (
        <Check className="size-3" />
      ) : (
        <Download className="size-3" />
      )}
      {isPending
        ? t("installing")
        : installed
          ? t("installed")
          : t("install")}
    </button>
  );
}
