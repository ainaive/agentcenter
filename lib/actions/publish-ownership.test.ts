// Security-critical regression tests: `getDraft` and `discardDraft` must
// treat a non-owner request identically to a missing row, so the public
// contracts can't be used to probe for someone else's extensions.
//
// We don't aim to fully cover the actions here — the DB-touching paths
// are best exercised end-to-end. These tests pin the ownership collapse
// because it's exactly the kind of thing a refactor can silently undo.

import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const deleteMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    select: (...a: unknown[]) => selectMock(...a),
    delete: (...a: unknown[]) => deleteMock(...a),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...a: unknown[]) => getSessionMock(...a),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

import { discardDraft, getDraft } from "@/lib/actions/publish";

// Build a select chain that resolves to a single row (or empty) at .limit().
function selectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ limit, orderBy });
  const leftJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ where, leftJoin });
  return { from, leftJoin, where, orderBy, limit };
}

function deleteChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  return { where };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("discardDraft", () => {
  it("returns unauthenticated when no session", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await discardDraft("ext-1");
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(selectMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("returns not_found for a missing extension", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(selectChain([]));
    const result = await discardDraft("ext-missing");
    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  // Regression: non-owner MUST collapse to `not_found`, not a distinct
  // error — otherwise the contract leaks existence.
  it("returns not_found (not 'not_owner') when a different user owns it", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(
      selectChain([{ publisherUserId: "user-B", visibility: "draft" }]),
    );
    const result = await discardDraft("ext-1");
    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("refuses to discard a published extension", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(
      selectChain([{ publisherUserId: "user-A", visibility: "published" }]),
    );
    const result = await discardDraft("ext-1");
    expect(result).toEqual({ ok: false, error: "not_discardable" });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes the extension when the caller is the owner of a draft", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(
      selectChain([{ publisherUserId: "user-A", visibility: "draft" }]),
    );
    deleteMock.mockReturnValue(deleteChain());

    const result = await discardDraft("ext-1");
    expect(result).toEqual({ ok: true });
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});

describe("getDraft", () => {
  it("returns unauthenticated when no session", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await getDraft("ext-1");
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("returns not_found for a missing extension or one without a version", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(selectChain([]));
    const empty = await getDraft("ext-missing");
    expect(empty).toEqual({ ok: false, error: "not_found" });

    // Extension exists but the leftJoin produced no version columns.
    selectMock.mockReturnValue(
      selectChain([
        {
          extensionId: "ext-1",
          publisherUserId: "user-A",
          slug: "x",
          name: "X",
          category: "skills",
          visibility: "draft",
          versionId: null,
          version: null,
          versionStatus: null,
          bundleFileId: null,
        },
      ]),
    );
    const noVersion = await getDraft("ext-1");
    expect(noVersion).toEqual({ ok: false, error: "not_found" });
  });

  // Regression: non-owner MUST collapse to `not_found`. The public
  // GetDraftResult union deliberately doesn't include `not_owner`.
  it("returns not_found (not 'not_owner') for another user's extension", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(
      selectChain([
        {
          extensionId: "ext-1",
          publisherUserId: "user-B",
          slug: "x",
          name: "X",
          category: "skills",
          visibility: "draft",
          versionId: "v-1",
          version: "1.0.0",
          versionStatus: "pending",
          bundleFileId: null,
        },
      ]),
    );
    const result = await getDraft("ext-1");
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("returns the DraftSnapshot for the owner", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(
      selectChain([
        {
          extensionId: "ext-1",
          publisherUserId: "user-A",
          slug: "my-skill",
          name: "My Skill",
          category: "skills",
          visibility: "draft",
          versionId: "v-1",
          version: "1.0.0",
          versionStatus: "pending",
          bundleFileId: "f-1", // bundle uploaded
        },
      ]),
    );
    const result = await getDraft("ext-1");
    expect(result).toEqual({
      ok: true,
      draft: {
        extensionId: "ext-1",
        versionId: "v-1",
        slug: "my-skill",
        version: "1.0.0",
        name: "My Skill",
        category: "skills",
        visibility: "draft",
        versionStatus: "pending",
        bundleUploaded: true,
      },
    });
  });

  it("reports bundleUploaded: false when bundleFileId is null", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(
      selectChain([
        {
          extensionId: "ext-1",
          publisherUserId: "user-A",
          slug: "my-skill",
          name: "My Skill",
          category: "skills",
          visibility: "draft",
          versionId: "v-1",
          version: "1.0.0",
          versionStatus: "pending",
          bundleFileId: null,
        },
      ]),
    );
    const result = await getDraft("ext-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.draft.bundleUploaded).toBe(false);
  });
});
