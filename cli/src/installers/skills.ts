import { existsSync, mkdirSync, rmSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { unzipSync } from "fflate";

const SKILLS_DIR = join(homedir(), ".claude", "skills");

export async function installSkill(slug: string, zipBuffer: ArrayBuffer): Promise<string> {
  const destDir = join(SKILLS_DIR, slug);
  if (!existsSync(SKILLS_DIR)) mkdirSync(SKILLS_DIR, { recursive: true });
  if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true });
  mkdirSync(destDir, { recursive: true });

  const files = unzipSync(new Uint8Array(zipBuffer));
  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith("/")) continue; // skip directory entries
    const dest = join(destDir, path);
    const parentDir = dest.substring(0, dest.lastIndexOf("/"));
    if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
    await writeFile(dest, content);
  }

  return destDir;
}

export async function uninstallSkill(slug: string): Promise<boolean> {
  const destDir = join(SKILLS_DIR, slug);
  if (!existsSync(destDir)) return false;
  rmSync(destDir, { recursive: true, force: true });
  return true;
}

export function listInstalledSlugs(): string[] {
  if (!existsSync(SKILLS_DIR)) return [];
  const { readdirSync, statSync } = require("fs") as typeof import("fs");
  return readdirSync(SKILLS_DIR).filter((name: string) =>
    statSync(join(SKILLS_DIR, name)).isDirectory()
  );
}
