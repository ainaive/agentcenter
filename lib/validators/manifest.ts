import { z } from "zod";

export const ManifestFormSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only"),
  name: z.string().min(2).max(80),
  nameZh: z.string().max(80).optional(),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Must be semver (e.g. 1.0.0)"),
  category: z.enum(["skills", "mcp", "slash", "plugins"]),
  scope: z.enum(["personal", "org", "enterprise"]),
  funcCat: z.enum(["workTask", "business", "tools"]),
  subCat: z.string().min(1).max(60),
  l2: z.string().max(60).optional(),
  deptId: z.string().optional(),
  tagIds: z.array(z.string()).max(8),
  description: z.string().max(300).optional(),
  descriptionZh: z.string().max(300).optional(),
  tagline: z.string().max(120).optional(),
  homepageUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  licenseSpdx: z.string().max(40).optional(),
});

export type ManifestFormValues = z.infer<typeof ManifestFormSchema>;
