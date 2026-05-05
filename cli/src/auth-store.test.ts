import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  chmod: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

import { readFile, writeFile, chmod } from "fs/promises";
import { loadCredentials, saveCredentials, clearCredentials } from "./auth-store";

const CREDS = { token: "tok123", userId: "u1", email: "alice@example.com", name: "Alice" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(writeFile).mockResolvedValue(undefined);
  vi.mocked(chmod).mockResolvedValue(undefined);
});

describe("loadCredentials", () => {
  it("returns null when file does not exist", async () => {
    vi.mocked(readFile).mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    expect(await loadCredentials()).toBeNull();
  });

  it("returns parsed credentials when file exists", async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(CREDS) as any);
    expect(await loadCredentials()).toEqual(CREDS);
  });

  it("returns null for invalid JSON", async () => {
    vi.mocked(readFile).mockResolvedValue("not-valid-json" as any);
    expect(await loadCredentials()).toBeNull();
  });
});

describe("saveCredentials", () => {
  it("writes credentials as formatted JSON", async () => {
    await saveCredentials(CREDS);
    expect(vi.mocked(writeFile)).toHaveBeenCalledOnce();
    const writtenContent = vi.mocked(writeFile).mock.calls[0][1] as string;
    expect(JSON.parse(writtenContent)).toEqual(CREDS);
  });

  it("sets file permissions to 0o600", async () => {
    await saveCredentials(CREDS);
    expect(vi.mocked(chmod)).toHaveBeenCalledWith(expect.any(String), 0o600);
  });
});

describe("clearCredentials", () => {
  it("writes an empty string to the credentials file", async () => {
    await clearCredentials();
    expect(vi.mocked(writeFile)).toHaveBeenCalledWith(expect.any(String), "", "utf8");
  });

  it("does not throw when the file is missing", async () => {
    vi.mocked(writeFile).mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    await expect(clearCredentials()).resolves.not.toThrow();
  });
});
