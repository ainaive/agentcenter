import { Inngest } from "inngest";

// `isDev: true` routes events to the local Inngest dev server
// (`http://localhost:8288` — start it with `npx inngest-cli@latest dev`)
// and skips the `INNGEST_EVENT_KEY` requirement. In production we always
// route to Inngest cloud and the event key must be set.
export const inngest = new Inngest({
  id: "agentcenter",
  eventKey: process.env.INNGEST_EVENT_KEY,
  isDev: process.env.NODE_ENV !== "production",
});
