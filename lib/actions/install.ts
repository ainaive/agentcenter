"use server";

import { getSession } from "@/lib/auth/session";
import { InstallError, recordInstall } from "@/lib/installs/record";

export type InstallResult =
  | {
      ok: true;
      installId: string;
      isFirstInstall: boolean;
      version: string;
    }
  | {
      ok: false;
      error:
        | "unauthenticated"
        | "not_found"
        | "no_published_version"
        | "server_error";
    };

export async function installExtension(
  extensionId: string,
): Promise<InstallResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  try {
    const result = await recordInstall({
      userId: session.user.id,
      extension: { id: extensionId },
      source: "web",
    });
    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof InstallError) {
      return {
        ok: false,
        error: e.code === "extension_not_found" ? "not_found" : e.code,
      };
    }
    return { ok: false, error: "server_error" };
  }
}
