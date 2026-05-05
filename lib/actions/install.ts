"use server";

import { eq, sql } from "drizzle-orm";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { installs } from "@/lib/db/schema/activity";
import { extensions } from "@/lib/db/schema/extension";
import {
  getOrCreateSystemCollection,
  isInCollection,
  upsertCollectionItem,
} from "@/lib/db/queries/collections";

export type InstallResult =
  | { ok: true; alreadyInstalled: boolean }
  | { ok: false; error: "unauthenticated" | "not_found" | "server_error" };

export async function installExtension(
  extensionId: string,
): Promise<InstallResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const [ext] = await db
    .select({ id: extensions.id })
    .from(extensions)
    .where(eq(extensions.id, extensionId))
    .limit(1);
  if (!ext) return { ok: false, error: "not_found" };

  const installedColId = await getOrCreateSystemCollection(
    session.user.id,
    "installed",
  );

  const alreadyInstalled = await isInCollection(installedColId, extensionId);

  if (!alreadyInstalled) {
    await db.insert(installs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      extensionId,
      version: "latest",
      source: "web",
    });

    await upsertCollectionItem(installedColId, extensionId);

    // Increment counter atomically.
    await db
      .update(extensions)
      .set({ downloadsCount: sql`${extensions.downloadsCount} + 1` })
      .where(eq(extensions.id, extensionId));
  }

  return { ok: true, alreadyInstalled };
}
