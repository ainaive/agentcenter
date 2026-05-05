"use client";

import { useFilterUrl } from "@/lib/hooks/use-filter-url";
import { cn } from "@/lib/utils";

const SCOPES = [
  { key: "all", label: "All" },
  { key: "personal", label: "Personal" },
  { key: "org", label: "Organization" },
  { key: "enterprise", label: "Enterprise" },
] as const;

export function ScopePills() {
  const { get, set } = useFilterUrl();
  const active = get("scope") ?? "all";

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground shrink-0 text-[12px] font-semibold">
        Scope:
      </span>
      <div className="flex flex-wrap gap-1">
        {SCOPES.map((s) => {
          const isActive = active === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => set("scope", s.key === "all" ? null : s.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-semibold transition",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
