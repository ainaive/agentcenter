import { and, gt, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { verifications } from "@/lib/db/schema/auth";
import { jsonError } from "@/lib/api/auth";

export const runtime = "nodejs";

const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function generateUserCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  return `${part()}-${part()}`;
}

// POST /api/v1/auth/device/code
// Called by CLI at the start of the login flow. No auth required.
export async function POST() {
  const deviceCode = crypto.randomUUID();
  const userCode = generateUserCode();
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  try {
    // Poll record — CLI queries by deviceCode.
    await db.insert(verifications).values({
      id: crypto.randomUUID(),
      identifier: `dc:poll:${deviceCode}`,
      value: JSON.stringify({ userCode, authorized: false, token: null, userId: null }),
      expiresAt,
    });

    // Reverse-lookup — web page queries by userCode.
    await db.insert(verifications).values({
      id: crypto.randomUUID(),
      identifier: `dc:user:${userCode}`,
      value: deviceCode,
      expiresAt,
    });
  } catch {
    return jsonError("Failed to create device code.", 500, "server_error");
  }

  return Response.json({
    deviceCode,
    userCode,
    verificationUri: "/cli/auth",
    expiresIn: EXPIRY_MS / 1000,
  });
}
