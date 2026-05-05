import { describe, it, expect } from "vitest";

import { bundleKey } from "@/lib/storage/r2";

describe("bundleKey", () => {
  it("produces the expected path format", () => {
    expect(bundleKey("my-skill", "1.0.0")).toBe("bundles/my-skill/1.0.0/bundle.zip");
  });

  it("handles slugs with hyphens", () => {
    expect(bundleKey("web-search-pro", "2.3.1")).toBe(
      "bundles/web-search-pro/2.3.1/bundle.zip",
    );
  });

  it("always ends with bundle.zip", () => {
    const key = bundleKey("some-ext", "0.0.1");
    expect(key.endsWith("/bundle.zip")).toBe(true);
  });

  it("starts with bundles/", () => {
    const key = bundleKey("some-ext", "1.0.0");
    expect(key.startsWith("bundles/")).toBe(true);
  });
});
