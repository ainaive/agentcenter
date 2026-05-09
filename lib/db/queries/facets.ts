import { count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/auth";
import { extensions } from "@/lib/db/schema/extension";
import { organizations } from "@/lib/db/schema/org";

export async function listPublishedCreators() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      count: count(extensions.id),
    })
    .from(extensions)
    .innerJoin(users, eq(users.id, extensions.publisherUserId))
    .where(eq(extensions.visibility, "published"))
    .groupBy(users.id)
    .orderBy(desc(count(extensions.id)), users.email);
}

export type CreatorFacet = Awaited<
  ReturnType<typeof listPublishedCreators>
>[number];

export async function listPublishedPublishers() {
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      nameZh: organizations.nameZh,
      slug: organizations.slug,
      count: count(extensions.id),
    })
    .from(extensions)
    .innerJoin(organizations, eq(organizations.id, extensions.ownerOrgId))
    .where(eq(extensions.visibility, "published"))
    .groupBy(organizations.id)
    .orderBy(desc(count(extensions.id)), organizations.name);
}

export type PublisherFacet = Awaited<
  ReturnType<typeof listPublishedPublishers>
>[number];
