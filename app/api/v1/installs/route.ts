import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod/v4";

import { authenticateBearerToken, jsonError } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import { installs } from "@/lib/db/schema/activity";
import { extensions } from "@/lib/db/schema/extension";
import {
  getOrCreateSystemCollection,
  isInCollection,
  upsertCollectionItem,
} from "@/lib/db/queries/collections";

export const runtime = "nodejs";

const InstallBody = z.object({
  extensionSlug: z.string().min(1),
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

  const [ext] = await db
    .select({ id: extensions.id, downloadsCount: extensions.downloadsCount })
    .from(extensions)
    .where(eq(extensions.slug, body.extensionSlug))
    .limit(1);

  if (!ext) return jsonError("Extension not found.", 404, "not_found");

  const installedColId = await getOrCreateSystemCollection(user.id, "installed");
  const already = await isInCollection(installedColId, ext.id);

  if (!already) {
    await db.insert(installs).values({
      id: crypto.randomUUID(),
      userId: user.id,
      extensionId: ext.id,
      version: body.version,
      source: "cli",
    });

    await upsertCollectionItem(installedColId, ext.id);

    await db
      .update(extensions)
      .set({ downloadsCount: ext.downloadsCount + 1 })
      .where(eq(extensions.id, ext.id));
  }

  return Response.json({ ok: true, alreadyInstalled: already });
}
