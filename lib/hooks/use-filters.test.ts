// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const replaceMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => "/en/extensions",
}));

import { useFilters } from "@/lib/hooks/use-filters";

beforeEach(() => {
  replaceMock.mockClear();
  currentSearchParams = new URLSearchParams();
});

// Helper: extract the search-params portion of the URL the hook wrote.
function lastReplacedQuery(): URLSearchParams {
  const url = replaceMock.mock.calls.at(-1)?.[0] as string | undefined;
  if (!url) return new URLSearchParams();
  const qs = url.includes("?") ? url.split("?")[1] : "";
  return new URLSearchParams(qs);
}

describe("useFilters: read", () => {
  it("returns empty filters when the URL has no params", () => {
    const { result } = renderHook(() => useFilters());
    expect(result.current.filters).toEqual({});
  });

  it("parses scalar params into the typed filters object", () => {
    currentSearchParams = new URLSearchParams("category=skills&scope=personal");
    const { result } = renderHook(() => useFilters());
    expect(result.current.filters).toEqual({
      category: "skills",
      scope: "personal",
    });
  });

  it("splits comma-joined tags from the URL into an array", () => {
    currentSearchParams = new URLSearchParams("tags=a,b,c");
    const { result } = renderHook(() => useFilters());
    expect(result.current.filters.tags).toEqual(["a", "b", "c"]);
  });

  it("accumulates duplicate keys (?tags=a&tags=b) into an array", () => {
    currentSearchParams = new URLSearchParams("tags=a&tags=b");
    const { result } = renderHook(() => useFilters());
    expect(result.current.filters.tags).toEqual(["a", "b"]);
  });

  it("silently drops invalid URL state rather than throwing", () => {
    currentSearchParams = new URLSearchParams("category=bogus");
    const { result } = renderHook(() => useFilters());
    expect(result.current.filters).toEqual({});
  });
});

describe("useFilters: update", () => {
  it("writes a new key to the URL via router.replace", () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.update({ category: "skills" }));

    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(lastReplacedQuery().get("category")).toBe("skills");
  });

  it("merges with existing filters when only one key changes", () => {
    currentSearchParams = new URLSearchParams("scope=personal");
    const { result } = renderHook(() => useFilters());
    act(() => result.current.update({ category: "skills" }));

    const written = lastReplacedQuery();
    expect(written.get("category")).toBe("skills");
    expect(written.get("scope")).toBe("personal");
  });

  it("removes a key when set to undefined", () => {
    currentSearchParams = new URLSearchParams("category=skills&scope=personal");
    const { result } = renderHook(() => useFilters());
    act(() => result.current.update({ category: undefined }));

    const written = lastReplacedQuery();
    expect(written.has("category")).toBe(false);
    expect(written.get("scope")).toBe("personal");
  });

  it("encodes array fields as comma-joined", () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.update({ tags: ["search", "api"] }));

    expect(lastReplacedQuery().get("tags")).toBe("search,api");
  });

  it("supports atomic multi-key update", () => {
    const { result } = renderHook(() => useFilters());
    act(() =>
      result.current.update({
        category: "skills",
        scope: "personal",
        sort: "stars",
      }),
    );

    expect(replaceMock).toHaveBeenCalledTimes(1);
    const written = lastReplacedQuery();
    expect(written.get("category")).toBe("skills");
    expect(written.get("scope")).toBe("personal");
    expect(written.get("sort")).toBe("stars");
  });

  it("calls router.replace with scroll:false to preserve scroll position", () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.update({ category: "skills" }));

    const opts = replaceMock.mock.calls.at(-1)?.[1] as { scroll?: boolean };
    expect(opts?.scroll).toBe(false);
  });

  it("uses just the pathname when all filters are cleared (no '?' in URL)", () => {
    currentSearchParams = new URLSearchParams("category=skills");
    const { result } = renderHook(() => useFilters());
    act(() => result.current.update({ category: undefined }));

    const url = replaceMock.mock.calls.at(-1)?.[0];
    expect(url).toBe("/en/extensions");
  });
});

describe("useFilters: page-reset behavior", () => {
  it("clears page from the URL when a non-page filter changes", () => {
    currentSearchParams = new URLSearchParams("category=skills&page=4");
    const { result } = renderHook(() => useFilters());
    act(() => result.current.update({ scope: "personal" }));

    expect(lastReplacedQuery().has("page")).toBe(false);
  });

  it("preserves page when the update explicitly includes page", () => {
    currentSearchParams = new URLSearchParams("category=skills");
    const { result } = renderHook(() => useFilters());
    act(() => result.current.update({ page: 3 }));

    expect(lastReplacedQuery().get("page")).toBe("3");
  });

  it("clears page even when the update is a no-op-looking change", () => {
    // User clicks the chip they're already on — still counts as "filter
    // changed" from the URL's perspective and should reset page.
    currentSearchParams = new URLSearchParams("category=skills&page=2");
    const { result } = renderHook(() => useFilters());
    act(() => result.current.update({ category: "skills" }));

    expect(lastReplacedQuery().has("page")).toBe(false);
  });
});
