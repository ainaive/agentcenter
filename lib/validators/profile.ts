import { z } from "zod";

// Profile form for the Settings → Profile sub-tab. Email is read-only at the
// schema level — we don't accept it here. Department is a free-form string
// (validated against DEPARTMENTS at the UI layer; the column has no FK so a
// stray value would land as a logical-only reference).
export const PROFILE_NAME_MIN = 1;
export const PROFILE_NAME_MAX = 80;
export const PROFILE_DEPT_ID_MAX = 120;
export const PROFILE_BIO_MAX = 280;

// Zod 4: `.default(...)` already treats `undefined` as optional input, so
// chaining `.optional().default(...)` is redundant.
export const ProfileFormSchema = z.object({
  name: z.string().min(PROFILE_NAME_MIN).max(PROFILE_NAME_MAX),
  defaultDeptId: z.string().max(PROFILE_DEPT_ID_MAX).default(""),
  bio: z.string().max(PROFILE_BIO_MAX).default(""),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;
