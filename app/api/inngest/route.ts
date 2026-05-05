import { serve } from "inngest/next";

import { inngest } from "@/lib/jobs/client";
import { scanBundle, reindexSearch } from "@/lib/jobs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scanBundle, reindexSearch],
});
