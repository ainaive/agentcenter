"use client";

import { Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, type FormEvent } from "react";

import { useSearchParams } from "next/navigation";

import { Link, useRouter } from "@/lib/i18n/navigation";
import type { Theme } from "@/lib/theme";
import type { Locale } from "@/types";

import { LocaleSwitch } from "./locale-switch";
import { ThemeSwitch } from "./theme-switch";
import { UserButton } from "./user-button";

interface TopBarProps {
  theme: Theme;
  locale: Locale;
  onToggleSidebar: () => void;
}

export function TopBar({ theme, locale, onToggleSidebar }: TopBarProps) {
  const t = useTranslations("nav");
  const ts = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/extensions?${params.toString()}`);
  }

  return (
    <header className="bg-background/80 border-border sticky top-0 z-10 flex h-[52px] flex-shrink-0 items-center gap-3 border-b px-5 backdrop-blur-xl backdrop-saturate-150">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={t("toggleSidebar")}
        className="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors"
      >
        <Menu aria-hidden className="size-[18px]" />
      </button>

      <Link href="/" className="mr-2 flex items-baseline gap-2.5">
        <span
          aria-hidden
          className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full"
        >
          <span className="serif text-sm font-medium italic">A</span>
        </span>
        <span className="serif text-lg tracking-tight">
          Agent
          <span className="text-primary font-light italic">Center</span>
        </span>
      </Link>

      <div className="flex flex-1 justify-center">
        <form
          role="search"
          onSubmit={handleSearch}
          className="relative w-full max-w-[520px]"
        >
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-[15px] -translate-y-1/2"
          />
          <input
            ref={inputRef}
            type="search"
            aria-label={t("searchLabel")}
            defaultValue={searchParams.get("q") ?? ""}
            placeholder={ts("placeholder")}
            className="bg-muted border-input placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 w-full rounded-lg border py-1.5 pr-3 pl-9 text-[13px] outline-none transition-colors focus:ring-3"
          />
        </form>
      </div>

      <nav className="flex items-center gap-0.5">
        <Link
          href="/extensions"
          className="text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors"
        >
          {t("explore")}
        </Link>
        <Link
          href="/publish"
          className="text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors"
        >
          {t("publish")}
        </Link>
        {/* Docs route doesn't exist yet — render as a non-interactive
            placeholder so keyboard users don't tab to a dead link. */}
        <span
          aria-disabled="true"
          title={t("comingSoon")}
          className="text-muted-foreground/60 cursor-not-allowed rounded-md px-2.5 py-1.5 text-[13px] font-medium"
        >
          {t("docs")}
        </span>
      </nav>

      <ThemeSwitch theme={theme} />

      <LocaleSwitch locale={locale} />

      <UserButton />
    </header>
  );
}
