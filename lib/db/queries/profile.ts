import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  extensionVersions,
  extensions,
} from "@/lib/db/schema/extension";

export type ProfilePublishedRow = {
  extensionId: string;
  slug: string;
  name: string;
  category: string;
  iconColor: string | null;
  latestVersion: string | null;
  downloadsCount: number;
  starsAvg: string;
  ratingsCount: number;
};

export async function getPublishedForUser(
  userId: string,
): Promise<ProfilePublishedRow[]> {
  // Latest published version per extension. Drizzle doesn't expose
  // DISTINCT ON cleanly, so we ORDER BY publishedAt desc and collapse
  // duplicates client-side — mirrors `getMyExtensions` in
  // lib/actions/publish.ts.
  const rows = await db
    .select({
      extensionId: extensions.id,
      slug: extensions.slug,
      name: extensions.name,
      category: extensions.category,
      iconColor: extensions.iconColor,
      latestVersion: extensionVersions.version,
      downloadsCount: extensions.downloadsCount,
      starsAvg: extensions.starsAvg,
      ratingsCount: extensions.ratingsCount,
    })
    .from(extensions)
    .leftJoin(
      extensionVersions,
      and(
        eq(extensionVersions.extensionId, extensions.id),
        eq(extensionVersions.status, "ready"),
      ),
    )
    .where(
      and(
        eq(extensions.publisherUserId, userId),
        eq(extensions.visibility, "published"),
      ),
    )
    .orderBy(
      desc(extensions.publishedAt),
      desc(extensionVersions.publishedAt),
    );

  const seen = new Set<string>();
  const out: ProfilePublishedRow[] = [];
  for (const r of rows) {
    if (seen.has(r.extensionId)) continue;
    seen.add(r.extensionId);
    out.push(r);
  }
  return out;
}
