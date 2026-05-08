"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export interface TabPanel {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface ExtTabsProps {
  tabs: TabPanel[];
  defaultTab?: string;
}

export function ExtTabs({ tabs, defaultTab }: ExtTabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? "");
  const activePanel = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        className="border-border -mx-1 mb-6 flex items-center gap-0 overflow-x-auto border-b"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-4.5 py-2.5 text-[13.5px] whitespace-nowrap transition-colors",
                isActive
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground font-medium",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{activePanel?.content}</div>
    </div>
  );
}
