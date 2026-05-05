"use server";

import { eq } from "drizzle-orm";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/auth";

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
