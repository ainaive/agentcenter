import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { installs } from "@/lib/db/schema/activity";
import { collectionItems } from "@/lib/db/schema/collection";
import { extensions, extensionVersions } from "@/lib/db/schema/extension";
import { getOrCreateSystemCollection } from "@/lib/db/queries/collections";

export type ExtensionRef = { id: string } | { slug: string };
export type InstallSource = "web" | "cli";

export type InstallErrorCode = "extension_not_found" | "no_published_version";

export class InstallError extends Error {
  readonly code: InstallErrorCode;
  constructor(code: InstallErrorCode) {
    super(code);
    this.code = code;
    this.name = "InstallError";
  }
}

export interface RecordInstallParams {
  userId: string;
  extension: ExtensionRef;
  source: InstallSource;
  version?: string;
}

export interface InstallRecord {
  installId: string;
  isFirstInstall: boolean;
  version: string;
}

export async function recordInstall(
  params: RecordInstallParams,
): Promise<InstallRecord> {
  const { userId, extension, source } = params;

  const extWhere =
    "id" in extension
      ? eq(extensions.id, extension.id)
      : eq(extensions.slug, extension.slug);

  const [ext] = await db
    .select({ id: extensions.id })
    .from(extensions)
    .where(extWhere)
    .limit(1);

  if (!ext) throw new InstallError("extension_not_found");
  const extensionId = ext.id;

  let version = params.version;
  if (!version) {
    const [latest] = await db
      .select({ version: extensionVersions.version })
      .from(extensionVersions)
      .where(
        and(
          eq(extensionVersions.extensionId, extensionId),
          eq(extensionVersions.status, "ready"),
        ),
      )
      .orderBy(desc(extensionVersions.publishedAt))
      .limit(1);
    if (!latest) throw new InstallError("no_published_version");
    version = latest.version;
  }

  const installedColId = await getOrCreateSystemCollection(userId, "installed");

  const prior = await db
    .select({ id: installs.id })
    .from(installs)
    .where(and(eq(installs.userId, userId), eq(installs.extensionId, extensionId)))
    .limit(1);
  const isFirstInstall = prior.length === 0;

  const installId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(installs).values({
      id: installId,
      userId,
      extensionId,
      version: version!,
      source,
    });

    await tx
      .insert(collectionItems)
      .values({ collectionId: installedColId, extensionId })
      .onConflictDoNothing();

    await tx
      .update(extensions)
      .set({ downloadsCount: sql`${extensions.downloadsCount} + 1` })
      .where(eq(extensions.id, extensionId));
  });

  return { installId, isFirstInstall, version };
}
