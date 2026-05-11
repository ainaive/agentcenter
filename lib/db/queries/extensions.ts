import { and, count, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  extensions,
  extensionTags,
  extensionVersions,
  files,
} from "@/lib/db/schema";
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

export async function listExtensions(
  filters: Filters,
  userDeptId?: string,
) {
  const where = buildExtensionWhere(filters, userDeptId);
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

export async function countFilteredExtensions(
  filters: Filters,
  userDeptId?: string,
) {
  const where = buildExtensionWhere(filters, userDeptId);
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

export async function getExtensionBySlug(slug: string) {
  const [row] = await db
    .select({
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
      tagline: extensions.tagline,
      taglineZh: extensions.taglineZh,
      description: extensions.description,
      descriptionZh: extensions.descriptionZh,
      readmeMd: extensions.readmeMd,
      homepageUrl: extensions.homepageUrl,
      repoUrl: extensions.repoUrl,
      licenseSpdx: extensions.licenseSpdx,
      compatibilityJson: extensions.compatibilityJson,
      downloadsCount: extensions.downloadsCount,
      starsAvg: extensions.starsAvg,
      ratingsCount: extensions.ratingsCount,
      publishedAt: extensions.publishedAt,
      tagIds: sql<string[]>`coalesce(array_agg(${extensionTags.tagId}) FILTER (WHERE ${extensionTags.tagId} IS NOT NULL), '{}')`,
    })
    .from(extensions)
    .leftJoin(
      extensionTags,
      eq(extensionTags.extensionId, extensions.id),
    )
    // Detail page is public — a draft extension must not be reachable
    // by guessing or sharing its slug.
    .where(
      and(eq(extensions.slug, slug), eq(extensions.visibility, "published")),
    )
    .groupBy(extensions.id)
    .limit(1);
  return row ?? null;
}

export type ExtensionDetail = NonNullable<
  Awaited<ReturnType<typeof getExtensionBySlug>>
>;

export async function getLatestExtensionVersion(extensionId: string) {
  const [row] = await db
    .select({
      version: extensionVersions.version,
      changelog: extensionVersions.changelog,
      changelogZh: extensionVersions.changelogZh,
      publishedAt: extensionVersions.publishedAt,
      bundleSize: files.size,
    })
    .from(extensionVersions)
    .leftJoin(files, eq(files.id, extensionVersions.bundleFileId))
    .where(
      and(
        eq(extensionVersions.extensionId, extensionId),
        eq(extensionVersions.status, "ready"),
      ),
    )
    .orderBy(desc(extensionVersions.publishedAt))
    .limit(1);
  return row ?? null;
}

export async function listExtensionVersions(extensionId: string) {
  return db
    .select({
      version: extensionVersions.version,
      changelog: extensionVersions.changelog,
      changelogZh: extensionVersions.changelogZh,
      publishedAt: extensionVersions.publishedAt,
    })
    .from(extensionVersions)
    .where(
      and(
        eq(extensionVersions.extensionId, extensionId),
        eq(extensionVersions.status, "ready"),
      ),
    )
    .orderBy(desc(extensionVersions.publishedAt))
    .limit(20);
}

export type ExtensionVersionRow = Awaited<
  ReturnType<typeof listExtensionVersions>
>[number];

export async function getRelatedExtensions(
  extensionId: string,
  category: ExtensionDetail["category"],
  limit = 4,
) {
  return db
    .select({
      id: extensions.id,
      slug: extensions.slug,
      name: extensions.name,
      nameZh: extensions.nameZh,
      iconEmoji: extensions.iconEmoji,
      iconColor: extensions.iconColor,
      starsAvg: extensions.starsAvg,
      downloadsCount: extensions.downloadsCount,
    })
    .from(extensions)
    .where(
      and(
        eq(extensions.category, category),
        eq(extensions.visibility, "published"),
        ne(extensions.id, extensionId),
      ),
    )
    .orderBy(desc(extensions.downloadsCount))
    .limit(limit);
}

export type RelatedExtension = Awaited<
  ReturnType<typeof getRelatedExtensions>
>[number];

export async function countPublishedExtensions() {
  const [row] = await db
    .select({ count: count() })
    .from(extensions)
    .where(eq(extensions.visibility, "published"));
  return Number(row?.count ?? 0);
}
