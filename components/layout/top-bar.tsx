"use client";

import { Globe, Menu, Search, User } from "lucide-react";
import Link from "next/link";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  return (
    <header className="bg-background/80 border-border sticky top-0 z-10 flex h-[52px] flex-shrink-0 items-center gap-3 border-b px-5 backdrop-blur-xl backdrop-saturate-150">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors"
      >
        <Menu className="size-[18px]" />
      </button>

      <Link href="/" className="mr-2 flex items-baseline gap-2.5">
        <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full">
          <span className="serif text-sm font-medium italic">A</span>
        </span>
        <span className="serif text-lg tracking-tight">
          Agent
          <span className="text-primary font-light italic">Center</span>
        </span>
      </Link>

      <div className="relative max-w-[520px] flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-[15px] -translate-y-1/2" />
        <input
          type="search"
          placeholder="Search skills, MCP servers, slash commands…"
          className="bg-muted border-input placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 w-full rounded-lg border py-1.5 pr-3 pl-9 text-[13px] outline-none transition-colors focus:ring-3"
        />
      </div>

      <div className="flex-1" />

      <nav className="flex items-center gap-0.5">
        {["Explore", "Publish", "Docs"].map((label) => (
          <Link
            key={label}
            href="#"
            className="text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="bg-secondary border-border text-foreground hover:bg-secondary/70 flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-semibold transition-colors"
      >
        <Globe className="text-muted-foreground size-[13px]" />
        中文
      </button>

      <div className="bg-primary/10 border-primary/40 flex size-8 cursor-pointer items-center justify-center rounded-full border-[1.5px]">
        <User className="text-primary size-[15px]" />
      </div>
    </header>
  );
}
