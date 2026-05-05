"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth/client";
import { Link, useRouter } from "@/lib/i18n/navigation";

export function UserButton() {
  const t = useTranslations("auth.userMenu");
  const router = useRouter();
  const [session, setSession] = useState<{
    user: { name?: string | null; email: string };
  } | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    authClient.getSession().then((s) => {
      setSession(s?.data?.session ? { user: s.data.user } : null);
    });
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="bg-secondary border-border text-foreground hover:bg-secondary/70 flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-semibold transition-colors"
      >
        {t("signIn")}
      </Link>
    );
  }

  async function handleSignOut() {
    await authClient.signOut();
    setSession(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : session.user.email[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="bg-primary/10 border-primary/40 flex size-8 cursor-pointer items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold transition hover:bg-primary/20"
      >
        <span className="text-primary">{initials}</span>
      </button>

      {open && (
        <div className="bg-card border-border absolute right-0 top-10 z-50 min-w-[160px] rounded-lg border py-1 shadow-lg">
          <div className="border-border border-b px-3 py-2.5">
            <p className="text-foreground truncate text-[12px] font-semibold">
              {session.user.name ?? session.user.email}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              {session.user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-foreground hover:bg-secondary flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition"
          >
            <LogOut className="size-3.5" />
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
