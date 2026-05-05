import { sql } from "drizzle-orm";

import { COLLECTIONS } from "@/lib/data/collections";
import { DEPARTMENTS } from "@/lib/data/departments";
import { EXTENSIONS } from "@/lib/data/extensions";
import { db } from "@/lib/db/client";
import {
  departments,
  extensions,
  extensionTags,
  organizations,
  tags,
} from "@/lib/db/schema";
import { TAG_LABELS } from "@/lib/tags";
import type { Department } from "@/types";

// Single-tenant default for v1; multi-org UI lives behind this for later.
const ORG_ID = "default";

interface FlatDept {
  id: string;
  orgId: string;
  parentId: string | null;
  name: string;
  nameZh: string;
  pathDepth: number;
}

function flattenDepts(
  list: Department[],
  depth = 0,
  parentId: string | null = null,
  out: FlatDept[] = [],
): FlatDept[] {
  for (const d of list) {
    out.push({
      id: d.id,
      orgId: ORG_ID,
      parentId,
      name: d.name,
      nameZh: d.nameZh,
      pathDepth: depth,
    });
    if (d.children) flattenDepts(d.children, depth + 1, d.id, out);
  }
  return out;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORY_LABELS = {
  skills: "skill",
  mcp: "MCP server",
  slash: "slash command",
  plugins: "plugin",
} as const;

/**
 * Placeholder README content. Real READMEs will arrive via the upload wizard
 * (Phase 10) once the manifest spec is wired up.
 */
function generateReadme(ext: (typeof EXTENSIONS)[number]): string {
  const kind = CATEGORY_LABELS[ext.category];
  const installCmd =
    ext.category === "slash"
      ? `agentcenter install ${slugify(ext.name)}`
      : `agentcenter install ${slugify(ext.name)}`;
  return `# ${ext.name}

${ext.desc}

## Overview

${ext.name} is a ${kind} published by **${ext.author}**. It plugs into your
agent runtime so you can ${ext.desc.toLowerCase().replace(/\.$/, "")} without
hand-rolling integrations.

## Install

\`\`\`bash
${installCmd}
\`\`\`

After installing, restart your agent to pick up the new ${kind}.

## Compatibility

- **Claude** — supported on the latest agent runtimes
- **Other agents** — install paths can be customized via \`agentcenter config\`

## Tags

${ext.tags.map((t) => `\`${t}\``).join(" · ")}
`;
}

async function main() {
  console.log("seed: starting");

  // Idempotent wipe of catalog data. CASCADE follows FKs through the whole
  // org→dept→extension→junction graph. Leaves users/sessions/tags untouched
  // for orgs; we then separately wipe tags.
  console.log("seed: truncating catalog tables");
  await db.execute(
    sql`TRUNCATE TABLE ${organizations}, ${tags} RESTART IDENTITY CASCADE`,
  );

  console.log("seed: inserting org");
  await db.insert(organizations).values({
    id: ORG_ID,
    slug: "default",
    name: "Default Organization",
    nameZh: "默认组织",
  });

  const flatDepts = flattenDepts(DEPARTMENTS);
  console.log(`seed: inserting ${flatDepts.length} departments`);
  await db.insert(departments).values(flatDepts);

  const tagRows = Object.entries(TAG_LABELS).map(([id, label]) => ({
    id,
    labelEn: label.en,
    labelZh: label.zh,
  }));
  console.log(`seed: inserting ${tagRows.length} tags`);
  await db.insert(tags).values(tagRows);

  const extRows = EXTENSIONS.map((e) => ({
    id: `ext-${e.id}`,
    slug: slugify(e.name),
    category: e.category,
    badge: e.badge ?? null,
    scope: e.scope,
    funcCat: e.funcCat,
    subCat: e.subCat,
    publisherUserId: null,
    ownerOrgId: ORG_ID,
    deptId: e.dept,
    iconEmoji: e.icon,
    iconColor: e.color,
    visibility: "published" as const,
    name: e.name,
    nameZh: e.nameZh,
    description: e.desc,
    descriptionZh: e.descZh,
    readmeMd: generateReadme(e),
    downloadsCount: e.downloads,
    starsAvg: String(e.stars),
    ratingsCount: 0,
    publishedAt: new Date(),
  }));
  console.log(`seed: inserting ${extRows.length} extensions`);
  await db.insert(extensions).values(extRows);

  const extTagRows = EXTENSIONS.flatMap((e) =>
    e.tags.map((tagKey) => ({
      extensionId: `ext-${e.id}`,
      tagId: tagKey,
    })),
  );
  console.log(`seed: inserting ${extTagRows.length} extension-tag links`);
  await db.insert(extensionTags).values(extTagRows);

  // Collections are user-owned and seeded per-user post-signup (Phase 7).
  // For now we just log the prototype's example collections for reference.
  console.log(
    `seed: skipping ${COLLECTIONS.length} mock collections (user-owned, seeded post-signup in Phase 7)`,
  );

  console.log("seed: done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("seed: failed");
    console.error(err);
    process.exit(1);
  });
