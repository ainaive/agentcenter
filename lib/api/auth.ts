import { and, gt, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema/auth";

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  defaultDeptId: string | null;
};

/**
 * Authenticates a CLI request via `Authorization: Bearer <token>`.
 * Looks up the token in the sessions table and returns the user if valid.
 * Returns null when the header is absent, malformed, or the token is expired.
 */
export async function authenticateBearerToken(
  req: Request,
): Promise<ApiUser | null> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7).trim();
  if (!token) return null;

  const now = new Date();
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      defaultDeptId: users.defaultDeptId,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);

  return row ?? null;
}

export function jsonError(
  message: string,
  status: number,
  code?: string,
): Response {
  return Response.json(
    { error: code ?? "error", message },
    { status },
  );
}
