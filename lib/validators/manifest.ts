import { z } from "zod";

// Slug shape, exported so client-side form validators don't redefine it.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

// Single source of truth for what makes an extension manifest valid.
// Mirrors `docs/manifest-spec.md`. Form and bundle schemas below derive
// from this core; nothing should redefine these constraints elsewhere.
export const ExtensionManifestCore = z.object({
  slug: z
    .string()
    .min(3)
    .max(64)
    .regex(SLUG_PATTERN, "Lowercase letters, numbers and hyphens only"),
  name: z.string().min(2).max(80),
  nameZh: z.string().max(80).optional(),
  version: z.string().regex(SEMVER_PATTERN, "Must be semver (e.g. 1.0.0)"),
  category: z.enum(["skills", "mcp", "slash", "plugins"]),
  scope: z.enum(["personal", "org", "enterprise"]),
  funcCat: z.enum(["workTask", "business", "tools"]),
  subCat: z.string().min(1).max(60),
  l2: z.string().max(60).optional(),
  description: z.string().min(1).max(280),
  descriptionZh: z.string().max(280).optional(),
  tagline: z.string().max(120).optional(),
});

// Form: every core field plus the UI-only extras the publish wizard collects.
export const ManifestFormSchema = ExtensionManifestCore.extend({
  tagIds: z.array(z.string()).max(8),
  deptId: z.string().optional(),
  homepageUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  licenseSpdx: z.string().max(40).optional(),
});

export type ManifestFormValues = z.infer<typeof ManifestFormSchema>;

// Bundle: same fields, lifted into the [extension] / [categorization] TOML
// sections defined in docs/manifest-spec.md.
export const BundleManifestSchema = z.object({
  extension: ExtensionManifestCore.pick({
    slug: true,
    name: true,
    nameZh: true,
    version: true,
    category: true,
    scope: true,
    description: true,
    descriptionZh: true,
    tagline: true,
  }),
  categorization: ExtensionManifestCore.pick({
    funcCat: true,
    subCat: true,
    l2: true,
  }),
});

export type BundleManifest = z.infer<typeof BundleManifestSchema>;
