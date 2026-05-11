// Auth + ownership pins for the collections server actions. Mirrors the
// style of lib/actions/publish-ownership.test.ts: keep tests narrow,
// regression-shaped, and focused on the "writes happen to the right
// user's data" invariant.

import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const insertMock = vi.fn();
const getOrCreateSystemCollectionMock = vi.fn();
const upsertCollectionItemMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getSession: (...a: unknown[]) => getSessionMock(...a),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    insert: (...a: unknown[]) => insertMock(...a),
  },
}));

vi.mock("@/lib/db/queries/collections", () => ({
  getOrCreateSystemCollection: (...a: unknown[]) =>
    getOrCreateSystemCollectionMock(...a),
  upsertCollectionItem: (...a: unknown[]) =>
    upsertCollectionItemMock(...a),
}));

import { createCollection, saveExtension } from "./collections";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveExtension", () => {
  it("returns unauthenticated when no session, and never touches the DB", async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await saveExtension("ext-1");

    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(getOrCreateSystemCollectionMock).not.toHaveBeenCalled();
    expect(upsertCollectionItemMock).not.toHaveBeenCalled();
  });

  // ── OWNERSHIP PIN ──
  // The write must land in the *caller's* saved collection, not some
  // other user's. A refactor that passes the wrong id (e.g. cached
  // module-level constant, hardcoded test user) shows up here.
  it("writes to the caller's saved system collection", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    getOrCreateSystemCollectionMock.mockResolvedValue("col-saved-A");

    const result = await saveExtension("ext-1");

    expect(result).toEqual({ ok: true, alreadySaved: false });
    expect(getOrCreateSystemCollectionMock).toHaveBeenCalledWith(
      "user-A",
      "saved",
    );
    expect(upsertCollectionItemMock).toHaveBeenCalledWith(
      "col-saved-A",
      "ext-1",
    );
  });
});

describe("createCollection", () => {
  it("returns unauthenticated when no session, and never inserts", async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await createCollection("My favorites");

    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts a row scoped to the caller (owner_user_id) with the trimmed name", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValue({ values: valuesMock });

    const result = await createCollection("  My favorites  ");

    expect(result.ok).toBe(true);
    expect(valuesMock).toHaveBeenCalledTimes(1);
    const payload = valuesMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.ownerUserId).toBe("user-A");
    expect(payload.name).toBe("My favorites");
  });
});
