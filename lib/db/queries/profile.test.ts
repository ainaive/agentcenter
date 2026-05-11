// Two classes of test here:
//
//   1. JS post-query behavior — the merge/sort/limit in
//      `getActivityForUser`, the weighted-stars math in `getProfileStats`,
//      and the per-extension dedup in `getDraftsForUser` /
//      `getPublishedForUser`.
//
//   2. SQL `where`-predicate shape — the where-arg passed to Drizzle is a
//      first-class SQL object with a `.getSQL()` method; we render it via
//      `PgDialect` (matching production's `snake_case` config) and assert
//      that the predicate references the right columns and values.
//      This is what would have caught PR #31's "missing visibility =
//      published" regression on the activity feed.

import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    select: (...a: unknown[]) => selectMock(...a),
  },
}));

import {
  getActivityForUser,
  getDraftsForUser,
  getInstalledForUser,
  getProfileStats,
  getPublishedForUser,
  getSavedForUser,
} from "./profile";

// Build a chain that covers all the query shapes used in profile.ts:
//   db.select().from().innerJoin?().leftJoin?().where().orderBy?().limit?()
// The leaf (whichever method ends the chain) resolves to `rows`.
function selectChain(rows: unknown[]) {
  // Every "shouldn't-be-terminal" method also has a `.then` so it can be
  // awaited directly (the stats query awaits .where() without limit/orderBy).
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
  const innerJoin = vi.fn();
  const leftJoin = vi.fn();
  const fromObj: Record<string, unknown> = {
    where,
    orderBy,
    limit,
    innerJoin,
    leftJoin,
    ...thenable(rows),
  };
  innerJoin.mockReturnValue(fromObj);
  leftJoin.mockReturnValue(fromObj);
  const from = vi.fn().mockReturnValue(fromObj);
  return { from, where, orderBy, limit, innerJoin, leftJoin };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getActivityForUser", () => {
  function setupSources(opts: {
    installs?: unknown[];
    pubs?: unknown[];
    ratings?: unknown[];
  }) {
    // Promise.all preserves source order: installs, pubs, ratings.
    selectMock
      .mockReturnValueOnce(selectChain(opts.installs ?? []))
      .mockReturnValueOnce(selectChain(opts.pubs ?? []))
      .mockReturnValueOnce(selectChain(opts.ratings ?? []));
  }

  it("merges all three sources into one timeline sorted by `at` desc", async () => {
    setupSources({
      installs: [
        {
          at: new Date("2025-12-10T00:00:00Z"),
          extensionId: "e1",
          slug: "a",
          name: "A",
          version: "1.0.0",
        },
      ],
      pubs: [
        {
          at: new Date("2025-12-08T00:00:00Z"),
          extensionId: "e2",
          slug: "b",
          name: "B",
          version: "2.1.0",
        },
      ],
      ratings: [
        {
          at: new Date("2025-12-12T00:00:00Z"),
          extensionId: "e3",
          slug: "c",
          name: "C",
          stars: 4,
        },
      ],
    });

    const result = await getActivityForUser("user-A");

    expect(result.map((e) => e.kind)).toEqual([
      "rated",
      "installed",
      "published",
    ]);
    expect(result.map((e) => e.at.toISOString())).toEqual([
      "2025-12-12T00:00:00.000Z",
      "2025-12-10T00:00:00.000Z",
      "2025-12-08T00:00:00.000Z",
    ]);
  });

  it("caps the merged timeline at 20 events (newest first)", async () => {
    // 25 installs + 5 ratings = 30 candidate events. Each source is
    // already capped to 20 by the query, but the merge must re-cap.
    const installs = Array.from({ length: 25 }, (_, i) => ({
      at: new Date(2025, 0, 1 + i), // ascending, so i=24 is newest
      extensionId: `e-${i}`,
      slug: `s-${i}`,
      name: `Ext ${i}`,
      version: "1.0.0",
    }));
    setupSources({ installs });

    const result = await getActivityForUser("user-A");

    expect(result).toHaveLength(20);
    // Newest install (i=24) lands first.
    expect((result[0] as { name: string }).name).toBe("Ext 24");
  });

  it("drops rows whose `at` is null (defensive — pubs.publishedAt is nullable)", async () => {
    setupSources({
      pubs: [
        {
          at: null,
          extensionId: "e-stale",
          slug: "stale",
          name: "Stale",
          version: "0.1.0",
        },
        {
          at: new Date("2025-12-08T00:00:00Z"),
          extensionId: "e-ok",
          slug: "ok",
          name: "OK",
          version: "1.0.0",
        },
      ],
    });

    const result = await getActivityForUser("user-A");

    expect(result).toHaveLength(1);
    expect((result[0] as { extensionId: string }).extensionId).toBe("e-ok");
  });

  it("tags each event with the correct kind", async () => {
    setupSources({
      installs: [
        {
          at: new Date(),
          extensionId: "e1",
          slug: "i",
          name: "I",
          version: "1.0.0",
        },
      ],
      pubs: [
        {
          at: new Date(),
          extensionId: "e2",
          slug: "p",
          name: "P",
          version: "1.0.0",
        },
      ],
      ratings: [
        {
          at: new Date(),
          extensionId: "e3",
          slug: "r",
          name: "R",
          stars: 5,
        },
      ],
    });

    const result = await getActivityForUser("user-A");
    const byKind = new Map(result.map((e) => [e.kind, e]));
    expect(byKind.get("installed")?.extensionId).toBe("e1");
    expect(byKind.get("published")?.extensionId).toBe("e2");
    expect(byKind.get("rated")?.extensionId).toBe("e3");
    expect((byKind.get("rated") as { stars: number }).stars).toBe(5);
  });
});

describe("getProfileStats", () => {
  function setupStats(opts: {
    installedCount?: number;
    pub?: {
      count: number;
      totalInstalls: number;
      weightedStars: string | null;
    };
  }) {
    selectMock
      .mockReturnValueOnce(
        selectChain([{ c: opts.installedCount ?? 0 }]),
      )
      .mockReturnValueOnce(
        selectChain([
          opts.pub ?? {
            count: 0,
            totalInstalls: 0,
            weightedStars: null,
          },
        ]),
      );
  }

  it("returns counts straight through and coerces weightedStars to number", async () => {
    setupStats({
      installedCount: 7,
      pub: { count: 3, totalInstalls: 1234, weightedStars: "4.567" },
    });
    const stats = await getProfileStats("user-A");
    expect(stats).toEqual({
      installedCount: 7,
      publishedCount: 3,
      totalInstallsOfMine: 1234,
      avgRatingOfMine: 4.567,
    });
  });

  it("preserves null avgRatingOfMine when there are no rated extensions", async () => {
    // Critical: null must NOT collapse to 0 — the UI shows "—" for "no
    // rated extensions yet" and "0.0" would falsely imply rated-at-zero.
    setupStats({
      pub: { count: 0, totalInstalls: 0, weightedStars: null },
    });
    const stats = await getProfileStats("user-A");
    expect(stats.avgRatingOfMine).toBeNull();
  });

  it("defaults all counts to zero when the aggregates return no rows", async () => {
    // Unrealistic in practice (count() always returns one row), but the
    // function's `?? 0` fallbacks shouldn't silently throw if Drizzle ever
    // surprises us.
    selectMock
      .mockReturnValueOnce(selectChain([])) // installs
      .mockReturnValueOnce(selectChain([])); // pubs
    const stats = await getProfileStats("user-A");
    expect(stats).toEqual({
      installedCount: 0,
      publishedCount: 0,
      totalInstallsOfMine: 0,
      avgRatingOfMine: null,
    });
  });
});

describe("getDraftsForUser", () => {
  it("collapses joined rows to one row per extension (first occurrence wins)", async () => {
    // The query LEFT JOINs extensionVersions, so an extension with 3
    // versions produces 3 rows. The function must dedup; the ORDER BY
    // means the row we keep is the one with the latest version.
    selectMock.mockReturnValueOnce(
      selectChain([
        {
          extensionId: "ext-A",
          slug: "a",
          name: "A",
          category: "skills",
          iconColor: null,
          updatedAt: new Date(),
          latestStatus: "rejected", // the kept row's status
        },
        {
          extensionId: "ext-A",
          slug: "a",
          name: "A",
          category: "skills",
          iconColor: null,
          updatedAt: new Date(),
          latestStatus: "ready",
        },
        {
          extensionId: "ext-B",
          slug: "b",
          name: "B",
          category: "mcp",
          iconColor: null,
          updatedAt: new Date(),
          latestStatus: "pending",
        },
      ]),
    );

    const result = await getDraftsForUser("user-A");

    expect(result.map((r) => r.extensionId)).toEqual(["ext-A", "ext-B"]);
    // First occurrence wins — the "rejected" row is the one we kept.
    expect(result[0]?.latestStatus).toBe("rejected");
  });
});

describe("getPublishedForUser", () => {
  it("collapses joined rows to one row per extension (first occurrence wins)", async () => {
    selectMock.mockReturnValueOnce(
      selectChain([
        {
          extensionId: "ext-A",
          slug: "a",
          name: "A",
          category: "skills",
          iconColor: null,
          latestVersion: "2.0.0",
          downloadsCount: 100,
          starsAvg: "4.5",
          ratingsCount: 10,
        },
        {
          extensionId: "ext-A",
          slug: "a",
          name: "A",
          category: "skills",
          iconColor: null,
          latestVersion: "1.0.0",
          downloadsCount: 100,
          starsAvg: "4.5",
          ratingsCount: 10,
        },
      ]),
    );

    const result = await getPublishedForUser("user-A");
    expect(result).toHaveLength(1);
    expect(result[0]?.latestVersion).toBe("2.0.0");
  });
});

// ─── SQL `where`-predicate shape ─────────────────────────────────────────
//
// Render the captured where-arg via the same dialect production uses
// (`snake_case`) so column names match exactly. We assert with `.toContain`
// rather than equality so trivial formatting changes (extra parens,
// whitespace) don't break the test — only semantic changes do.

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

describe("SQL where predicates", () => {
  it("getInstalledForUser filters by uninstalled_at IS NULL and the user id", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);
    await getInstalledForUser("user-A");

    const { sql, params } = renderWhere(chain.where);
    // The two load-bearing facts: scoped to the caller, and only
    // active installs. Without IS NULL, uninstalled rows would re-appear
    // once recordUninstall lands.
    expect(sql).toContain('"installs"."user_id" = $');
    expect(sql).toContain('"installs"."uninstalled_at" is null');
    expect(params).toContain("user-A");
  });

  it("getPublishedForUser filters by publisher + visibility = published", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);
    await getPublishedForUser("user-A");

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extensions"."publisher_user_id" = $');
    expect(sql).toContain('"extensions"."visibility" = $');
    expect(params).toEqual(expect.arrayContaining(["user-A", "published"]));
  });

  it("getDraftsForUser filters by publisher + visibility = draft", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);
    await getDraftsForUser("user-A");

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extensions"."publisher_user_id" = $');
    expect(sql).toContain('"extensions"."visibility" = $');
    expect(params).toEqual(expect.arrayContaining(["user-A", "draft"]));
  });

  it("getSavedForUser joins through the user's `saved` system collection", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);
    await getSavedForUser("user-A");

    // The saved query has no top-level `where` — the filters live inside
    // the first innerJoin's ON clause.
    const joinArg = chain.innerJoin.mock.calls[0]?.[1] as {
      getSQL(): unknown;
    };
    const { sql, params } = dialect.sqlToQuery(joinArg.getSQL() as never);
    expect(sql).toContain('"collections"."owner_user_id" = $');
    expect(sql).toContain('"collections"."system_kind" = $');
    expect(params).toEqual(expect.arrayContaining(["user-A", "saved"]));
  });

  describe("getActivityForUser", () => {
    function setupAllEmpty() {
      const installsChain = selectChain([]);
      const pubsChain = selectChain([]);
      const ratingsChain = selectChain([]);
      selectMock
        .mockReturnValueOnce(installsChain)
        .mockReturnValueOnce(pubsChain)
        .mockReturnValueOnce(ratingsChain);
      return { installsChain, pubsChain, ratingsChain };
    }

    it("scopes the installs sub-query to the caller", async () => {
      const { installsChain } = setupAllEmpty();
      await getActivityForUser("user-A");
      const { sql, params } = renderWhere(installsChain.where);
      expect(sql).toContain('"installs"."user_id" = $');
      expect(params).toContain("user-A");
    });

    // This is the PR #31 regression-pin. A `ready` version on a still-
    // draft extension must NOT surface as a "published" activity event.
    it("requires visibility = published on the published-events sub-query", async () => {
      const { pubsChain } = setupAllEmpty();
      await getActivityForUser("user-A");
      const { sql, params } = renderWhere(pubsChain.where);
      expect(sql).toContain('"extensions"."publisher_user_id" = $');
      expect(sql).toContain('"extensions"."visibility" = $');
      expect(sql).toContain('"extension_versions"."status" = $');
      expect(params).toEqual(
        expect.arrayContaining(["user-A", "published", "ready"]),
      );
    });

    it("scopes the ratings sub-query to the caller", async () => {
      const { ratingsChain } = setupAllEmpty();
      await getActivityForUser("user-A");
      const { sql, params } = renderWhere(ratingsChain.where);
      expect(sql).toContain('"ratings"."user_id" = $');
      expect(params).toContain("user-A");
    });
  });

  describe("getProfileStats", () => {
    function setupAggregates() {
      const installsChain = selectChain([{ c: 0 }]);
      const pubsChain = selectChain([
        { count: 0, totalInstalls: 0, weightedStars: null },
      ]);
      selectMock
        .mockReturnValueOnce(installsChain)
        .mockReturnValueOnce(pubsChain);
      return { installsChain, pubsChain };
    }

    it("scopes the installed-count to user + uninstalled_at IS NULL", async () => {
      const { installsChain } = setupAggregates();
      await getProfileStats("user-A");
      const { sql, params } = renderWhere(installsChain.where);
      expect(sql).toContain('"installs"."user_id" = $');
      expect(sql).toContain('"installs"."uninstalled_at" is null');
      expect(params).toContain("user-A");
    });

    it("scopes the published aggregates to publisher + visibility = published", async () => {
      const { pubsChain } = setupAggregates();
      await getProfileStats("user-A");
      const { sql, params } = renderWhere(pubsChain.where);
      expect(sql).toContain('"extensions"."publisher_user_id" = $');
      expect(sql).toContain('"extensions"."visibility" = $');
      expect(params).toEqual(expect.arrayContaining(["user-A", "published"]));
    });
  });
});
