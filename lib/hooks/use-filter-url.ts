"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/**
 * Centralizes URL-based filter state for /extensions. Filters live in the
 * query string so the server renders results directly; client widgets use
 * this hook to read and update them.
 */
export function useFilterUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function commit(params: URLSearchParams) {
    // Reset pagination when any filter changes.
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function set(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    commit(params);
  }

  function setMulti(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams);
    if (values.length === 0) {
      params.delete(key);
    } else {
      params.set(key, values.join(","));
    }
    commit(params);
  }

  function get(key: string): string | null {
    return searchParams.get(key);
  }

  function getMulti(key: string): string[] {
    const v = searchParams.get(key);
    return v ? v.split(",").filter(Boolean) : [];
  }

  return { get, getMulti, set, setMulti, pending };
}
