import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    update: (...a: unknown[]) => updateMock(...a),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: (...a: unknown[]) => getSessionMock(...a),
}));

import { updateProfile } from "./user";

// Build a chained update().set().where() mock that captures the SET patch.
function updateChain(captured: Array<Record<string, unknown>>) {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
    captured.push(patch);
    return { where };
  });
  return { set, where };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateProfile", () => {
  const validValues = {
    name: "Jordan Park",
    defaultDeptId: "eng.cloud.infra",
    bio: "Building internal platform tools.",
  };

  it("returns unauthenticated when no session", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await updateProfile(validValues);
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input with the stable invalid_input code", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    // Empty name violates ProfileFormSchema (min 1).
    const result = await updateProfile({ ...validValues, name: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_input");
      expect(result.detail).toBeTruthy();
    }
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects bio over the max length", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    const tooLong = "x".repeat(281);
    const result = await updateProfile({ ...validValues, bio: tooLong });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_input");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("writes name, defaultDeptId, and bio to the current user row", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    const patches: Array<Record<string, unknown>> = [];
    updateMock.mockReturnValue(updateChain(patches));

    const result = await updateProfile(validValues);
    expect(result).toEqual({ ok: true });

    expect(patches).toHaveLength(1);
    expect(patches[0]).toMatchObject({
      name: "Jordan Park",
      defaultDeptId: "eng.cloud.infra",
      bio: "Building internal platform tools.",
    });
  });

  it("coerces an empty defaultDeptId to null (so the FK clears cleanly)", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    const patches: Array<Record<string, unknown>> = [];
    updateMock.mockReturnValue(updateChain(patches));

    const result = await updateProfile({ ...validValues, defaultDeptId: "" });
    expect(result).toEqual({ ok: true });
    expect(patches[0]?.defaultDeptId).toBeNull();
  });

  it("coerces an empty bio to null", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-A" } });
    const patches: Array<Record<string, unknown>> = [];
    updateMock.mockReturnValue(updateChain(patches));

    await updateProfile({ ...validValues, bio: "" });
    expect(patches[0]?.bio).toBeNull();
  });
});
