import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "agentcenter",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
