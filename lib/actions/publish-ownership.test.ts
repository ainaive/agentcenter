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
const transactionMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    select: (...a: unknown[]) => selectMock(...a),
    delete: (...a: unknown[]) => deleteMock(...a),
    transaction: (cb: (tx: unknown) => Promise<unknown>) => transactionMock(cb),
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

import {
  discardDraft,
  getDraft,
  updateDraftExtension,
} from "@/lib/actions/publish";
import type { ManifestFormValues } from "@/lib/validators/manifest";

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

describe("updateDraftExtension", () => {
  // Minimal valid form payload for ManifestFormSchema. Reused so each
  // test only specifies the field it actually cares about.
  const validValues: ManifestFormValues = {
    slug: "my-skill",
    name: "My Skill",
    nameZh: "",
    version: "1.0.0",
    category: "skills",
    scope: "personal",
    funcCat: "workTask",
    subCat: "search",
    l2: "",
    deptId: "",
    tagIds: [],
    description: "hello",
    descriptionZh: "",
    tagline: "",
    homepageUrl: "",
    repoUrl: "",
    licenseSpdx: "",
  };

  it("returns unauthenticated when no session", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await updateDraftExtension("ext-1", validValues);
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(selectMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input with the stable invalid_input code", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    const bad = { ...validValues, slug: "BAD slug!" };
    const result = await updateDraftExtension("ext-1", bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_input");
      // Detail carries the human-readable Zod messages.
      expect(result.detail).toBeTruthy();
    }
    // Should bail before touching the DB.
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("returns not_found for a missing extension", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(selectChain([]));
    const result = await updateDraftExtension("ext-missing", validValues);
    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  // Regression: non-owner MUST collapse to `not_found` so the contract
  // can't be used to probe whether an extension exists for someone else.
  it("returns not_found (not 'not_owner') for another user's extension", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(
      selectChain([
        {
          publisherUserId: "user-B",
          versionId: "v-1",
          versionStatus: "pending",
        },
      ]),
    );
    const result = await updateDraftExtension("ext-1", validValues);
    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("refuses to edit once the version has left pending", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    for (const status of ["scanning", "ready", "rejected"] as const) {
      selectMock.mockReturnValue(
        selectChain([
          {
            publisherUserId: "user-A",
            versionId: "v-1",
            versionStatus: status,
          },
        ]),
      );
      const result = await updateDraftExtension("ext-1", validValues);
      expect(result).toEqual({ ok: false, error: "version_not_editable" });
    }
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("runs the update transaction when caller owns a pending draft", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(
      selectChain([
        {
          publisherUserId: "user-A",
          versionId: "v-1",
          versionStatus: "pending",
        },
      ]),
    );
    transactionMock.mockResolvedValue(undefined);

    const result = await updateDraftExtension("ext-1", validValues);
    expect(result).toEqual({ ok: true });
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  // Regression: the wizard renders slug + version as `readOnly` in
  // resume mode, but readOnly is client-side only. The action must NOT
  // write slug or version from the request payload — otherwise a
  // direct call (devtools, scripted POST) could rename the slug and
  // orphan the already-uploaded R2 bundle at its old <slug>/<version>
  // key.
  it("does not write slug or version even when the payload tries to change them", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    selectMock.mockReturnValue(
      selectChain([
        {
          publisherUserId: "user-A",
          versionId: "v-1",
          versionStatus: "pending",
        },
      ]),
    );

    // Capture the patches the transaction body issues against `tx.update`.
    const updatePatches: Array<Record<string, unknown>> = [];
    transactionMock.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          update: () => ({
            set: (patch: Record<string, unknown>) => {
              updatePatches.push(patch);
              return { where: () => Promise.resolve(undefined) };
            },
          }),
          delete: () => ({ where: () => Promise.resolve(undefined) }),
          insert: () => ({ values: () => Promise.resolve(undefined) }),
        };
        return cb(tx);
      },
    );

    const attempted = {
      ...validValues,
      slug: "hijacked-slug",
      version: "9.9.9",
    };
    const result = await updateDraftExtension("ext-1", attempted);
    expect(result).toEqual({ ok: true });

    // The wizard's update should produce exactly one extensions patch
    // and zero version-row patches — slug + version aren't written.
    expect(updatePatches).toHaveLength(1);
    const patch = updatePatches[0];
    expect(patch).not.toHaveProperty("slug");
    expect(patch).not.toHaveProperty("version");
    // Sanity: the editable fields are still going through.
    expect(patch.name).toBe("My Skill");
  });
});
