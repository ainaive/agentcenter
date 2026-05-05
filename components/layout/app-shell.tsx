"use client";

import { useState } from "react";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar onToggleSidebar={() => setSidebarCollapsed((p) => !p)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="bg-background flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
