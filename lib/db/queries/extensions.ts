import { count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { extensions, extensionTags } from "@/lib/db/schema";
import {
  buildExtensionOrder,
  buildExtensionWhere,
} from "@/lib/search/query";
import {
  PAGE_SIZE,
  pageOffset,
  type Filters,
} from "@/lib/validators/filters";

const listSelect = {
  id: extensions.id,
  slug: extensions.slug,
  category: extensions.category,
  badge: extensions.badge,
  scope: extensions.scope,
  funcCat: extensions.funcCat,
  subCat: extensions.subCat,
  l2: extensions.l2,
  deptId: extensions.deptId,
  iconEmoji: extensions.iconEmoji,
  iconColor: extensions.iconColor,
  name: extensions.name,
  nameZh: extensions.nameZh,
  description: extensions.description,
  descriptionZh: extensions.descriptionZh,
  downloadsCount: extensions.downloadsCount,
  starsAvg: extensions.starsAvg,
  // array_agg returns null when the LEFT JOIN finds no tags; coalesce to '{}'.
  tagIds: sql<string[]>`coalesce(array_agg(${extensionTags.tagId}) FILTER (WHERE ${extensionTags.tagId} IS NOT NULL), '{}')`,
};

export async function listExtensions(filters: Filters) {
  const where = buildExtensionWhere(filters);
  const order = buildExtensionOrder(filters.sort);

  return db
    .select(listSelect)
    .from(extensions)
    .leftJoin(
      extensionTags,
      eq(extensionTags.extensionId, extensions.id),
    )
    .where(where)
    .groupBy(extensions.id)
    .orderBy(...order)
    .limit(PAGE_SIZE)
    .offset(pageOffset(filters.page));
}

export type ExtensionListItem = Awaited<
  ReturnType<typeof listExtensions>
>[number];

export async function countFilteredExtensions(filters: Filters) {
  const where = buildExtensionWhere(filters);
  const [row] = await db
    .select({ count: count() })
    .from(extensions)
    .where(where);
  return Number(row?.count ?? 0);
}

export async function getFeaturedExtension() {
  const [row] = await db
    .select({
      id: extensions.id,
      slug: extensions.slug,
      name: extensions.name,
      nameZh: extensions.nameZh,
      description: extensions.description,
      descriptionZh: extensions.descriptionZh,
      iconEmoji: extensions.iconEmoji,
      iconColor: extensions.iconColor,
      downloadsCount: extensions.downloadsCount,
    })
    .from(extensions)
    .where(eq(extensions.badge, "official"))
    .orderBy(desc(extensions.downloadsCount))
    .limit(1);
  return row ?? null;
}

export async function countPublishedExtensions() {
  const [row] = await db
    .select({ count: count() })
    .from(extensions)
    .where(eq(extensions.visibility, "published"));
  return Number(row?.count ?? 0);
}
