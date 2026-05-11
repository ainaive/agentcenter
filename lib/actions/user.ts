"use server";

import { eq } from "drizzle-orm";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/auth";
import {
  ProfileFormSchema,
  type ProfileFormValues,
} from "@/lib/validators/profile";

export async function updateDepartment(
  deptId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  await db
    .update(users)
    .set({ defaultDeptId: deptId })
    .where(eq(users.id, session.user.id));

  return { ok: true };
}

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: "unauthenticated" | "invalid_input"; detail?: string };

export async function updateProfile(
  raw: ProfileFormValues,
): Promise<UpdateProfileResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = ProfileFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      detail: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const data = parsed.data;

  await db
    .update(users)
    .set({
      name: data.name,
      defaultDeptId: data.defaultDeptId === "" ? null : data.defaultDeptId,
      bio: data.bio === "" ? null : data.bio,
    })
    .where(eq(users.id, session.user.id));

  return { ok: true };
}
