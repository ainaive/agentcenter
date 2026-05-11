// SQL where-predicate coverage for lib/db/queries/extensions.ts.
//
// The high-value pin in this file is `getExtensionBySlug filters by
// visibility = published` — pre-fix, the detail page would render draft
// extensions to any visitor with the slug. Sanity-checked by reverting
// the fix locally; the regression test fails as expected.

import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    select: (...a: unknown[]) => selectMock(...a),
  },
}));

import {
  countFilteredExtensions,
  countPublishedExtensions,
  getExtensionBySlug,
  getFeaturedExtension,
  getLatestExtensionVersion,
  getRelatedExtensions,
  listExtensionVersions,
  listExtensions,
} from "./extensions";

// Covers every chain shape used in extensions.ts: from / leftJoin / where /
// groupBy / orderBy / limit / offset. The leaf is thenable so any chain
// that ends partway through (e.g. count queries that await .where()) works.
function selectChain(rows: unknown[]) {
  const thenable = (value: unknown[]) => ({
    then: (
      onFulfilled?: (v: unknown[]) => unknown,
      onRejected?: (err: unknown) => unknown,
    ) => Promise.resolve(value).then(onFulfilled, onRejected),
  });
  const offset = vi.fn().mockResolvedValue(rows);
  const limit = vi.fn().mockReturnValue({ ...thenable(rows), offset });
  const orderBy = vi.fn().mockReturnValue({ ...thenable(rows), limit });
  // groupBy can lead to orderBy → limit OR directly to limit
  // (getExtensionBySlug uses the latter shape).
  const groupBy = vi
    .fn()
    .mockReturnValue({ ...thenable(rows), orderBy, limit });
  const where = vi
    .fn()
    .mockReturnValue({ ...thenable(rows), groupBy, orderBy, limit });
  const leftJoin = vi.fn();
  const fromObj: Record<string, unknown> = {
    where,
    groupBy,
    orderBy,
    limit,
    offset,
    leftJoin,
    ...thenable(rows),
  };
  leftJoin.mockReturnValue(fromObj);
  const from = vi.fn().mockReturnValue(fromObj);
  return { from, where, groupBy, orderBy, limit, offset, leftJoin };
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

const EMPTY_FILTERS = {
  sort: "downloads" as const,
  page: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listExtensions", () => {
  it("always limits to visibility = published (security invariant)", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);

    await listExtensions(EMPTY_FILTERS);

    const { sql, params } = renderWhere(chain.where);
    // The visibility predicate is built by buildExtensionWhere — we don't
    // care how, just that it's present. Without it, drafts would leak
    // onto the public browse page.
    expect(sql).toContain('"extensions"."visibility" = $');
    expect(params).toContain("published");
  });

  it("applies category filter when provided", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);

    await listExtensions({ ...EMPTY_FILTERS, category: "skills" });

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extensions"."category" = $');
    expect(params).toEqual(expect.arrayContaining(["skills", "published"]));
  });
});

describe("countFilteredExtensions", () => {
  it("uses the same visibility-published predicate as listExtensions", async () => {
    const chain = selectChain([{ count: 0 }]);
    selectMock.mockReturnValueOnce(chain);

    await countFilteredExtensions(EMPTY_FILTERS);

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extensions"."visibility" = $');
    expect(params).toContain("published");
  });
});

describe("getExtensionBySlug", () => {
  // ── REGRESSION PIN ──
  // Pre-fix, this query filtered only by slug — so /extensions/<draft-slug>
  // rendered the full detail page for a draft extension to any visitor
  // with the slug. The visibility = published guard is the fix; this test
  // pins it.
  it("filters by visibility = published, not just slug", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);

    await getExtensionBySlug("some-slug");

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extensions"."slug" = $');
    expect(sql).toContain('"extensions"."visibility" = $');
    expect(params).toEqual(
      expect.arrayContaining(["some-slug", "published"]),
    );
  });
});

describe("getFeaturedExtension", () => {
  it("filters by badge = official", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);

    await getFeaturedExtension();

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extensions"."badge" = $');
    expect(params).toContain("official");
  });
});

describe("getLatestExtensionVersion", () => {
  it("filters by extension_id + status = ready", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);

    await getLatestExtensionVersion("ext-1");

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extension_versions"."extension_id" = $');
    expect(sql).toContain('"extension_versions"."status" = $');
    expect(params).toEqual(expect.arrayContaining(["ext-1", "ready"]));
  });
});

describe("listExtensionVersions", () => {
  it("filters by extension_id + status = ready", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);

    await listExtensionVersions("ext-1");

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extension_versions"."extension_id" = $');
    expect(sql).toContain('"extension_versions"."status" = $');
    expect(params).toEqual(expect.arrayContaining(["ext-1", "ready"]));
  });
});

describe("getRelatedExtensions", () => {
  it("filters by category + visibility = published + excludes the current extension", async () => {
    const chain = selectChain([]);
    selectMock.mockReturnValueOnce(chain);

    await getRelatedExtensions("ext-self", "skills");

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extensions"."category" = $');
    expect(sql).toContain('"extensions"."visibility" = $');
    // `ne(extensions.id, extensionId)` — Drizzle renders this as `<>`.
    expect(sql).toContain('"extensions"."id" <> $');
    expect(params).toEqual(
      expect.arrayContaining(["skills", "published", "ext-self"]),
    );
  });
});

describe("countPublishedExtensions", () => {
  it("filters by visibility = published", async () => {
    const chain = selectChain([{ count: 0 }]);
    selectMock.mockReturnValueOnce(chain);

    await countPublishedExtensions();

    const { sql, params } = renderWhere(chain.where);
    expect(sql).toContain('"extensions"."visibility" = $');
    expect(params).toContain("published");
  });
});
