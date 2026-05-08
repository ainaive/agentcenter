"use client";

import { Tabs } from "@base-ui/react/tabs";

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
  if (tabs.length === 0) return null;

  return (
    <Tabs.Root defaultValue={defaultTab ?? tabs[0]!.key}>
      <Tabs.List className="border-border -mx-1 mb-6 flex items-center gap-0 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.key}
            value={tab.key}
            className={cn(
              "-mb-px shrink-0 border-b-2 border-transparent px-4.5 py-2.5 text-[13.5px] font-medium whitespace-nowrap",
              "text-muted-foreground hover:text-foreground transition-colors",
              "data-[selected]:border-primary data-[selected]:text-foreground data-[selected]:font-bold",
              "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Panel
          key={tab.key}
          value={tab.key}
          className="focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
