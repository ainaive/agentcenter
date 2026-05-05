import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { collectionItems, collections } from "@/lib/db/schema/collection";

export async function getOrCreateSystemCollection(
  userId: string,
  kind: "installed" | "saved",
): Promise<string> {
  const existing = await db
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(eq(collections.ownerUserId, userId), eq(collections.systemKind, kind)),
    )
    .limit(1);

  if (existing[0]) return existing[0].id;

  const id = crypto.randomUUID();
  await db.insert(collections).values({
    id,
    ownerUserId: userId,
    name: kind === "installed" ? "Installed" : "Saved",
    systemKind: kind,
  });
  return id;
}

export async function isInCollection(
  collectionId: string,
  extensionId: string,
): Promise<boolean> {
  const row = await db
    .select({ collectionId: collectionItems.collectionId })
    .from(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.extensionId, extensionId),
      ),
    )
    .limit(1);
  return row.length > 0;
}

export async function upsertCollectionItem(
  collectionId: string,
  extensionId: string,
) {
  await db
    .insert(collectionItems)
    .values({ collectionId, extensionId })
    .onConflictDoNothing();
}

export async function getUserCollections(userId: string) {
  return db
    .select({
      id: collections.id,
      name: collections.name,
      systemKind: collections.systemKind,
    })
    .from(collections)
    .where(eq(collections.ownerUserId, userId))
    .orderBy(collections.createdAt);
}
