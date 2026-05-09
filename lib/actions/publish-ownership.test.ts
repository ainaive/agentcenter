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

// Build a select chain whose `.where()` is BOTH thenable (for the simple
// `select(...).from(t).where(...)` shape) AND continues into `.orderBy`/
// `.limit` (for the joined-row shape). This lets the same mock cover
// both query patterns getDraft uses.
function selectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const whereResult: {
    limit: typeof limit;
    orderBy: typeof orderBy;
    then: Promise<unknown[]>["then"];
  } = {
    limit,
    orderBy,
    then: ((onFulfilled, onRejected) =>
      Promise.resolve(rows).then(
        onFulfilled,
        onRejected,
      )) as Promise<unknown[]>["then"],
  };
  const where = vi.fn().mockReturnValue(whereResult);
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

  // Full manifest row matching the new `getDraft` SELECT — includes the
  // form-prefill fields on top of the dashboard fields.
  function fullManifestRow(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      extensionId: "ext-1",
      publisherUserId: "user-A",
      slug: "my-skill",
      name: "My Skill",
      nameZh: null,
      tagline: null,
      description: "hello",
      descriptionZh: null,
      category: "skills",
      scope: "personal",
      funcCat: "workTask",
      subCat: "search",
      l2: null,
      deptId: null,
      homepageUrl: null,
      repoUrl: null,
      licenseSpdx: null,
      visibility: "draft",
      versionId: "v-1",
      version: "1.0.0",
      versionStatus: "pending",
      bundleFileId: "f-1",
      ...overrides,
    };
  }

  it("returns the DraftSnapshot for the owner with form values pre-filled", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    // First call: the joined manifest row. Second call: tag IDs.
    selectMock
      .mockReturnValueOnce(selectChain([fullManifestRow()]))
      .mockReturnValueOnce(selectChain([{ tagId: "t-1" }, { tagId: "t-2" }]));

    const result = await getDraft("ext-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.extensionId).toBe("ext-1");
    expect(result.draft.bundleUploaded).toBe(true);
    expect(result.draft.formValues.slug).toBe("my-skill");
    expect(result.draft.formValues.name).toBe("My Skill");
    expect(result.draft.formValues.description).toBe("hello");
    expect(result.draft.formValues.tagIds).toEqual(["t-1", "t-2"]);
    // Nullable DB columns surface as empty strings in the form (so the
    // controlled <input>s don't go uncontrolled).
    expect(result.draft.formValues.nameZh).toBe("");
    expect(result.draft.formValues.deptId).toBe("");
  });

  it("reports bundleUploaded: false when bundleFileId is null", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock
      .mockReturnValueOnce(
        selectChain([fullManifestRow({ bundleFileId: null })]),
      )
      .mockReturnValueOnce(selectChain([])); // no tags
    const result = await getDraft("ext-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.draft.bundleUploaded).toBe(false);
  });
});
