import { describe, it, expect } from "vitest";

import { isValidTheme } from "./theme";

describe("isValidTheme", () => {
  it("accepts ivory", () => expect(isValidTheme("ivory")).toBe(true));
  it("accepts dark", () => expect(isValidTheme("dark")).toBe(true));

  it("rejects unknown string", () => expect(isValidTheme("light")).toBe(false));
  it("rejects empty string", () => expect(isValidTheme("")).toBe(false));
  it("rejects null", () => expect(isValidTheme(null)).toBe(false));
  it("rejects number", () => expect(isValidTheme(1)).toBe(false));
  it("is case-sensitive", () => expect(isValidTheme("Ivory")).toBe(false));
});
