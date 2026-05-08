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
function makeTx() {
  const insertValues = vi.fn().mockReturnValue({
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  });
  const insertValuesPlain = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn().mockImplementation(() => ({
    // installs insert: just .values() resolves
    // collectionItems insert: .values().onConflictDoNothing() resolves
    // We return both shapes via a thenable-ish object.
    values: vi.fn().mockImplementation((row: unknown) => {
      // If row has `collectionId`, it's the collectionItems insert.
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
  return { insert, update, _insertValues: insertValues, _insertValuesPlain: insertValuesPlain };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: transaction runs the callback with a fresh fake tx.
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
    selectMock
      .mockReturnValueOnce(selectChain([{ id: "ext-1" }])) // ext lookup
      .mockReturnValueOnce(selectChain([])); // prior install lookup (none)

    getOrCreateSystemCollectionMock.mockResolvedValue("col-installed");

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
      .mockReturnValueOnce(selectChain([{ version: "2.0.0" }])) // latest
      .mockReturnValueOnce(selectChain([])); // prior installs

    getOrCreateSystemCollectionMock.mockResolvedValue("col-installed");

    const result = await recordInstall({
      userId: "u1",
      extension: { slug: "my-skill" },
      source: "cli",
    });

    expect(result.version).toBe("2.0.0");
    expect(result.isFirstInstall).toBe(true);
  });

  it("reports isFirstInstall=false when prior install exists", async () => {
    selectMock
      .mockReturnValueOnce(selectChain([{ id: "ext-1" }])) // ext
      .mockReturnValueOnce(selectChain([{ id: "prev-install" }])); // prior

    getOrCreateSystemCollectionMock.mockResolvedValue("col-installed");

    const result = await recordInstall({
      userId: "u1",
      extension: { id: "ext-1" },
      source: "cli",
      version: "1.0.0",
    });

    expect(result.isFirstInstall).toBe(false);
  });
});
