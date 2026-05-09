import { z } from "zod";

import { authenticateBearerToken } from "@/lib/api/auth";
import { generatePresignedPutUrl, bundleKey } from "@/lib/storage/r2";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const MAX_BUNDLE_SIZE = 50 * 1024 * 1024; // 50 MB

const BodySchema = z.object({
  slug: z.string().min(3).max(80),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  contentType: z.string().default("application/zip"),
  size: z.number().int().positive().max(MAX_BUNDLE_SIZE),
});

export async function POST(req: Request) {
  // Accept both cookie session (web wizard) and Bearer token (CLI future use)
  const bearerUser = await authenticateBearerToken(req);
  const cookieSession = bearerUser ? null : await getSession();
  if (!bearerUser && !cookieSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }
  const { slug, version, contentType, size: _size } = parsed.data;

  const key = bundleKey(slug, version);

  let uploadUrl: string;
  try {
    uploadUrl = await generatePresignedPutUrl(key, contentType);
  } catch (err) {
    console.error("[upload/sign] presign failed", err);
    // Pass the thrown message through in development so the wizard can
    // show e.g. "R2 is not configured — missing env vars: ...". Hide it
    // in production to avoid leaking config detail to end users.
    const detail =
      process.env.NODE_ENV !== "production" && err instanceof Error
        ? err.message
        : undefined;
    return Response.json(
      { error: "Could not generate upload URL", detail },
      { status: 503 },
    );
  }

  return Response.json({ uploadUrl, r2Key: key });
}
