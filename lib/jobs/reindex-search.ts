import { revalidateTag } from "next/cache";

import { inngest } from "./client";
import { publishVersion, VersionStateError } from "@/lib/extensions/state";

export const reindexSearch = inngest.createFunction(
  {
    id: "reindex-search",
    triggers: [{ event: "extension/index.requested" }],
  },
  async ({ event, step }) => {
    const { versionId } = event.data as { versionId: string };

    let extensionId: string;
    try {
      const result = await step.run("publish-version", () => publishVersion(versionId));
      extensionId = result.extensionId;
    } catch (err) {
      if (err instanceof VersionStateError) {
        return { ok: false, reason: err.code };
      }
      throw err;
    }

    await step.run("revalidate-cache", async () => {
      revalidateTag("extensions", {});
    });

    await step.sendEvent("notify-published", {
      name: "extension/published",
      data: { extensionId, versionId },
    });

    return { ok: true, extensionId };
  },
);
