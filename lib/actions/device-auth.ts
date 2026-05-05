"use server";

import { and, eq, gt } from "drizzle-orm";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { sessions, verifications } from "@/lib/db/schema/auth";

export type AuthorizeResult =
  | { ok: true }
  | { ok: false; error: "unauthenticated" | "invalid_code" | "expired" | "server_error" };

export async function authorizeDevice(userCode: string): Promise<AuthorizeResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const now = new Date();

  // Look up the reverse-lookup record to get the deviceCode.
  const [lookup] = await db
    .select({ id: verifications.id, value: verifications.value })
    .from(verifications)
    .where(
      and(
        eq(verifications.identifier, `dc:user:${userCode.toUpperCase()}`),
        gt(verifications.expiresAt, now),
      ),
    )
    .limit(1);

  if (!lookup) return { ok: false, error: "invalid_code" };

  const deviceCode = lookup.value;

  // Find the poll record and update it with an authorized CLI session token.
  const [pollRow] = await db
    .select({ id: verifications.id })
    .from(verifications)
    .where(
      and(
        eq(verifications.identifier, `dc:poll:${deviceCode}`),
        gt(verifications.expiresAt, now),
      ),
    )
    .limit(1);

  if (!pollRow) return { ok: false, error: "expired" };

  // Create a long-lived CLI session (30 days).
  const cliToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    token: cliToken,
    expiresAt,
  });

  // Stamp the poll record as authorized.
  await db
    .update(verifications)
    .set({
      value: JSON.stringify({
        authorized: true,
        token: cliToken,
        userId: session.user.id,
      }),
    })
    .where(eq(verifications.id, pollRow.id));

  // Clean up the reverse-lookup record.
  await db.delete(verifications).where(eq(verifications.id, lookup.id));

  return { ok: true };
}
