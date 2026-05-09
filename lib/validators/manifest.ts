import { z } from "zod";

// Slug shape, exported so client-side form validators don't redefine it.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

// "summary" is the redesigned wizard's one-line description; it lands in
// the existing `tagline` column. Capped at 80 chars to match the design.
export const SUMMARY_MAX = 80;

// Single source of truth for what makes an extension manifest valid.
// Mirrors `docs/manifest-spec.md`. Bundle and form schemas below derive
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

// Permissions toggled in the wizard — surfaced on the detail page so users
// know what the extension intends to do before installing.
export const PermissionsSchema = z
  .object({
    network: z.boolean().optional(),
    files: z.boolean().optional(),
    runtime: z.boolean().optional(),
    data: z.boolean().optional(),
  })
  .default({});

// Form: the slimmer field set the redesigned publish wizard collects.
// Notable departures from the prior form:
//   - `summary` (the design's one-line description, max 80) replaces the
//     long `description`/`descriptionZh` pair. Stored in the `tagline` column.
//   - `funcCat` / `subCat` / `l2` are gone from the wizard. Server-side
//     defaults (`defaultClassification`) backfill funcCat/subCat from the
//     chosen `category` so filters keep working.
//   - URL/license fields (homepageUrl, repoUrl, licenseSpdx) are dropped
//     from the wizard; the columns stay nullable in the DB.
//   - `iconColor`, `readmeMd`, `permissions`, `sourceMethod`, `taglineZh`
//     are new in the form and persist directly.
export const ManifestFormSchema = z.object({
  slug: ExtensionManifestCore.shape.slug,
  name: ExtensionManifestCore.shape.name,
  nameZh: ExtensionManifestCore.shape.nameZh,
  version: ExtensionManifestCore.shape.version,
  category: ExtensionManifestCore.shape.category,
  scope: ExtensionManifestCore.shape.scope,
  summary: z.string().min(1, "Required").max(SUMMARY_MAX),
  taglineZh: z.string().max(SUMMARY_MAX).optional(),
  readmeMd: z.string().optional(),
  iconColor: z
    .enum(["indigo", "amber", "emerald", "rose", "slate"])
    .default("indigo"),
  tagIds: z.array(z.string()).max(8),
  deptId: z.string().optional(),
  permissions: PermissionsSchema,
  sourceMethod: z.literal("zip").default("zip"),
});

export type ManifestFormValues = z.infer<typeof ManifestFormSchema>;

// Bundle: same fields as before, lifted into the [extension] /
// [categorization] TOML sections defined in docs/manifest-spec.md. The
// bundle manifest still carries description + funcCat + subCat — those
// come from whatever produced the bundle (CLI, hand-authored TOML), not
// from the publish wizard, so they remain required at the bundle layer.
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
