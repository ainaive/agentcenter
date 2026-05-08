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

// Build a chain: db.update(table).set(values).where(predicate) → resolved.
// Returns spies for set/where so tests can assert what was written.
function updateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  return { call: { set }, set, where };
}

// Build a select chain ending in .limit(rows).
function selectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from };
}

// A fake tx with the same shape as db, recording each update's set/where calls.
function makeTx() {
  const updates: Array<{ set: ReturnType<typeof vi.fn>; where: ReturnType<typeof vi.fn> }> = [];
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
  it("flips version status to scanning", async () => {
    const chain = updateChain();
    updateMock.mockReturnValue(chain.call);

    await submit("v1");

    expect(chain.set).toHaveBeenCalledWith({ status: "scanning" });
    expect(chain.where).toHaveBeenCalled();
  });
});

describe("recordScanResult", () => {
  it("writes clean + ready for a successful scan", async () => {
    const { tx, updates } = makeTx();
    transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

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
    expect(updates[1].set).toHaveBeenCalledWith({ status: "ready" });
  });

  it("writes flagged + rejected for a failed scan", async () => {
    const { tx, updates } = makeTx();
    transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

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
});

describe("publishVersion", () => {
  it("updates extension + version, returns extensionId", async () => {
    selectMock.mockReturnValue(selectChain([{ extensionId: "ext-7" }]));
    const { tx, updates } = makeTx();
    transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    const result = await publishVersion("v1");

    expect(result).toEqual({ extensionId: "ext-7" });
    expect(updates).toHaveLength(2);
    // first update: extensions
    expect(updates[0].set).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: "published" }),
    );
    // second update: extension_versions
    expect(updates[1].set).toHaveBeenCalledWith(
      expect.objectContaining({ publishedAt: expect.any(Date) }),
    );
  });

  it("throws VersionStateError when the version is missing", async () => {
    selectMock.mockReturnValue(selectChain([]));

    const err = await publishVersion("missing").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VersionStateError);
    expect((err as VersionStateError).code).toBe("version_not_found");
  });
});
