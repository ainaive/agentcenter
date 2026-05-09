import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

// We use the WebSocket-backed Pool driver (not `neon-http`) because the HTTP
// driver doesn't support `db.transaction(...)`, which we rely on for the
// publish wizard, install recording, and version state transitions. Modern
// Node (22+) and Bun expose `globalThis.WebSocket`, so no `ws` polyfill is
// needed.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { casing: "snake_case" });
