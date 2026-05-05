"use client";

import { useState } from "react";

import type { Theme } from "@/lib/theme";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: React.ReactNode;
  theme: Theme;
}

export function AppShell({ children, theme }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar
        theme={theme}
        onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="bg-background flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
