import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

import { readFile, writeFile } from "fs/promises";
import { loadConfig, saveConfig, getConfigValue, setConfigValue } from "./config-store";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(writeFile).mockResolvedValue(undefined);
});

describe("loadConfig", () => {
  it("returns defaults when config file does not exist", async () => {
    vi.mocked(readFile).mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    const config = await loadConfig();
    expect(config.registry).toBe("https://agentcenter.app");
    expect(config.agent).toBe("claude");
  });

  it("merges file values over defaults", async () => {
    vi.mocked(readFile).mockResolvedValue('registry = "https://custom.app"\nagent = "openai"\n' as any);
    const config = await loadConfig();
    expect(config.registry).toBe("https://custom.app");
    expect(config.agent).toBe("openai");
  });

  it("keeps defaults for keys absent from the file", async () => {
    vi.mocked(readFile).mockResolvedValue('registry = "https://custom.app"\n' as any);
    const config = await loadConfig();
    expect(config.agent).toBe("claude");
  });
});

describe("getConfigValue", () => {
  it("returns the value for a known key", async () => {
    vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));
    expect(await getConfigValue("agent")).toBe("claude");
  });

  it("returns undefined for an unknown key", async () => {
    vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));
    expect(await getConfigValue("nonexistent")).toBeUndefined();
  });
});

describe("saveConfig", () => {
  it("writes TOML to the config file", async () => {
    await saveConfig({ registry: "https://agentcenter.app", agent: "claude" });
    expect(vi.mocked(writeFile)).toHaveBeenCalledOnce();
    const written = vi.mocked(writeFile).mock.calls[0][1] as string;
    expect(written).toContain("agent");
    expect(written).toContain("claude");
  });
});

describe("setConfigValue", () => {
  it("persists a new key-value pair", async () => {
    vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));
    await setConfigValue("installDir", "/custom/path");
    expect(vi.mocked(writeFile)).toHaveBeenCalledOnce();
    const written = vi.mocked(writeFile).mock.calls[0][1] as string;
    expect(written).toContain("installDir");
    expect(written).toContain("/custom/path");
  });
});
