"use client";

import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/lib/i18n/navigation";

export function useFilterUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function commit(params: URLSearchParams) {
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(
        qs ? `${pathname}?${qs}` : pathname,
        { scroll: false } as Parameters<typeof router.replace>[1],
      );
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
