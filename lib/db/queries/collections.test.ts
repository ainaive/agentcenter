// Ownership-shape tests for lib/db/queries/collections.ts.
//
// The load-bearing fact across this file is `owner_user_id = $caller` —
// the predicate that keeps user A from reading or writing user B's
// "Saved" or "Installed" system collection. If anyone ever "tidies" the
// predicate (drops the and(...), forgets the owner clause), these tests
// surface the regression as a SQL leak.

import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const insertMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    select: (...a: unknown[]) => selectMock(...a),
    insert: (...a: unknown[]) => insertMock(...a),
  },
}));

import {
  getOrCreateSystemCollection,
  getUserCollections,
  isInCollection,
} from "./collections";

function selectChain(rows: unknown[]) {
  const thenable = (value: unknown[]) => ({
    then: (
      onFulfilled?: (v: unknown[]) => unknown,
      onRejected?: (err: unknown) => unknown,
    ) => Promise.resolve(value).then(onFulfilled, onRejected),
  });
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ ...thenable(rows), limit });
  const where = vi
    .fn()
    .mockReturnValue({ ...thenable(rows), orderBy, limit });
  const from = vi.fn().mockReturnValue({
    where,
    orderBy,
    limit,
    ...thenable(rows),
  });
  return { from, where, orderBy, limit };
}

function insertChain() {
  const values = vi.fn().mockResolvedValue(undefined);
  return { values };
}

const dialect = new PgDialect({ casing: "snake_case" });

function renderWhere(
  whereMock: ReturnType<typeof vi.fn>,
  callIndex = 0,
): { sql: string; params: unknown[] } {
  const arg = whereMock.mock.calls[callIndex]?.[0] as {
    getSQL(): unknown;
  };
  return dialect.sqlToQuery(arg.getSQL() as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getOrCreateSystemCollection", () => {
  // ── OWNERSHIP PIN ──
  // Without `owner_user_id = $caller` in the SELECT predicate, the first
  // user to call `getOrCreateSystemCollection("saved")` for the system
  // would return whoever's row was first in collections — and subsequent
  // inserts could collide or write to the wrong user.
  it("scopes the lookup to the caller AND the requested kind", async () => {
    const chain = selectChain([]); // empty → forces an INSERT path
    selectMock.mockReturnValueOnce(chain);
    const insertValues = insertChain();
    insertMock.mockReturnValueOnce(insertValues);

    await getOrCreateSystemCollection("user-A", "saved");

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"collections"."owner_user_id" = $');
    expect(sql).toContain('"collections"."system_kind" = $');
    expect(params).toEqual(expect.arrayContaining(["user-A", "saved"]));
  });

  it("returns the existing row id without inserting when one is found", async () => {
    selectMock.mockReturnValueOnce(selectChain([{ id: "col-existing" }]));

    const id = await getOrCreateSystemCollection("user-A", "saved");

    expect(id).toBe("col-existing");
    // Critical: must NOT double-insert. The unique constraint on
    // (owner_user_id, system_kind) would catch it but we'd rather not
    // round-trip an error.
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts a new collection scoped to the caller when none exists", async () => {
    selectMock.mockReturnValueOnce(selectChain([]));
    const insertValues = insertChain();
    insertMock.mockReturnValueOnce(insertValues);

    await getOrCreateSystemCollection("user-A", "installed");

    expect(insertMock).toHaveBeenCalledTimes(1);
    const payload = insertValues.values.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(payload.ownerUserId).toBe("user-A");
    expect(payload.systemKind).toBe("installed");
  });
});

describe("isInCollection", () => {
  it("scopes the membership check to (collection_id, extension_id)", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);

    await isInCollection("col-1", "ext-1");

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"collection_items"."collection_id" = $');
    expect(sql).toContain('"collection_items"."extension_id" = $');
    expect(params).toEqual(expect.arrayContaining(["col-1", "ext-1"]));
  });

  it("returns true when the row exists, false otherwise", async () => {
    selectMock.mockReturnValueOnce(selectChain([{ collectionId: "col-1" }]));
    expect(await isInCollection("col-1", "ext-1")).toBe(true);

    selectMock.mockReturnValueOnce(selectChain([]));
    expect(await isInCollection("col-1", "ext-1")).toBe(false);
  });
});

describe("getUserCollections", () => {
  it("scopes the listing to the caller's owner_user_id", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);

    await getUserCollections("user-A");

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"collections"."owner_user_id" = $');
    expect(params).toContain("user-A");
  });
});
