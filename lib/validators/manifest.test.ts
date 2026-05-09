import { describe, it, expect } from "vitest";
import type { z } from "zod";

import {
  BundleManifestSchema,
  ExtensionManifestCore,
  ManifestFormSchema,
} from "@/lib/validators/manifest";

// Form sample matches the redesigned publish wizard's payload shape.
// Description / funcCat / subCat / URLs / license are no longer in the
// form (server defaults fill them in) — those are still validated at the
// bundle layer.
const VALID_FORM: z.input<typeof ManifestFormSchema> = {
  slug: "my-skill",
  name: "My Skill",
  version: "1.0.0",
  category: "skills",
  scope: "personal",
  summary: "Does things.",
  tagIds: [],
  permissions: {},
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

// Sample for ExtensionManifestCore tests — keeps the description field the
// core still requires, even though the wizard form no longer surfaces it.
const VALID_CORE = {
  slug: "my-skill",
  name: "My Skill",
  version: "1.0.0",
  category: "skills",
  scope: "personal",
  funcCat: "workTask",
  subCat: "search",
  description: "Does things.",
} as const;

// ---------- Shared core constraints ----------

describe("ExtensionManifestCore", () => {
  describe("slug", () => {
    it("requires min 3 chars", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_CORE, slug: "ab" }).success,
      ).toBe(false);
    });

    it("rejects > 64 chars", () => {
      const long = "a".repeat(65);
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_CORE, slug: long }).success,
      ).toBe(false);
    });

    it("rejects uppercase", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_CORE, slug: "My-Skill" })
          .success,
      ).toBe(false);
    });

    it("accepts hyphens between words", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_CORE, slug: "my-cool-skill" })
          .success,
      ).toBe(true);
    });
  });

  describe("description", () => {
    it("is required at the core (bundle still requires description)", () => {
      const { description: _description, ...rest } = VALID_CORE;
      expect(ExtensionManifestCore.safeParse(rest).success).toBe(false);
    });

    it("rejects > 280 chars", () => {
      const long = "x".repeat(281);
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_CORE, description: long })
          .success,
      ).toBe(false);
    });
  });

  describe("name", () => {
    it("requires min 2 chars", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_CORE, name: "x" }).success,
      ).toBe(false);
    });
  });

  describe("version", () => {
    it("accepts semver", () => {
      expect(
        ExtensionManifestCore.safeParse({ ...VALID_CORE, version: "2.3.1" })
          .success,
      ).toBe(true);
    });

    it("rejects non-semver", () => {
      for (const bad of ["v1.0", "1.0", "latest"]) {
        expect(
          ExtensionManifestCore.safeParse({ ...VALID_CORE, version: bad })
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
      taglineZh: "中文一句话",
      readmeMd: "# Hello\n\nA README.",
      iconColor: "amber",
      deptId: "eng.cloud",
      tagIds: ["search", "api"],
      permissions: { network: true, files: false },
      sourceMethod: "zip",
    });
    expect(result.success).toBe(true);
  });

  describe("summary", () => {
    it("is required", () => {
      const { summary: _s, ...rest } = VALID_FORM;
      expect(ManifestFormSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects > 80 chars", () => {
      const long = "x".repeat(81);
      expect(
        ManifestFormSchema.safeParse({ ...VALID_FORM, summary: long }).success,
      ).toBe(false);
    });
  });

  describe("iconColor", () => {
    it("defaults to indigo when omitted", () => {
      const result = ManifestFormSchema.safeParse(VALID_FORM);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.iconColor).toBe("indigo");
    });

    it("rejects unknown colors", () => {
      expect(
        ManifestFormSchema.safeParse({ ...VALID_FORM, iconColor: "neon" })
          .success,
      ).toBe(false);
    });
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

  describe("sourceMethod", () => {
    it("defaults to zip", () => {
      const result = ManifestFormSchema.safeParse(VALID_FORM);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.sourceMethod).toBe("zip");
    });

    it("only accepts zip in v1", () => {
      // Git/CLI source UIs exist in the wizard but are not wired end-to-end yet.
      expect(
        ManifestFormSchema.safeParse({ ...VALID_FORM, sourceMethod: "git" })
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

  it("inherits the slug max-64 from the core", () => {
    const bad = {
      ...VALID_BUNDLE,
      extension: { ...VALID_BUNDLE.extension, slug: "a".repeat(65) },
    };
    expect(BundleManifestSchema.safeParse(bad).success).toBe(false);
  });

  it("requires description at the bundle layer", () => {
    const { description: _d, ...extRest } = VALID_BUNDLE.extension;
    const bad = { ...VALID_BUNDLE, extension: extRest };
    expect(BundleManifestSchema.safeParse(bad).success).toBe(false);
  });
});
