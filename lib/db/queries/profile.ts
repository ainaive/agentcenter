import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { installs } from "@/lib/db/schema/activity";
import {
  extensionVersions,
  extensions,
} from "@/lib/db/schema/extension";

export type ProfileInstalledRow = {
  extensionId: string;
  slug: string;
  name: string;
  category: string;
  iconColor: string | null;
  installedVersion: string;
  installedAt: Date;
};

export async function getInstalledForUser(
  userId: string,
): Promise<ProfileInstalledRow[]> {
  // Active installs only — `uninstalledAt IS NULL`. Order by `installedAt
  // DESC` matches the design's "most recently installed first" sort.
  return db
    .select({
      extensionId: extensions.id,
      slug: extensions.slug,
      name: extensions.name,
      category: extensions.category,
      iconColor: extensions.iconColor,
      installedVersion: installs.version,
      installedAt: installs.installedAt,
    })
    .from(installs)
    .innerJoin(extensions, eq(extensions.id, installs.extensionId))
    .where(and(eq(installs.userId, userId), isNull(installs.uninstalledAt)))
    .orderBy(desc(installs.installedAt));
}

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
