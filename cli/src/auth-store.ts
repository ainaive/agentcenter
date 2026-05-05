import { existsSync, mkdirSync } from "fs";
import { chmod, readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".config", "agentcenter");
const CREDS_FILE = join(CONFIG_DIR, "credentials.json");

export interface Credentials {
  token: string;
  userId: string;
  email: string;
  name: string | null;
}

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const raw = await readFile(CREDS_FILE, "utf8");
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

export async function saveCredentials(creds: Credentials): Promise<void> {
  ensureConfigDir();
  await writeFile(CREDS_FILE, JSON.stringify(creds, null, 2), "utf8");
  await chmod(CREDS_FILE, 0o600);
}

export async function clearCredentials(): Promise<void> {
  try {
    await writeFile(CREDS_FILE, "", "utf8");
  } catch {
    // ignore if file doesn't exist
  }
}
