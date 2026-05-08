import { describe, it, expect, vi, beforeEach } from "vitest";

const updateMock = vi.fn();
const selectMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    update: (...a: unknown[]) => updateMock(...a),
    select: (...a: unknown[]) => selectMock(...a),
    transaction: (cb: (tx: unknown) => Promise<unknown>) => transactionMock(cb),
  },
}));

import {
  submit,
  recordScanResult,
  publishVersion,
  VersionStateError,
} from "@/lib/extensions/state";

// Build a chain: update(table).set(values).where(predicate).returning(cols)
// Resolves to `returnedRows`.
function updateChain(returnedRows: unknown[] = []) {
  const returning = vi.fn().mockResolvedValue(returnedRows);
  const where = vi
    .fn()
    .mockReturnValue({ returning, then: undefined as unknown as never });
  // For chains that don't call .returning(), the awaited shape is the where().
  // We wire it so `await chain.where(...)` resolves to undefined — Drizzle's
  // shape — by also making `where` thenable-friendly. The simpler path: tests
  // for non-returning updates just don't await directly here; we resolve via
  // a custom helper below.
  const set = vi.fn().mockReturnValue({ where });
  return { set, where, returning };
}

// Build a select chain ending in .limit(rows).
function selectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from, where, limit };
}

// Fake tx exposing the same .update(...).set(...).where(...) shape.
function makeTx() {
  const updates: Array<{
    set: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
  }> = [];
  const update = vi.fn().mockImplementation(() => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    updates.push({ set, where });
    return { set };
  });
  return { tx: { update }, updates };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submit", () => {
  it("flips version status when current state is pending", async () => {
    const chain = updateChain([{ id: "v1" }]);
    updateMock.mockReturnValue({ set: chain.set });

    await submit("v1");

    expect(chain.set).toHaveBeenCalledWith({ status: "scanning" });
    // `where` must be called with a predicate (the and(eq, eq) clause).
    // We can't introspect the SQL builder directly, but we assert the call
    // happened with a non-undefined argument.
    expect(chain.where).toHaveBeenCalled();
    expect(chain.where.mock.calls[0][0]).toBeDefined();
    expect(chain.returning).toHaveBeenCalled();
  });

  it("throws VersionStateError when no rows match (wrong state or missing)", async () => {
    const chain = updateChain([]); // returning -> no rows
    updateMock.mockReturnValue({ set: chain.set });

    const err = await submit("v1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VersionStateError);
    expect((err as VersionStateError).code).toBe("version_not_found");
  });
});

describe("recordScanResult", () => {
  it("writes clean + ready when version is currently scanning", async () => {
    selectMock.mockReturnValue(selectChain([{ status: "scanning" }]));
    const { tx, updates } = makeTx();
    transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb(tx),
    );

    await recordScanResult("v1", "f1", {
      ok: true,
      checksum: "abc123",
      scanReport: { foo: "bar" },
    });

    expect(updates).toHaveLength(2);
    expect(updates[0].set).toHaveBeenCalledWith({
      scanStatus: "clean",
      scanReport: { foo: "bar" },
      checksumSha256: "abc123",
    });
    expect(updates[0].where).toHaveBeenCalled();
    expect(updates[1].set).toHaveBeenCalledWith({ status: "ready" });
    expect(updates[1].where).toHaveBeenCalled();
  });

  it("writes flagged + rejected when version is scanning and scan failed", async () => {
    selectMock.mockReturnValue(selectChain([{ status: "scanning" }]));
    const { tx, updates } = makeTx();
    transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb(tx),
    );

    await recordScanResult("v1", "f1", {
      ok: false,
      reason: "missing_manifest",
      scanReport: { reason: "missing_manifest" },
    });

    expect(updates).toHaveLength(2);
    expect(updates[0].set).toHaveBeenCalledWith({
      scanStatus: "flagged",
      scanReport: { reason: "missing_manifest" },
    });
    expect(updates[1].set).toHaveBeenCalledWith({ status: "rejected" });
  });

  it("throws when version is missing", async () => {
    selectMock.mockReturnValue(selectChain([]));
    const err = await recordScanResult("v1", "f1", {
      ok: true,
      checksum: "x",
      scanReport: {},
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VersionStateError);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("throws when version is already terminal (idempotent retry path)", async () => {
    selectMock.mockReturnValue(selectChain([{ status: "ready" }]));
    const err = await recordScanResult("v1", "f1", {
      ok: true,
      checksum: "x",
      scanReport: {},
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VersionStateError);
    expect(transactionMock).not.toHaveBeenCalled();
  });
});

describe("publishVersion", () => {
  it("updates extension + version when version is ready, returns extensionId", async () => {
    selectMock.mockReturnValue(
      selectChain([{ extensionId: "ext-7", status: "ready" }]),
    );
    const { tx, updates } = makeTx();
    transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb(tx),
    );

    const result = await publishVersion("v1");

    expect(result).toEqual({ extensionId: "ext-7" });
    expect(updates).toHaveLength(2);
    expect(updates[0].set).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: "published" }),
    );
    expect(updates[0].where).toHaveBeenCalled();
    expect(updates[1].set).toHaveBeenCalledWith(
      expect.objectContaining({ publishedAt: expect.any(Date) }),
    );
    expect(updates[1].where).toHaveBeenCalled();
  });

  it("throws VersionStateError when the version is missing", async () => {
    selectMock.mockReturnValue(selectChain([]));

    const err = await publishVersion("missing").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VersionStateError);
    expect((err as VersionStateError).code).toBe("version_not_found");
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("throws when version is not yet ready", async () => {
    selectMock.mockReturnValue(
      selectChain([{ extensionId: "ext-7", status: "scanning" }]),
    );

    const err = await publishVersion("v1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VersionStateError);
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
