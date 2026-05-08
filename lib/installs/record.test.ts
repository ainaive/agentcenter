import { describe, it, expect, vi, beforeEach } from "vitest";

const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
    insert: (...args: unknown[]) => insertMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    transaction: (cb: (tx: unknown) => Promise<unknown>) => transactionMock(cb),
  },
}));

const getOrCreateSystemCollectionMock = vi.fn();
vi.mock("@/lib/db/queries/collections", () => ({
  getOrCreateSystemCollection: (...args: unknown[]) =>
    getOrCreateSystemCollectionMock(...args),
}));

import { recordInstall, InstallError } from "@/lib/installs/record";

// Builds a chain that ends in a .limit() resolving to `rows`.
// Covers both `select().from().where().limit()` and
// `select().from().where().orderBy().limit()` shapes.
function selectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ limit, orderBy });
  const from = vi.fn().mockReturnValue({ where });
  return { from };
}

// Mocks the writes performed inside the transaction callback.
// Returns a fake tx object that records what was written.
function makeTx(opts: { priorInstalls?: unknown[] } = {}) {
  const priorInstalls = opts.priorInstalls ?? [];
  const insert = vi.fn().mockImplementation(() => ({
    values: vi.fn().mockImplementation((row: unknown) => {
      if (row && typeof row === "object" && "collectionId" in row) {
        return { onConflictDoNothing: vi.fn().mockResolvedValue(undefined) };
      }
      return Promise.resolve(undefined);
    }),
  }));
  const update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
  // Prior-install check is now inside the tx.
  const select = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(priorInstalls),
      }),
    }),
  });
  return { insert, update, select };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: transaction runs the callback with a tx that reports no prior installs.
  transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
    return cb(makeTx());
  });
  // Default: top-level insert/update resolve to nothing (not used in happy path).
  insertMock.mockReturnValue({
    values: vi.fn().mockResolvedValue(undefined),
  });
  updateMock.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
});

describe("recordInstall", () => {
  it("throws extension_not_found when lookup by id misses", async () => {
    selectMock.mockReturnValueOnce(selectChain([])); // ext lookup empty

    const err = await recordInstall({
      userId: "u1",
      extension: { id: "missing" },
      source: "web",
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(InstallError);
    expect((err as InstallError).code).toBe("extension_not_found");
  });

  it("throws extension_not_found when lookup by slug misses", async () => {
    selectMock.mockReturnValueOnce(selectChain([]));
    await expect(
      recordInstall({
        userId: "u1",
        extension: { slug: "missing" },
        source: "cli",
      }),
    ).rejects.toMatchObject({ code: "extension_not_found" });
  });

  it("throws no_published_version when version omitted and no ready version exists", async () => {
    selectMock
      .mockReturnValueOnce(selectChain([{ id: "ext-1" }])) // ext lookup
      .mockReturnValueOnce(selectChain([])); // version lookup empty

    await expect(
      recordInstall({
        userId: "u1",
        extension: { id: "ext-1" },
        source: "web",
      }),
    ).rejects.toMatchObject({ code: "no_published_version" });
  });

  it("returns success shape on first install with explicit version", async () => {
    selectMock.mockReturnValueOnce(selectChain([{ id: "ext-1" }])); // ext lookup
    getOrCreateSystemCollectionMock.mockResolvedValue("col-installed");
    transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb(makeTx({ priorInstalls: [] })),
    );

    const result = await recordInstall({
      userId: "u1",
      extension: { id: "ext-1" },
      source: "web",
      version: "1.2.3",
    });

    expect(result).toMatchObject({
      isFirstInstall: true,
      version: "1.2.3",
    });
    expect(result.installId).toBeTypeOf("string");
    expect(result.installId.length).toBeGreaterThan(0);
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it("resolves version from latest published when version omitted", async () => {
    selectMock
      .mockReturnValueOnce(selectChain([{ id: "ext-1" }])) // ext
      .mockReturnValueOnce(selectChain([{ version: "2.0.0" }])); // latest
    getOrCreateSystemCollectionMock.mockResolvedValue("col-installed");
    transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb(makeTx({ priorInstalls: [] })),
    );

    const result = await recordInstall({
      userId: "u1",
      extension: { slug: "my-skill" },
      source: "cli",
    });

    expect(result.version).toBe("2.0.0");
    expect(result.isFirstInstall).toBe(true);
  });

  it("reports isFirstInstall=false when prior install exists", async () => {
    selectMock.mockReturnValueOnce(selectChain([{ id: "ext-1" }])); // ext
    getOrCreateSystemCollectionMock.mockResolvedValue("col-installed");
    transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb(makeTx({ priorInstalls: [{ id: "prev-install" }] })),
    );

    const result = await recordInstall({
      userId: "u1",
      extension: { id: "ext-1" },
      source: "cli",
      version: "1.0.0",
    });

    expect(result.isFirstInstall).toBe(false);
  });
});
