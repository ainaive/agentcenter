import { sql } from "drizzle-orm";

import { COLLECTIONS } from "@/lib/data/collections";
import { DEPARTMENTS } from "@/lib/data/departments";
import { EXTENSIONS } from "@/lib/data/extensions";
import { db } from "@/lib/db/client";
import {
  departments,
  extensions,
  extensionTags,
  memberships,
  organizations,
  tags,
  users,
} from "@/lib/db/schema";
import { TAG_LABELS } from "@/lib/tags";
import type { Department } from "@/types";

// Single-tenant default for v1; multi-org UI lives behind this for later.
const ORG_ID = "default";

// Mock creator users — each extension is assigned one of these deterministically
// so the creator/publisher filters have meaningful options to choose from.
const CREATORS = [
  { id: "user-amy", email: "amy@agentcenter.dev", name: "Amy Chen" },
  { id: "user-ben", email: "ben@agentcenter.dev", name: "Ben Park" },
  { id: "user-cory", email: "cory@agentcenter.dev", name: "Cory Liu" },
  { id: "user-dao", email: "dao@agentcenter.dev", name: "Dao Tran" },
  { id: "user-eli", email: "eli@agentcenter.dev", name: "Eli Smith" },
  { id: "user-fei", email: "fei@agentcenter.dev", name: "Fei Wang" },
];

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

  // Build per-author publisher orgs. Each unique `author` on an extension
  // becomes its own organization so the publisher filter has real options.
  const authorOrgIdMap = new Map<string, string>();
  for (const e of EXTENSIONS) {
    if (!authorOrgIdMap.has(e.author)) {
      const slug = slugify(e.author) || `author-${authorOrgIdMap.size}`;
      authorOrgIdMap.set(e.author, slug);
    }
  }
  const orgRows = [
    {
      id: ORG_ID,
      slug: "default",
      name: "Default Organization",
      nameZh: "默认组织",
    },
    ...Array.from(authorOrgIdMap.entries()).map(([author, id]) => ({
      id,
      slug: id,
      name: author,
      nameZh: null,
    })),
  ];
  console.log(`seed: inserting ${orgRows.length} organizations`);
  await db.insert(organizations).values(orgRows);

  // Mock creator users — idempotent against existing real users.
  console.log(`seed: upserting ${CREATORS.length} creator users`);
  await db.insert(users).values(CREATORS).onConflictDoNothing();

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

  const extRows = EXTENSIONS.map((e, i) => {
    const creator = CREATORS[i % CREATORS.length];
    const ownerOrgId = authorOrgIdMap.get(e.author);
    if (!ownerOrgId) throw new Error(`no org for author ${e.author}`);
    return {
      id: `ext-${e.id}`,
      slug: slugify(e.name),
      category: e.category,
      badge: e.badge ?? null,
      scope: e.scope,
      funcCat: e.funcCat,
      subCat: e.subCat,
      publisherUserId: creator.id,
      ownerOrgId,
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
    };
  });
  console.log(`seed: inserting ${extRows.length} extensions`);
  await db.insert(extensions).values(extRows);

  // Memberships derive from the (creator, owning org) pairs that emerge
  // from extensions — naturally satisfies "one creator can belong to many
  // publishers" since most creators publish to several orgs.
  const seen = new Set<string>();
  const membershipRows: {
    id: string;
    userId: string;
    orgId: string;
    role: "publisher";
  }[] = [];
  for (const row of extRows) {
    const key = `${row.publisherUserId}|${row.ownerOrgId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    membershipRows.push({
      id: `mem-${row.publisherUserId}-${row.ownerOrgId}`,
      userId: row.publisherUserId,
      orgId: row.ownerOrgId,
      role: "publisher",
    });
  }
  console.log(`seed: inserting ${membershipRows.length} memberships`);
  await db.insert(memberships).values(membershipRows);

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
