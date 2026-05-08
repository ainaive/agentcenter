import { NextRequest } from "next/server";
import { z } from "zod/v4";

import { authenticateBearerToken, jsonError } from "@/lib/api/auth";
import { InstallError, recordInstall } from "@/lib/installs/record";

export const runtime = "nodejs";

const InstallBody = z.object({
  extensionSlug: z.string().min(1),
  // CLI clients historically send "latest" as a sentinel; we resolve it to
  // the actual published version inside recordInstall when omitted.
  version: z.string().default("latest"),
  // Informational — stored for analytics but not validated against a schema.
  agentName: z.string().optional(),
  agentVersion: z.string().optional(),
});

// POST /api/v1/installs
// Called by the CLI after a successful local install to record the event.
// Requires: Authorization: Bearer <session-token>
export async function POST(req: NextRequest) {
  const user = await authenticateBearerToken(req);
  if (!user) return jsonError("Authentication required.", 401, "unauthenticated");

  let body: z.infer<typeof InstallBody>;
  try {
    body = InstallBody.parse(await req.json());
  } catch {
    return jsonError("Invalid request body.", 400, "invalid_body");
  }

  const version = body.version === "latest" ? undefined : body.version;

  try {
    const result = await recordInstall({
      userId: user.id,
      extension: { slug: body.extensionSlug },
      source: "cli",
      version,
    });
    return Response.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof InstallError) {
      const status = e.code === "extension_not_found" ? 404 : 422;
      return jsonError(e.code, status, e.code);
    }
    throw e;
  }
}
