"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { Theme } from "@/lib/theme";
import type { Locale } from "@/types";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: React.ReactNode;
  theme: Theme;
  locale: Locale;
}

export function AppShell({ children, theme, locale }: AppShellProps) {
  const t = useTranslations("nav");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Skip link — visually hidden until focused so keyboard users can
          jump past the topbar + sidebar nav directly to the page content. */}
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground focus-visible:ring-ring focus-visible:ring-offset-background sr-only z-50 rounded-md px-3 py-2 text-[13px] font-semibold focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {t("skipToContent")}
      </a>
      <TopBar
        theme={theme}
        locale={locale}
        onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />
        <main
          id="main-content"
          tabIndex={-1}
          className="bg-background flex-1 overflow-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
