import { createAuthClient } from "better-auth/react";

// No baseURL — Better Auth's client falls back to the relative path
// "/api/auth", which the browser resolves against window.location.origin.
// That makes the client work on any host without needing NEXT_PUBLIC_APP_URL
// to be set in production. Hard-coding "http://localhost:3000" as a fallback
// silently broke signup on Vercel deploys missing the env var.
export const authClient = createAuthClient();

export type { Session } from "./index";
