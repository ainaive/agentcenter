import { describe, expect, it } from "vitest";

import { extractScanReason } from "./scan-report";

describe("extractScanReason", () => {
  it("returns the reason string when present and non-empty", () => {
    expect(
      extractScanReason({
        manifestOk: false,
        reason: "manifest.toml missing required `name` field",
        checksum: "abc123",
      }),
    ).toBe("manifest.toml missing required `name` field");
  });

  it("returns null when reason is null (clean scan)", () => {
    expect(
      extractScanReason({
        manifestOk: true,
        reason: null,
        checksum: "abc123",
      }),
    ).toBeNull();
  });

  it("returns null when reason is missing entirely", () => {
    expect(extractScanReason({ manifestOk: true, checksum: "abc" })).toBeNull();
  });

  it("returns null when reason is the wrong type", () => {
    expect(extractScanReason({ reason: 42 })).toBeNull();
    expect(extractScanReason({ reason: { nested: "x" } })).toBeNull();
  });

  it("returns null for an empty string reason (don't render an empty label)", () => {
    expect(extractScanReason({ reason: "" })).toBeNull();
  });

  it("returns null for non-object inputs (legacy nulls, scalar values)", () => {
    expect(extractScanReason(null)).toBeNull();
    expect(extractScanReason(undefined)).toBeNull();
    expect(extractScanReason("just a string")).toBeNull();
    expect(extractScanReason(42)).toBeNull();
  });
});
