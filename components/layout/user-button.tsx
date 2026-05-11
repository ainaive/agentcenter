"use client";

import { LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth/client";
import { Link, useRouter } from "@/lib/i18n/navigation";

export function UserButton() {
  const t = useTranslations("auth.userMenu");
  const tNav = useTranslations("nav");
  const router = useRouter();
  // useSession is reactive — it re-renders when sign-in/sign-out happens
  // via the same authClient, so the avatar appears without a page refresh.
  const { data } = authClient.useSession();
  const session = data ? { user: data.user } : null;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Sign-out failed:", err);
    } finally {
      setOpen(false);
    }
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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={tNav("userMenu")}
        className="bg-primary/10 border-primary/40 flex size-8 cursor-pointer items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold transition hover:bg-primary/20"
      >
        <span aria-hidden className="text-primary">{initials}</span>
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
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="text-foreground hover:bg-secondary flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition"
          >
            <User className="size-3.5" aria-hidden />
            {t("profile")}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-foreground hover:bg-secondary flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition"
          >
            <LogOut className="size-3.5" aria-hidden />
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
