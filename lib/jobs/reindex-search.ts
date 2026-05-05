import { eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { inngest } from "./client";
import { db } from "@/lib/db/client";
import { extensions, extensionVersions } from "@/lib/db/schema";

export const reindexSearch = inngest.createFunction(
  {
    id: "reindex-search",
    triggers: [{ event: "extension/index.requested" }],
  },
  async ({ event, step }) => {
    const { versionId } = event.data as { versionId: string };

    const row = await step.run("fetch-version", async () => {
      const [r] = await db
        .select({ extensionId: extensionVersions.extensionId, version: extensionVersions.version })
        .from(extensionVersions)
        .where(eq(extensionVersions.id, versionId))
        .limit(1);
      return r ?? null;
    });

    if (!row) return { ok: false, reason: "version_not_found" };

    // Update tsvector + flip to published. The searchVector column is added
    // in the P12 FTS migration; until then the raw SQL falls back gracefully.
    await step.run("update-search-vector", async () => {
      try {
        await db.execute(sql`
          UPDATE extensions
          SET
            search_vector = to_tsvector('english',
              coalesce(name, '') || ' ' ||
              coalesce(name_zh, '') || ' ' ||
              coalesce(description, '') || ' ' ||
              coalesce(description_zh, '') || ' ' ||
              coalesce(tagline, '')
            ),
            visibility = 'published',
            published_at = now()
          WHERE id = ${row.extensionId}
        `);
      } catch {
        // searchVector column not yet present; just flip visibility
        await db
          .update(extensions)
          .set({ visibility: "published", publishedAt: new Date() })
          .where(eq(extensions.id, row.extensionId));
      }
    });

    await step.run("stamp-version", async () => {
      await db
        .update(extensionVersions)
        .set({ publishedAt: new Date() })
        .where(eq(extensionVersions.id, versionId));
    });

    await step.run("revalidate-cache", async () => {
      revalidateTag("extensions", {});
    });

    await step.sendEvent("notify-published", {
      name: "extension/published",
      data: { extensionId: row.extensionId, versionId },
    });

    return { ok: true, extensionId: row.extensionId };
  },
);
