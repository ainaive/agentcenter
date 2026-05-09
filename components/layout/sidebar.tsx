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
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { COLLECTIONS } from "@/lib/data/collections";
import { EXTENSIONS } from "@/lib/data/extensions";
import { FUNC_CAT_COLORS, FUNC_TAXONOMY } from "@/lib/taxonomy";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ExtensionCategory } from "@/types";

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const searchParams = useSearchParams();
  const t = useTranslations("sidebar");
  const tx = useTranslations("taxonomy");

  const BROWSE_ITEMS: {
    key: ExtensionCategory | "all";
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "all", label: t("allExtensions"), Icon: Boxes },
    { key: "skills", label: t("skills"), Icon: Zap },
    { key: "mcp", label: t("mcpServers"), Icon: Globe2 },
    { key: "slash", label: t("slashCommands"), Icon: Command },
    { key: "plugins", label: t("plugins"), Icon: Plug },
  ];

  function buildHref(updates: Record<string, string | null>): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return `/extensions${qs ? `?${qs}` : ""}`;
  }

  const activeCategory: ExtensionCategory | "all" =
    (searchParams.get("category") as ExtensionCategory | null) ?? "all";
  const activeFuncCat = searchParams.get("funcCat");
  const activeSubCat = searchParams.get("subCat");
  const activeL2 = searchParams.get("l2");

  const tDept = useTranslations("filters.dept");
  const [expandedSections, setExpandedSections] = useState({
    browse: true,
    categories: true,
    collections: false,
  });
  const [expandedFuncCats, setExpandedFuncCats] = useState<
    Record<string, boolean>
  >(() => ({
    [activeFuncCat ?? "workTask"]: true,
  }));
  const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>(() =>
    activeSubCat ? { [activeSubCat]: true } : {},
  );

  return (
    <aside
      className={cn(
        "bg-sidebar border-border flex flex-col overflow-hidden border-r transition-[width] duration-200 ease-in-out",
        collapsed ? "w-0" : "w-[240px]",
      )}
    >
      <div className="min-w-[200px] flex-1 overflow-y-auto p-3">
        <SidebarSection
          title={t("browse")}
          expanded={expandedSections.browse}
          onToggle={() =>
            setExpandedSections((p) => ({ ...p, browse: !p.browse }))
          }
        >
          {BROWSE_ITEMS.map((item) => {
            const isActive = activeCategory === item.key;
            const next = isActive
              ? null
              : item.key === "all"
                ? null
                : item.key;
            const href = buildHref({ category: next });
            const count =
              item.key === "all"
                ? null
                : EXTENSIONS.filter((e) => e.category === item.key).length;
            return (
              <SidebarLink key={item.key} href={href} active={isActive}>
                <item.Icon className="size-[14px] shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {count !== null && (
                  <span className="text-[11px] opacity-55">{count}</span>
                )}
              </SidebarLink>
            );
          })}
        </SidebarSection>

        <Divider />

        <SidebarSection
          title={t("categories")}
          expanded={expandedSections.categories}
          onToggle={() =>
            setExpandedSections((p) => ({ ...p, categories: !p.categories }))
          }
        >
          <SidebarLink
            href={buildHref({ funcCat: null, subCat: null, l2: null })}
            active={!activeFuncCat}
          >
            <span className="bg-sidebar-foreground/40 size-1.5 shrink-0 rounded-full" />
            <span className="flex-1">{t("all")}</span>
            <span className="text-[11px] opacity-55">{EXTENSIONS.length}</span>
          </SidebarLink>

          {FUNC_TAXONOMY.map((cat) => {
            const isCatActive =
              activeFuncCat === cat.key && !activeSubCat && !activeL2;
            const isExpanded = expandedFuncCats[cat.key] ?? false;
            const catColor = FUNC_CAT_COLORS[cat.key];
            const catCount = EXTENSIONS.filter(
              (e) => e.funcCat === cat.key,
            ).length;
            const catHref = buildHref({
              funcCat: isCatActive ? null : cat.key,
              subCat: null,
              l2: null,
            });
            return (
              <div key={cat.key}>
                <div className="flex items-center">
                  <Link
                    href={catHref}
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
                    <span className="flex-1">{tx(`funcCat.${cat.key}`)}</span>
                    <span className="text-[11px] opacity-55">{catCount}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`${isExpanded ? tDept("collapse") : tDept("expand")} ${tx(`funcCat.${cat.key}`)}`}
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpandedFuncCats((p) => ({
                        ...p,
                        [cat.key]: !p[cat.key],
                      }))
                    }
                    className="text-sidebar-foreground/60 hover:text-sidebar-foreground rounded p-1 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown aria-hidden className="size-3" />
                    ) : (
                      <ChevronRight aria-hidden className="size-3" />
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
                    const l1Href = buildHref({
                      funcCat: cat.key,
                      subCat: isL1Active ? null : l1.key,
                      l2: null,
                    });
                    return (
                      <div key={l1.key} className="ml-2">
                        <div className="flex items-center">
                          <Link
                            href={l1Href}
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
                            <span className="flex-1">{tx(`l1.${l1.key}`)}</span>
                            <span className="text-[11px] opacity-50">
                              {l1Count}
                            </span>
                          </Link>
                          {l1.l2.length > 0 && (
                            <button
                              type="button"
                              aria-label={`${isL1Expanded ? tDept("collapse") : tDept("expand")} ${tx(`l1.${l1.key}`)}`}
                              aria-expanded={isL1Expanded}
                              onClick={() =>
                                setExpandedL1((p) => ({
                                  ...p,
                                  [l1.key]: !p[l1.key],
                                }))
                              }
                              className="text-sidebar-foreground/50 hover:text-sidebar-foreground rounded p-1 transition-colors"
                            >
                              {isL1Expanded ? (
                                <ChevronDown aria-hidden className="size-[11px]" />
                              ) : (
                                <ChevronRight aria-hidden className="size-[11px]" />
                              )}
                            </button>
                          )}
                        </div>

                        {isL1Expanded &&
                          l1.l2.map((l2key) => {
                            const isL2Active = activeL2 === l2key;
                            const l2Href = buildHref({
                              funcCat: cat.key,
                              subCat: l1.key,
                              l2: isL2Active ? null : l2key,
                            });
                            return (
                              <Link
                                key={l2key}
                                href={l2Href}
                                className={cn(
                                  "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 pl-6 text-left text-[12px] transition",
                                  isL2Active
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50",
                                )}
                              >
                                <span className="bg-sidebar-foreground/40 size-[3px] shrink-0 rounded-full" />
                                {tx(`l2.${l2key}`)}
                              </Link>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </SidebarSection>

        <Divider />

        <SidebarSection
          title={t("collections")}
          expanded={expandedSections.collections}
          onToggle={() =>
            setExpandedSections((p) => ({
              ...p,
              collections: !p.collections,
            }))
          }
        >
          <SidebarStaticItem>
            <Folder className="size-[14px] shrink-0" />
            <span className="flex-1">{t("saved")}</span>
            <span className="font-mono text-[11px] opacity-60">0</span>
          </SidebarStaticItem>
          {COLLECTIONS.map((col) => (
            <SidebarStaticItem key={col.id}>
              <span className="bg-sidebar-primary size-1.5 shrink-0 rounded-full" />
              <span className="flex-1 truncate">{col.name}</span>
              <span className="font-mono text-[11px] opacity-60">
                {col.count}
              </span>
            </SidebarStaticItem>
          ))}
          <SidebarStaticItem muted>
            <Plus className="size-[14px] shrink-0" />
            <span className="flex-1">{t("newGroup")}</span>
          </SidebarStaticItem>
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
        aria-expanded={expanded}
        className="text-sidebar-foreground/85 hover:text-sidebar-foreground flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors"
      >
        {title}
        {expanded ? (
          <ChevronDown aria-hidden className="size-[14px]" />
        ) : (
          <ChevronRight aria-hidden className="size-[14px]" />
        )}
      </button>
      {expanded && <div className="mt-0.5 flex flex-col gap-px">{children}</div>}
    </div>
  );
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
      )}
    >
      {children}
    </Link>
  );
}

function SidebarStaticItem({
  muted,
  children,
}: {
  muted?: boolean;
  children: React.ReactNode;
}) {
  // Placeholder rows for not-yet-wired collections (Installed/Saved counts,
  // user collections, "New group"). Render as a non-interactive div instead
  // of a focusable button-that-does-nothing — keyboard users were tabbing
  // through dead controls.
  return (
    <div
      aria-disabled="true"
      className={cn(
        "text-sidebar-foreground/70 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium",
        muted && "opacity-60",
      )}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="bg-sidebar-border mx-1 my-3 h-px" />;
}
