import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { parse, stringify } from "smol-toml";

const CONFIG_DIR = join(homedir(), ".config", "agentcenter");
const CONFIG_FILE = join(CONFIG_DIR, "config.toml");

export interface Config {
  registry: string;
  agent: string;
  [key: string]: unknown;
}

const DEFAULTS: Config = {
  registry: "https://agentcenter.app",
  agent: "claude",
};

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

export async function loadConfig(): Promise<Config> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf8");
    return { ...DEFAULTS, ...(parse(raw) as Partial<Config>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveConfig(config: Config): Promise<void> {
  ensureConfigDir();
  await writeFile(CONFIG_FILE, stringify(config as Record<string, unknown>), "utf8");
}

export async function getConfigValue(key: string): Promise<unknown> {
  const config = await loadConfig();
  return config[key];
}

export async function setConfigValue(key: string, value: string): Promise<void> {
  const config = await loadConfig();
  config[key] = value;
  await saveConfig(config);
}
