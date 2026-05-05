import { inngest } from "./lib/jobs/client";
import { scanBundle, reindexSearch } from "./lib/jobs";

export default {
  client: inngest,
  functions: [scanBundle, reindexSearch],
};
