import { describe, it, expect } from "vitest";
import type { z } from "zod";

import {
  BundleManifestSchema,
  ExtensionManifestCore,
  ManifestFormSchema,
} from "@/lib/validators/manifest";

const VALID_FORM: z.input<typeof ManifestFormSchema> = {
  slug: "my-skill",
  name: "My Skill",
  version: "1.0.0",
  category: "skills",
  scope: "personal",
  funcCat: "workTask",
  subCat: "search",
  description: "Does things.",
  tagIds: [],
};

const VALID_BUNDLE: z.input<typeof BundleManifestSchema> = {
  extension: {
    slug: "my-skill",
    name: "My Skill",
    version: "1.0.0",
    category: "skills",
    scope: "personal",
    description: "Does things.",
  },
  categorization: {
    funcCat: "workTask",
    subCat: "search",
  },
};

// ---------- Shared core constraints ----------

describe("ExtensionManifestCore", () => {
  describe("slug", () => {
    it("requires min 3 chars", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_FORM, slug: "ab" }).success,
      ).toBe(false);
    });

    it("rejects > 64 chars (was 80 in old form schema — drift fix)", () => {
      const long = "a".repeat(65);
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_FORM, slug: long }).success,
      ).toBe(false);
    });

    it("rejects uppercase", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_FORM, slug: "My-Skill" })
          .success,
      ).toBe(false);
    });

    it("accepts hyphens between words", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_FORM, slug: "my-cool-skill" })
          .success,
      ).toBe(true);
    });
  });

  describe("description", () => {
    it("is required (was optional in old form schema — drift fix)", () => {
      const { description: _description, ...rest } = VALID_FORM;
      expect(ExtensionManifestCore.safeParse(rest).success).toBe(false);
    });

    it("rejects > 280 chars (was 300 in old form schema — drift fix)", () => {
      const long = "x".repeat(281);
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_FORM, description: long })
          .success,
      ).toBe(false);
    });
  });

  describe("name", () => {
    it("requires min 2 chars (was min 1 in old bundle schema — drift fix)", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_FORM, name: "x" }).success,
      ).toBe(false);
    });
  });

  describe("version", () => {
    it("accepts semver", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_FORM, version: "2.3.1" })
          .success,
      ).toBe(true);
    });

    it("rejects non-semver", () => {
      for (const bad of ["v1.0", "1.0", "latest"]) {
        expect(
          ExtensionManifestCore.safeParse({ ...VALID_FORM, version: bad })
            .success,
        ).toBe(false);
      }
    });
  });
});

// ---------- Form-specific extras ----------

describe("ManifestFormSchema", () => {
  it("accepts a minimal valid manifest", () => {
    expect(ManifestFormSchema.safeParse(VALID_FORM).success).toBe(true);
  });

  it("accepts all optional UI fields", () => {
    const result = ManifestFormSchema.safeParse({
      ...VALID_FORM,
      nameZh: "我的技能",
      tagline: "A great skill",
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

  describe("tagIds", () => {
    it("accepts up to 8 tags", () => {
      const tagIds = Array.from({ length: 8 }, (_, i) => `tag${i}`);
      expect(ManifestFormSchema.safeParse({ ...VALID_FORM, tagIds }).success).toBe(
        true,
      );
    });

    it("rejects more than 8 tags", () => {
      const tagIds = Array.from({ length: 9 }, (_, i) => `tag${i}`);
      expect(ManifestFormSchema.safeParse({ ...VALID_FORM, tagIds }).success).toBe(
        false,
      );
    });
  });

  describe("optional URLs", () => {
    it("accepts empty string for optional URL fields", () => {
      const result = ManifestFormSchema.safeParse({
        ...VALID_FORM,
        homepageUrl: "",
        repoUrl: "",
      });
      expect(result.success).toBe(true);
    });

    it("rejects malformed URLs", () => {
      expect(
        ManifestFormSchema.safeParse({ ...VALID_FORM, homepageUrl: "not-a-url" })
          .success,
      ).toBe(false);
    });
  });
});

// ---------- Bundle-specific shape ----------

describe("BundleManifestSchema", () => {
  it("accepts a minimal valid bundle", () => {
    expect(BundleManifestSchema.safeParse(VALID_BUNDLE).success).toBe(true);
  });

  it("rejects when [extension] section is missing", () => {
    const { extension: _e, ...rest } = VALID_BUNDLE;
    expect(BundleManifestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when [categorization] section is missing", () => {
    const { categorization: _c, ...rest } = VALID_BUNDLE;
    expect(BundleManifestSchema.safeParse(rest).success).toBe(false);
  });

  it("inherits the slug regex from the core", () => {
    const bad = {
      ...VALID_BUNDLE,
      extension: { ...VALID_BUNDLE.extension, slug: "Bad Slug" },
    };
    expect(BundleManifestSchema.safeParse(bad).success).toBe(false);
  });

  it("inherits the slug max-64 from the core (old bundle had no regex either)", () => {
    const bad = {
      ...VALID_BUNDLE,
      extension: { ...VALID_BUNDLE.extension, slug: "a".repeat(65) },
    };
    expect(BundleManifestSchema.safeParse(bad).success).toBe(false);
  });

  it("requires description (was already required, still required)", () => {
    const { description: _d, ...extRest } = VALID_BUNDLE.extension;
    const bad = { ...VALID_BUNDLE, extension: extRest };
    expect(BundleManifestSchema.safeParse(bad).success).toBe(false);
  });
});
