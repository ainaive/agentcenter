import { and, eq, gt } from "drizzle-orm";
import { z } from "zod/v4";

import { jsonError } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import { verifications } from "@/lib/db/schema/auth";

export const runtime = "nodejs";

const PollBody = z.object({ deviceCode: z.string().uuid() });

// POST /api/v1/auth/device/poll
// CLI calls this every 5 s. Returns pending / authorized (+ token) / expired.
export async function POST(req: Request) {
  let body: z.infer<typeof PollBody>;
  try {
    body = PollBody.parse(await req.json());
  } catch {
    return jsonError("Invalid request body.", 400, "invalid_body");
  }

  const [row] = await db
    .select({ id: verifications.id, value: verifications.value })
    .from(verifications)
    .where(
      and(
        eq(verifications.identifier, `dc:poll:${body.deviceCode}`),
        gt(verifications.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return Response.json({ status: "expired" });

  const state = JSON.parse(row.value) as {
    authorized: boolean;
    token: string | null;
  };

  if (!state.authorized) return Response.json({ status: "pending" });

  // Clean up after handing out the token once.
  await db.delete(verifications).where(eq(verifications.id, row.id));

  return Response.json({ status: "authorized", token: state.token });
}
