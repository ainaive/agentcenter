import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { ManifestFormSchema } from "@/lib/validators/manifest";

const VALID: z.input<typeof ManifestFormSchema> = {
  slug: "my-skill",
  name: "My Skill",
  version: "1.0.0",
  category: "skills",
  scope: "personal",
  funcCat: "workTask",
  subCat: "search",
  tagIds: [],
};

describe("ManifestFormSchema", () => {
  it("accepts a minimal valid manifest", () => {
    expect(ManifestFormSchema.safeParse(VALID).success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = ManifestFormSchema.safeParse({
      ...VALID,
      nameZh: "我的技能",
      tagline: "A great skill",
      description: "Does things.",
      descriptionZh: "做事情。",
      homepageUrl: "https://example.com",
      repoUrl: "https://github.com/foo/bar",
      licenseSpdx: "MIT",
      l2: "backend",
      deptId: "eng.cloud",
      tagIds: ["search", "api"],
    });
    expect(result.success).toBe(true);
  });

  describe("slug", () => {
    it("requires min 3 chars", () => {
      expect(ManifestFormSchema.safeParse({ ...VALID, slug: "ab" }).success).toBe(false);
    });

    it("rejects uppercase", () => {
      expect(ManifestFormSchema.safeParse({ ...VALID, slug: "My-Skill" }).success).toBe(false);
    });

    it("rejects spaces", () => {
      expect(ManifestFormSchema.safeParse({ ...VALID, slug: "my skill" }).success).toBe(false);
    });

    it("rejects leading hyphen", () => {
      expect(ManifestFormSchema.safeParse({ ...VALID, slug: "-my-skill" }).success).toBe(false);
    });

    it("accepts hyphens between words", () => {
      expect(ManifestFormSchema.safeParse({ ...VALID, slug: "my-cool-skill" }).success).toBe(true);
    });

    it("accepts numbers", () => {
      expect(ManifestFormSchema.safeParse({ ...VALID, slug: "skill-v2" }).success).toBe(true);
    });
  });

  describe("version", () => {
    it("accepts semver", () => {
      expect(ManifestFormSchema.safeParse({ ...VALID, version: "2.3.1" }).success).toBe(true);
    });

    it("rejects non-semver", () => {
      expect(ManifestFormSchema.safeParse({ ...VALID, version: "v1.0" }).success).toBe(false);
      expect(ManifestFormSchema.safeParse({ ...VALID, version: "1.0" }).success).toBe(false);
      expect(ManifestFormSchema.safeParse({ ...VALID, version: "latest" }).success).toBe(false);
    });
  });

  describe("category", () => {
    it("accepts all valid categories", () => {
      for (const cat of ["skills", "mcp", "slash", "plugins"] as const) {
        expect(ManifestFormSchema.safeParse({ ...VALID, category: cat }).success).toBe(true);
      }
    });

    it("rejects unknown category", () => {
      expect(ManifestFormSchema.safeParse({ ...VALID, category: "other" }).success).toBe(false);
    });
  });

  describe("tagIds", () => {
    it("accepts up to 8 tags", () => {
      const tagIds = Array.from({ length: 8 }, (_, i) => `tag${i}`);
      expect(ManifestFormSchema.safeParse({ ...VALID, tagIds }).success).toBe(true);
    });

    it("rejects more than 8 tags", () => {
      const tagIds = Array.from({ length: 9 }, (_, i) => `tag${i}`);
      expect(ManifestFormSchema.safeParse({ ...VALID, tagIds }).success).toBe(false);
    });
  });

  describe("optional URLs", () => {
    it("accepts empty string for optional URL fields", () => {
      const result = ManifestFormSchema.safeParse({
        ...VALID,
        homepageUrl: "",
        repoUrl: "",
      });
      expect(result.success).toBe(true);
    });

    it("rejects malformed URLs", () => {
      expect(
        ManifestFormSchema.safeParse({ ...VALID, homepageUrl: "not-a-url" }).success,
      ).toBe(false);
    });
  });
});
