import { loadConfig } from "./config-store";
import { loadCredentials } from "./auth-store";

export interface ExtensionSummary {
  slug: string;
  name: string;
  nameZh?: string;
  category: string;
  scope: string;
  description?: string;
  tags: string[];
  downloadsCount: number;
  starsAvg: string;
}

export interface ExtensionDetail extends ExtensionSummary {
  tagline?: string;
  license?: string;
  homepageUrl?: string;
  repoUrl?: string;
  compatibilityJson?: unknown;
  version: string;
  bundleUrl: string;
  publishedAt?: string;
}

export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
}

export interface PollResponse {
  status: "pending" | "authorized" | "expired";
  token?: string;
}

async function getHeaders(auth = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (auth) {
    const creds = await loadCredentials();
    if (creds) headers["Authorization"] = `Bearer ${creds.token}`;
  }
  return headers;
}

async function getRegistryUrl(): Promise<string> {
  const config = await loadConfig();
  return String(config.registry).replace(/\/$/, "");
}

export async function fetchExtension(slug: string): Promise<ExtensionDetail> {
  const base = await getRegistryUrl();
  const res = await fetch(`${base}/api/v1/extensions/${slug}`, {
    headers: await getHeaders(),
  });
  if (res.status === 404) throw new Error(`Extension "${slug}" not found.`);
  if (!res.ok) throw new Error(`Registry error: ${res.status}`);
  return res.json() as Promise<ExtensionDetail>;
}

export async function fetchExtensionList(params: Record<string, string> = {}): Promise<{
  items: ExtensionSummary[];
  total: number;
}> {
  const base = await getRegistryUrl();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${base}/api/v1/extensions${qs ? `?${qs}` : ""}`, {
    headers: await getHeaders(),
  });
  if (!res.ok) throw new Error(`Registry error: ${res.status}`);
  return res.json() as Promise<{ items: ExtensionSummary[]; total: number }>;
}

export async function getBundleUrl(slug: string): Promise<string> {
  const base = await getRegistryUrl();
  const res = await fetch(`${base}/api/v1/extensions/${slug}/bundle`, {
    redirect: "manual",
    headers: await getHeaders(true),
  });
  if (res.status === 302 || res.status === 301) {
    return res.headers.get("Location") ?? "";
  }
  if (res.status === 503) {
    const body = await res.json() as { message?: string };
    throw new Error(body.message ?? "Bundle not available yet.");
  }
  throw new Error(`Bundle fetch failed: ${res.status}`);
}

export async function postInstallEvent(
  extensionSlug: string,
  version: string,
): Promise<void> {
  const base = await getRegistryUrl();
  const headers = await getHeaders(true);
  if (!headers["Authorization"]) return; // skip if not signed in

  await fetch(`${base}/api/v1/installs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ extensionSlug, version, agentName: "cli" }),
  });
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const base = await getRegistryUrl();
  const res = await fetch(`${base}/api/v1/auth/device/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to start login: ${res.status}`);
  return res.json() as Promise<DeviceCodeResponse>;
}

export async function pollDeviceCode(deviceCode: string): Promise<PollResponse> {
  const base = await getRegistryUrl();
  const res = await fetch(`${base}/api/v1/auth/device/poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceCode }),
  });
  if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
  return res.json() as Promise<PollResponse>;
}

export async function fetchMe(token: string): Promise<{ email: string; name: string | null; id: string }> {
  const base = await getRegistryUrl();
  const res = await fetch(`${base}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch user profile.");
  return res.json() as Promise<{ email: string; name: string | null; id: string }>;
}
