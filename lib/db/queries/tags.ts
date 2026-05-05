import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { extensions, extensionTags, tags } from "@/lib/db/schema";

export interface TagWithCount {
  id: string;
  labelEn: string;
  labelZh: string;
  count: number;
}

export async function getTagsWithCounts(): Promise<TagWithCount[]> {
  const rows = await db
    .select({
      id: tags.id,
      labelEn: tags.labelEn,
      labelZh: tags.labelZh,
      // Count how many *published* extensions use this tag.
      count: sql<number>`count(${extensionTags.extensionId})::int`,
    })
    .from(tags)
    .leftJoin(extensionTags, eq(extensionTags.tagId, tags.id))
    .leftJoin(
      extensions,
      eq(extensions.id, extensionTags.extensionId),
    )
    .where(
      sql`${extensions.id} IS NULL OR ${extensions.visibility} = 'published'`,
    )
    .groupBy(tags.id)
    .orderBy(desc(sql`count(${extensionTags.extensionId})`));

  // Drop tags with zero usage from the picker.
  return rows.filter((r) => r.count > 0);
}
