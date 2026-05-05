import { describe, it, expect } from "vitest";

import { tagLabel } from "./tags";

describe("tagLabel", () => {
  it("returns English label for en locale", () => {
    expect(tagLabel("search", "en")).toBe("search");
  });

  it("returns Chinese label for zh locale", () => {
    expect(tagLabel("search", "zh")).toBe("搜索");
  });

  it("falls back to key for unknown tag in en", () => {
    expect(tagLabel("unknown-tag", "en")).toBe("unknown-tag");
  });

  it("falls back to key for unknown tag in zh", () => {
    expect(tagLabel("unknown-tag", "zh")).toBe("unknown-tag");
  });

  it("handles tags with uppercase labels (api → API in zh)", () => {
    expect(tagLabel("api", "zh")).toBe("API");
  });

  it("handles tags where en and zh labels differ in casing", () => {
    expect(tagLabel("ocr", "en")).toBe("ocr");
    expect(tagLabel("ocr", "zh")).toBe("OCR");
  });
});
