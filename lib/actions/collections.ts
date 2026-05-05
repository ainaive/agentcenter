"use server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { collections } from "@/lib/db/schema/collection";
import {
  getOrCreateSystemCollection,
  upsertCollectionItem,
} from "@/lib/db/queries/collections";

export type SaveResult =
  | { ok: true; alreadySaved: boolean }
  | { ok: false; error: "unauthenticated" | "server_error" };

export async function saveExtension(
  extensionId: string,
): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const savedColId = await getOrCreateSystemCollection(
    session.user.id,
    "saved",
  );

  await upsertCollectionItem(savedColId, extensionId);
  return { ok: true, alreadySaved: false };
}

export type CreateCollectionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthenticated" | "server_error" };

export async function createCollection(
  name: string,
): Promise<CreateCollectionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const id = crypto.randomUUID();
  await db.insert(collections).values({
    id,
    ownerUserId: session.user.id,
    name: name.trim(),
  });

  return { ok: true, id };
}
