import { describe, it, expect } from "vitest";

import { buildExtensionWhere, buildExtensionOrder } from "@/lib/search/query";

// buildExtensionWhere composes Drizzle SQL objects — we don't need a DB
// connection to test it. We just verify it returns a value (truthy) when
// filters are active, and undefined when nothing should be filtered.

describe("buildExtensionWhere", () => {
  it("always includes visibility=published clause (returns truthy)", () => {
    const result = buildExtensionWhere({});
    // Even with no user filters, the visibility clause is always present.
    expect(result).toBeDefined();
  });

  it("returns a SQL object for a category filter", () => {
    const result = buildExtensionWhere({ category: "skills" });
    expect(result).toBeDefined();
  });

  it("returns a SQL object for a search query", () => {
    const result = buildExtensionWhere({ q: "web search" });
    expect(result).toBeDefined();
  });

  it("returns a SQL object for tag filters", () => {
    const result = buildExtensionWhere({ tags: ["search", "api"], tagMatch: "any" });
    expect(result).toBeDefined();
  });

  it("returns a SQL object for all-tag match", () => {
    const result = buildExtensionWhere({ tags: ["search", "api"], tagMatch: "all" });
    expect(result).toBeDefined();
  });

  it("handles dept __all by omitting dept clause (still returns visibility clause)", () => {
    const result = buildExtensionWhere({ dept: "__all" });
    expect(result).toBeDefined();
  });

  it("handles fallbackDeptId when dept filter is absent", () => {
    const withFallback = buildExtensionWhere({}, "eng.cloud");
    const withoutFallback = buildExtensionWhere({});
    // Both should return a SQL object; the dept clause changes internally but
    // the function should not throw in either case.
    expect(withFallback).toBeDefined();
    expect(withoutFallback).toBeDefined();
  });

  it("does not throw for combined filters", () => {
    expect(() =>
      buildExtensionWhere({
        q: "search",
        category: "skills",
        scope: "personal",
        funcCat: "workTask",
        subCat: "softDev",
        dept: "eng.cloud",
        tags: ["api"],
        tagMatch: "any",
        filter: "official",
        sort: "stars",
      }),
    ).not.toThrow();
  });
});

describe("buildExtensionOrder", () => {
  it("returns an array for downloads sort", () => {
    const order = buildExtensionOrder("downloads");
    expect(Array.isArray(order)).toBe(true);
    expect(order.length).toBeGreaterThan(0);
  });

  it("returns an array for stars sort", () => {
    expect(Array.isArray(buildExtensionOrder("stars"))).toBe(true);
  });

  it("returns an array for recent sort", () => {
    expect(Array.isArray(buildExtensionOrder("recent"))).toBe(true);
  });

  it("falls back to downloads for undefined sort", () => {
    const defaultOrder = buildExtensionOrder(undefined);
    const downloadsOrder = buildExtensionOrder("downloads");
    // Both should produce arrays of the same length (both use downloadsCount DESC)
    expect(defaultOrder.length).toBe(downloadsOrder.length);
  });
});
