import { describe, it, expect } from "vitest";

import { findDept, deptPath, isDescendant } from "./departments";

describe("findDept", () => {
  it("finds a root department", () => {
    expect(findDept("eng")?.name).toBe("Engineering");
  });

  it("finds a second-level department", () => {
    expect(findDept("eng.ai")?.name).toBe("AI Lab");
  });

  it("finds a deeply nested department", () => {
    expect(findDept("eng.cloud.infra")?.name).toBe("Infrastructure");
  });

  it("returns null for unknown id", () => {
    expect(findDept("nonexistent")).toBeNull();
  });

  it("returns null for partial prefix that doesn't match any id", () => {
    expect(findDept("eng.c")).toBeNull();
  });
});

describe("deptPath", () => {
  it("returns single-element path for root dept", () => {
    expect(deptPath("eng", "en")).toEqual(["Engineering"]);
  });

  it("returns full breadcrumb for nested dept", () => {
    expect(deptPath("eng.cloud.infra", "en")).toEqual([
      "Engineering",
      "Cloud Platform",
      "Infrastructure",
    ]);
  });

  it("uses zh names for zh locale", () => {
    expect(deptPath("eng.cloud", "zh")).toEqual(["研发中心", "云平台"]);
  });

  it("returns empty array for completely unknown dept", () => {
    expect(deptPath("unknown.dept", "en")).toEqual([]);
  });
});

describe("isDescendant", () => {
  it("returns true for exact match", () => {
    expect(isDescendant("eng", "eng")).toBe(true);
  });

  it("returns true for direct child", () => {
    expect(isDescendant("eng.cloud", "eng")).toBe(true);
  });

  it("returns true for deep descendant", () => {
    expect(isDescendant("eng.cloud.infra", "eng")).toBe(true);
  });

  it("returns false for sibling", () => {
    expect(isDescendant("eng.product", "eng.cloud")).toBe(false);
  });

  it("returns false for ancestor (reversed)", () => {
    expect(isDescendant("eng", "eng.cloud")).toBe(false);
  });

  it("requires dot separator — prefix alone does not match", () => {
    // 'engineering' must not be treated as a descendant of 'eng'
    expect(isDescendant("engineering", "eng")).toBe(false);
  });
});
