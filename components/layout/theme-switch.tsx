"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { THEME_COOKIE_NAME, type Theme } from "@/lib/theme";

interface ThemeSwitchProps {
  theme: Theme;
}

export function ThemeSwitch({ theme }: ThemeSwitchProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: Theme = theme === "ivory" ? "dark" : "ivory";
    document.cookie = `${THEME_COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={
        theme === "ivory" ? "Switch to dark theme" : "Switch to ivory theme"
      }
      className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md p-1.5 transition-colors disabled:opacity-50"
    >
      {theme === "ivory" ? (
        <Moon className="size-[16px]" />
      ) : (
        <Sun className="size-[16px]" />
      )}
    </button>
  );
}
