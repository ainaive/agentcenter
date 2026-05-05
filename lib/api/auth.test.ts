import { describe, it, expect, vi } from "vitest";

// Mock db before any imports that transitively load lib/db/client.
vi.mock("@/lib/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
    }),
  },
}));

import { authenticateBearerToken, jsonError } from "@/lib/api/auth";

describe("jsonError", () => {
  it("returns a Response with the correct status", async () => {
    const res = jsonError("Not found", 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Not found");
    expect(body.error).toBe("error");
  });

  it("uses the custom code when provided", async () => {
    const res = jsonError("Unauthorized", 401, "unauthorized");
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("defaults error code to 'error'", async () => {
    const res = jsonError("Bad request", 400);
    const body = await res.json();
    expect(body.error).toBe("error");
  });
});

describe("authenticateBearerToken — header validation (no DB)", () => {
  it("returns null when Authorization header is absent", async () => {
    const req = new Request("http://localhost/api");
    expect(await authenticateBearerToken(req)).toBeNull();
  });

  it("returns null for non-Bearer scheme", async () => {
    const req = new Request("http://localhost/api", {
      headers: { Authorization: "Basic abc123" },
    });
    expect(await authenticateBearerToken(req)).toBeNull();
  });

  it("returns null when token is empty after Bearer prefix", async () => {
    const req = new Request("http://localhost/api", {
      headers: { Authorization: "Bearer   " },
    });
    expect(await authenticateBearerToken(req)).toBeNull();
  });

  it("returns null when token is not found in DB (mock returns empty)", async () => {
    const req = new Request("http://localhost/api", {
      headers: { Authorization: "Bearer unknown-token" },
    });
    expect(await authenticateBearerToken(req)).toBeNull();
  });
});
