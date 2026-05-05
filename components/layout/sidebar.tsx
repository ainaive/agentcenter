"use client";

import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Command,
  Folder,
  Globe2,
  Plug,
  Plus,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { COLLECTIONS } from "@/lib/data/collections";
import { EXTENSIONS } from "@/lib/data/extensions";
import { FUNC_CAT_COLORS, FUNC_TAXONOMY } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { ExtensionCategory } from "@/types";

const BROWSE_ITEMS: {
  key: ExtensionCategory | "all";
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "all", label: "All Extensions", Icon: Boxes },
  { key: "skills", label: "Skills", Icon: Zap },
  { key: "mcp", label: "MCP Servers", Icon: Globe2 },
  { key: "slash", label: "Slash Commands", Icon: Command },
  { key: "plugins", label: "Plugins", Icon: Plug },
];

const FUNC_CAT_LABELS: Record<string, string> = {
  workTask: "Work Task",
  business: "Business",
  tools: "Tools",
};

const L1_LABELS: Record<string, string> = {
  systemDesign: "System Design",
  softDev: "Software Dev",
  testing: "Testing & QA",
  network: "Network Protocols",
  embedded: "Embedded Systems",
  cloud: "Cloud Services",
  docs: "Document Ops",
  data: "Data Processing",
  vcs: "Version Control",
};

const L2_LABELS: Record<string, string> = {
  reqAnalysis: "Requirements Analysis",
  funcDesign: "Functional Design",
  archDesign: "Architecture Design",
  frontend: "Front-End Dev",
  backend: "Back-End Dev",
  devops: "DevOps",
  unitTest: "Unit Testing",
  intTest: "Integration Testing",
  perfTest: "Performance Testing",
  http: "HTTP / REST",
  grpc: "gRPC",
  mqtt: "MQTT",
  rtos: "RTOS",
  firmware: "Firmware",
  drivers: "Drivers",
  aws: "AWS",
  azure: "Azure",
  k8s: "Kubernetes",
  markdown: "Markdown",
  pdf: "PDF Processing",
  wiki: "Wiki Management",
  csv: "CSV Analysis",
  sql: "SQL Query",
  viz: "Data Visualization",
  git: "Git Operations",
  pr: "Code Review",
  cicd: "CI / CD",
};

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [activeCategory, setActiveCategory] = useState<ExtensionCategory | "all">("all");
  const [activeFuncCat, setActiveFuncCat] = useState<string | null>(null);
  const [activeSubCat, setActiveSubCat] = useState<string | null>(null);
  const [activeL2, setActiveL2] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    browse: true,
    categories: true,
    collections: false,
  });
  const [expandedFuncCats, setExpandedFuncCats] = useState<
    Record<string, boolean>
  >({ workTask: true });
  const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>({});

  return (
    <aside
      className={cn(
        "bg-sidebar border-border flex flex-col overflow-hidden border-r transition-[width] duration-200 ease-in-out",
        collapsed ? "w-0" : "w-[240px]",
      )}
    >
      <div className="min-w-[200px] flex-1 overflow-y-auto p-3">
        <SidebarSection
          title="Browse"
          expanded={expandedSections.browse}
          onToggle={() =>
            setExpandedSections((p) => ({ ...p, browse: !p.browse }))
          }
        >
          {BROWSE_ITEMS.map((item) => {
            const count =
              item.key === "all"
                ? null
                : EXTENSIONS.filter((e) => e.category === item.key).length;
            return (
              <SidebarItem
                key={item.key}
                active={activeCategory === item.key}
                onClick={() => setActiveCategory(item.key)}
              >
                <item.Icon className="size-[14px] shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {count !== null && (
                  <span className="text-[11px] opacity-55">{count}</span>
                )}
              </SidebarItem>
            );
          })}
        </SidebarSection>

        <Divider />

        <SidebarSection
          title="Categories"
          expanded={expandedSections.categories}
          onToggle={() =>
            setExpandedSections((p) => ({ ...p, categories: !p.categories }))
          }
        >
          <SidebarItem
            active={!activeFuncCat}
            onClick={() => {
              setActiveFuncCat(null);
              setActiveSubCat(null);
              setActiveL2(null);
            }}
          >
            <span className="bg-sidebar-foreground/40 size-1.5 shrink-0 rounded-full" />
            <span className="flex-1">All</span>
            <span className="text-[11px] opacity-55">{EXTENSIONS.length}</span>
          </SidebarItem>

          {FUNC_TAXONOMY.map((cat) => {
            const isCatActive =
              activeFuncCat === cat.key && !activeSubCat && !activeL2;
            const isExpanded = expandedFuncCats[cat.key] ?? false;
            const catColor = FUNC_CAT_COLORS[cat.key];
            const catCount = EXTENSIONS.filter(
              (e) => e.funcCat === cat.key,
            ).length;
            return (
              <div key={cat.key}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      const willActivate = !isCatActive;
                      setActiveFuncCat(willActivate ? cat.key : null);
                      setActiveSubCat(null);
                      setActiveL2(null);
                    }}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-semibold transition",
                      isCatActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )}
                  >
                    <span
                      className="size-[7px] shrink-0 rounded-sm"
                      style={{ background: catColor }}
                    />
                    <span className="flex-1">{FUNC_CAT_LABELS[cat.key]}</span>
                    <span className="text-[11px] opacity-55">{catCount}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    onClick={() =>
                      setExpandedFuncCats((p) => ({
                        ...p,
                        [cat.key]: !p[cat.key],
                      }))
                    }
                    className="text-sidebar-foreground/60 hover:text-sidebar-foreground rounded p-1 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                  </button>
                </div>

                {isExpanded &&
                  cat.l1.map((l1) => {
                    const isL1Active =
                      activeSubCat === l1.key && !activeL2;
                    const isL1Expanded = expandedL1[l1.key] ?? false;
                    const l1Count = EXTENSIONS.filter(
                      (e) => e.subCat === l1.key,
                    ).length;
                    return (
                      <div key={l1.key} className="ml-2">
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFuncCat(cat.key);
                              setActiveSubCat(isL1Active ? null : l1.key);
                              setActiveL2(null);
                            }}
                            className={cn(
                              "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] font-medium transition",
                              isL1Active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                            )}
                          >
                            <span
                              className="w-[1.5px] shrink-0 self-stretch rounded"
                              style={{
                                background: catColor,
                                opacity: isL1Active ? 1 : 0.35,
                              }}
                            />
                            <span className="flex-1">{L1_LABELS[l1.key]}</span>
                            <span className="text-[11px] opacity-50">
                              {l1Count}
                            </span>
                          </button>
                          {l1.l2.length > 0 && (
                            <button
                              type="button"
                              aria-label={isL1Expanded ? "Collapse" : "Expand"}
                              onClick={() =>
                                setExpandedL1((p) => ({
                                  ...p,
                                  [l1.key]: !p[l1.key],
                                }))
                              }
                              className="text-sidebar-foreground/50 hover:text-sidebar-foreground rounded p-1 transition-colors"
                            >
                              {isL1Expanded ? (
                                <ChevronDown className="size-[11px]" />
                              ) : (
                                <ChevronRight className="size-[11px]" />
                              )}
                            </button>
                          )}
                        </div>

                        {isL1Expanded &&
                          l1.l2.map((l2key) => (
                            <button
                              key={l2key}
                              type="button"
                              onClick={() => {
                                setActiveFuncCat(cat.key);
                                setActiveSubCat(l1.key);
                                setActiveL2(activeL2 === l2key ? null : l2key);
                              }}
                              className={cn(
                                "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 pl-6 text-left text-[12px] transition",
                                activeL2 === l2key
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50",
                              )}
                            >
                              <span className="bg-sidebar-foreground/40 size-[3px] shrink-0 rounded-full" />
                              {L2_LABELS[l2key]}
                            </button>
                          ))}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </SidebarSection>

        <Divider />

        <SidebarSection
          title="Collections"
          expanded={expandedSections.collections}
          onToggle={() =>
            setExpandedSections((p) => ({
              ...p,
              collections: !p.collections,
            }))
          }
        >
          <SidebarItem onClick={() => {}}>
            <Folder className="size-[14px] shrink-0" />
            <span className="flex-1">Installed</span>
            <span className="font-mono text-[11px] opacity-60">0</span>
          </SidebarItem>
          <SidebarItem onClick={() => {}}>
            <Folder className="size-[14px] shrink-0" />
            <span className="flex-1">Saved</span>
            <span className="font-mono text-[11px] opacity-60">0</span>
          </SidebarItem>
          {COLLECTIONS.map((col) => (
            <SidebarItem key={col.id} onClick={() => {}}>
              <span className="bg-sidebar-primary size-1.5 shrink-0 rounded-full" />
              <span className="flex-1 truncate">{col.name}</span>
              <span className="font-mono text-[11px] opacity-60">
                {col.count}
              </span>
            </SidebarItem>
          ))}
          <SidebarItem onClick={() => {}} muted>
            <Plus className="size-[14px] shrink-0" />
            <span className="flex-1">New Group</span>
          </SidebarItem>
        </SidebarSection>
      </div>
    </aside>
  );
}

interface SidebarSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SidebarSection({
  title,
  expanded,
  onToggle,
  children,
}: SidebarSectionProps) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="text-sidebar-foreground/85 hover:text-sidebar-foreground flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors"
      >
        {title}
        {expanded ? (
          <ChevronDown className="size-[14px]" />
        ) : (
          <ChevronRight className="size-[14px]" />
        )}
      </button>
      {expanded && <div className="mt-0.5 flex flex-col gap-px">{children}</div>}
    </div>
  );
}

interface SidebarItemProps {
  active?: boolean;
  muted?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SidebarItem({ active, muted, onClick, children }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        muted && "opacity-60",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="bg-sidebar-border mx-1 my-3 h-px" />;
}
