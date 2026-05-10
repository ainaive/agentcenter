import { describe, it, expect } from "vitest";

import {
  parseFilters,
  pageOffset,
  PAGE_SIZE,
  filtersSchema,
  searchParamsToInput,
  serializeFilters,
  type Filters,
} from "@/lib/validators/filters";

describe("filtersSchema", () => {
  it("accepts valid filters", () => {
    const result = filtersSchema.safeParse({
      q: "search",
      category: "skills",
      scope: "personal",
      sort: "downloads",
      page: 2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("skills");
      expect(result.data.page).toBe(2);
    }
  });

  it("rejects unknown category", () => {
    const result = filtersSchema.safeParse({ category: "unknown" });
    expect(result.success).toBe(false);
  });

  it("coerces page from string", () => {
    const result = filtersSchema.safeParse({ page: "3" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.page).toBe(3);
  });

  it("rejects page 0", () => {
    const result = filtersSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects q longer than 120 chars", () => {
    const result = filtersSchema.safeParse({ q: "a".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("trims q whitespace", () => {
    const result = filtersSchema.safeParse({ q: "  hello  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.q).toBe("hello");
  });

  it("drops q when only whitespace", () => {
    const result = filtersSchema.safeParse({ q: "   " });
    // min(1) after trim means empty string fails, so q should be undefined
    expect(result.success).toBe(false);
  });

  it("caps tags array at 16", () => {
    const tags = Array.from({ length: 17 }, (_, i) => `tag${i}`);
    const result = filtersSchema.safeParse({ tags });
    expect(result.success).toBe(false);
  });

  it("accepts creator and publisher ids", () => {
    const result = filtersSchema.safeParse({
      creator: "user-amy",
      publisher: "anthropic",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.creator).toBe("user-amy");
      expect(result.data.publisher).toBe("anthropic");
    }
  });

  it("rejects creator/publisher longer than 80 chars", () => {
    expect(filtersSchema.safeParse({ creator: "a".repeat(81) }).success).toBe(
      false,
    );
    expect(
      filtersSchema.safeParse({ publisher: "a".repeat(81) }).success,
    ).toBe(false);
  });
});

describe("parseFilters", () => {
  it("returns empty object for empty input", () => {
    expect(parseFilters({})).toEqual({});
  });

  it("ignores invalid values without throwing", () => {
    const result = parseFilters({ category: "invalid", page: "abc" });
    expect(result.category).toBeUndefined();
    expect(result.page).toBeUndefined();
  });

  it("splits comma-separated tags string", () => {
    const result = parseFilters({ tags: "search,api,stable" });
    expect(result.tags).toEqual(["search", "api", "stable"]);
  });

  it("keeps tags array as-is", () => {
    const result = parseFilters({ tags: ["search", "api"] });
    expect(result.tags).toEqual(["search", "api"]);
  });

  it("filters out empty tag strings", () => {
    const result = parseFilters({ tags: "search,,api" });
    expect(result.tags).toEqual(["search", "api"]);
  });

  it("parses sort correctly", () => {
    expect(parseFilters({ sort: "stars" }).sort).toBe("stars");
    expect(parseFilters({ sort: "invalid" }).sort).toBeUndefined();
  });

  it("parses dept as plain string", () => {
    expect(parseFilters({ dept: "eng.cloud" }).dept).toBe("eng.cloud");
    expect(parseFilters({ dept: "__all" }).dept).toBe("__all");
  });
});

describe("searchParamsToInput", () => {
  it("returns single values as strings", () => {
    expect(
      searchParamsToInput(new URLSearchParams("category=skills&scope=personal")),
    ).toEqual({ category: "skills", scope: "personal" });
  });

  it("accumulates repeated keys into an array (?tags=a&tags=b)", () => {
    expect(
      searchParamsToInput(new URLSearchParams("tags=a&tags=b")),
    ).toEqual({ tags: ["a", "b"] });
  });

  it("accumulates three+ repeats into the same array", () => {
    expect(
      searchParamsToInput(new URLSearchParams("tags=a&tags=b&tags=c")),
    ).toEqual({ tags: ["a", "b", "c"] });
  });

  it("preserves a comma-joined single value as one string (the validator splits later)", () => {
    expect(
      searchParamsToInput(new URLSearchParams("tags=a%2Cb")),
    ).toEqual({ tags: "a,b" });
  });

  it("returns empty object for empty params", () => {
    expect(searchParamsToInput(new URLSearchParams())).toEqual({});
  });
});

describe("serializeFilters", () => {
  it("returns empty params for an empty object", () => {
    expect(serializeFilters({}).toString()).toBe("");
  });

  it("encodes scalar fields", () => {
    const out = serializeFilters({ category: "skills", scope: "personal" });
    expect(out.get("category")).toBe("skills");
    expect(out.get("scope")).toBe("personal");
  });

  it("comma-joins array fields", () => {
    expect(serializeFilters({ tags: ["a", "b"] }).get("tags")).toBe("a,b");
  });

  it("omits keys whose value is undefined", () => {
    const out = serializeFilters({ category: "skills", scope: undefined });
    expect(out.has("scope")).toBe(false);
    expect(out.get("category")).toBe("skills");
  });

  it("omits keys whose value is an empty array", () => {
    expect(serializeFilters({ tags: [] }).has("tags")).toBe(false);
  });

  it("encodes page as a string", () => {
    expect(serializeFilters({ page: 4 }).get("page")).toBe("4");
  });
});

describe("parseFilters / serializeFilters round trip", () => {
  const cases: Filters[] = [
    {},
    { category: "skills" },
    { category: "mcp", scope: "org", sort: "stars", page: 2 },
    { tags: ["search", "api"], tagMatch: "all" },
    { q: "vector db", filter: "trending" },
    { creator: "user-amy" },
    { publisher: "anthropic" },
    { creator: "user-ben", publisher: "github" },
    {
      category: "skills",
      scope: "personal",
      funcCat: "workTask",
      subCat: "search",
      l2: "backend",
      dept: "eng.cloud",
      tags: ["a", "b"],
      tagMatch: "any",
      filter: "official",
      sort: "recent",
      page: 5,
      q: "hello",
    },
  ];

  for (const input of cases) {
    it(`round-trips ${JSON.stringify(input)}`, () => {
      const params = serializeFilters(input);
      const back = parseFilters(
        Object.fromEntries(params.entries()) as Record<string, string>,
      );
      expect(back).toEqual(input);
    });
  }
});

describe("pageOffset", () => {
  it("returns 0 for page 1", () => {
    expect(pageOffset(1)).toBe(0);
  });

  it("returns 0 for undefined page", () => {
    expect(pageOffset(undefined)).toBe(0);
  });

  it("returns PAGE_SIZE for page 2", () => {
    expect(pageOffset(2)).toBe(PAGE_SIZE);
  });

  it("returns correct offset for page 5", () => {
    expect(pageOffset(5)).toBe(4 * PAGE_SIZE);
  });
});
