import { count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { extensions } from "@/lib/db/schema";

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
