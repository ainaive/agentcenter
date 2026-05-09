# AgentCenter — Implementation Plan

Marketplace for AI agent extensions (Skills, MCP servers, slash commands, plugins) with internal-enterprise features (departments, scope, tags, collections) and a companion CLI for actual machine-side install.

Built on Next.js 16 (RSC, Turbopack) + Drizzle/Postgres + Tailwind v4 with the prototype's "Editorial Ivory" aesthetic.

This document is the living plan. When a binding decision changes, update it in the same commit as the code change.

---

## 1. Project layout

App Router, single Next.js app, server components by default. Routes are localized; everything user-facing lives behind `[locale]`. The CLI is a sibling project under `cli/` in the same monorepo (Bun workspaces).

```
/Users/hutusi/workspace/ai/naive/agentcenter/
├── CLAUDE.md
├── docs/
│   ├── plan.md                          # this file
│   ├── manifest-spec.md                 # extension manifest schema (P0, before upload wizard)
│   └── adr/                             # one short ADR per binding decision change
├── app/
│   ├── layout.tsx                       # html/body, font loaders, Providers
│   ├── globals.css                      # Tailwind v4 + theme tokens (@theme)
│   ├── [locale]/
│   │   ├── layout.tsx                   # NextIntlClientProvider, TopBar, Sidebar shell
│   │   ├── page.tsx                     # Home: featured + browse grid (RSC)
│   │   ├── (browse)/
│   │   │   ├── extensions/page.tsx      # Browse all (filters via searchParams)
│   │   │   ├── extensions/[slug]/page.tsx
│   │   │   └── extensions/[slug]/opengraph-image.tsx
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   ├── collections/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── publish/
│   │   │   ├── page.tsx                 # Publisher dashboard
│   │   │   └── new/page.tsx             # Upload wizard
│   │   └── docs/
│   │       └── [[...slug]]/page.tsx     # MDX docs (P1)
│   ├── api/
│   │   ├── auth/[...all]/route.ts       # Better Auth handler
│   │   ├── v1/                          # Public registry API consumed by CLI
│   │   │   ├── extensions/route.ts      # GET list (subset of filters)
│   │   │   ├── extensions/[slug]/route.ts
│   │   │   └── extensions/[slug]/bundle/route.ts  # signed redirect to R2
│   │   ├── upload/sign/route.ts         # Issue R2 presigned PUT
│   │   ├── installs/route.ts            # POST install event from CLI or web
│   │   └── inngest/route.ts             # Inngest webhook handler
│   └── opengraph-image.tsx
├── components/
│   ├── ui/                              # shadcn primitives (button, dialog, dropdown, popover, select, checkbox, input, badge, sheet, command)
│   ├── layout/
│   │   ├── top-bar.tsx                  # serif wordmark, search, lang toggle, theme toggle, user avatar
│   │   ├── sidebar.tsx                  # Browse + Categories + Collections sections
│   │   ├── locale-switch.tsx
│   │   └── theme-switch.tsx             # Ivory ↔ Dark
│   ├── extension/
│   │   ├── ext-card.tsx
│   │   ├── ext-grid.tsx
│   │   ├── ext-detail.tsx               # README rendering + metadata sidebar
│   │   ├── install-button.tsx           # client island; triggers CLI deeplink + install event
│   │   ├── add-to-group.tsx
│   │   └── featured-banner.tsx
│   ├── filters/                         # Mode B (drawer)
│   │   ├── filter-bar.tsx
│   │   ├── dept-picker.tsx
│   │   ├── scope-pills.tsx
│   │   ├── filter-chips.tsx
│   │   ├── tag-drawer.tsx
│   │   └── sort-select.tsx
│   ├── publish/
│   │   ├── upload-wizard.tsx            # 3-step (manifest → files → review)
│   │   └── manifest-form.tsx
│   └── providers.tsx                    # theme + intl + toaster
├── lib/
│   ├── db/
│   │   ├── client.ts                    # drizzle(neon())
│   │   ├── schema/
│   │   │   ├── auth.ts                  # users, sessions, accounts, verifications
│   │   │   ├── org.ts                   # organizations, departments, memberships
│   │   │   ├── extension.ts             # extensions, extension_versions, files, tags, extension_tags
│   │   │   ├── collection.ts            # collections, collection_items
│   │   │   ├── activity.ts              # installs, ratings, view_events
│   │   │   └── index.ts
│   │   ├── queries/
│   │   │   ├── extensions.ts
│   │   │   ├── departments.ts
│   │   │   └── collections.ts
│   │   └── seed.ts                      # bun script: 16 prototype extensions + dept tree + tags
│   ├── auth/
│   │   ├── index.ts                     # betterAuth({...}) config
│   │   └── session.ts                   # getSession() helper for RSC
│   ├── i18n/
│   │   ├── routing.ts                   # next-intl routing
│   │   ├── request.ts
│   │   └── messages/{en,zh}.json
│   ├── storage/
│   │   └── r2.ts                        # S3 client → R2 (presigned URLs)
│   ├── jobs/
│   │   ├── client.ts                    # Inngest client
│   │   ├── scan-bundle.ts               # virus scan + manifest validation
│   │   └── reindex-search.ts            # rebuild tsvector after publish
│   ├── search/
│   │   ├── filters.ts                   # parse searchParams → typed Filters
│   │   └── query.ts                     # build Drizzle where() composition
│   ├── validators/
│   │   ├── extension.ts                 # Zod: ManifestSchema, UploadSchema
│   │   └── filters.ts                   # Zod: searchParams shape
│   ├── taxonomy.ts                      # FUNC_TAXONOMY constant
│   ├── tags.ts                          # TAG_LABELS map
│   └── utils.ts                         # cn(), formatNum(), deptPath(), isDescendant()
├── cli/                                 # Bun workspace package: @agentcenter/cli
│   ├── package.json
│   ├── src/
│   │   ├── index.ts                     # commander/yargs entrypoint
│   │   ├── commands/
│   │   │   ├── login.ts                 # device-code OAuth flow
│   │   │   ├── install.ts
│   │   │   ├── uninstall.ts
│   │   │   ├── list.ts
│   │   │   ├── config.ts                # config set/get/list
│   │   │   └── whoami.ts
│   │   ├── installers/
│   │   │   ├── index.ts                 # dispatcher by category
│   │   │   ├── skills.ts                # Phase 9 (P0)
│   │   │   ├── mcp.ts                   # P1
│   │   │   ├── slash.ts                 # P1
│   │   │   └── plugins.ts               # P1
│   │   ├── api.ts                       # registry API client
│   │   ├── auth-store.ts                # ~/.config/agentcenter/credentials
│   │   └── config-store.ts              # ~/.config/agentcenter/config.toml
│   └── README.md
├── types/
│   └── index.ts                         # Extension, Department, Filters, Collection, Manifest
├── drizzle/                             # generated migrations (drizzle-kit)
├── public/
│   └── icons/
├── scripts/
│   └── seed.ts                          # bun run scripts/seed.ts
├── drizzle.config.ts
├── inngest.config.ts
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json                         # root workspace
├── bun.lockb
└── .env.local
```

**API routes vs server actions**: server actions for user-initiated mutations from RSC pages (install toggle from web, save-to-collection, create collection). API routes for: (a) Better Auth, (b) presigned R2 URL signing, (c) Inngest webhook, (d) **public registry API** under `/api/v1/...` consumed by the CLI.

---

## 2. Routes & pages

| URL | Purpose | MVP |
|---|---|---|
| `/[locale]` | Home — featured banner + Trending Skills + Browse All grid | **P0** |
| `/[locale]/extensions` | Full browse with all filters in URL | **P0** |
| `/[locale]/extensions/[slug]` | Detail: README, metadata sidebar, version history, install | **P0** |
| `/[locale]/sign-in`, `/sign-up` | Email/password (open sign-up) | **P0** |
| `/[locale]/onboard` | Pick department after sign-up | **P0** |
| `/[locale]/collections` | My collections list | **P0** |
| `/[locale]/collections/[id]` | Collection contents | P1 |
| `/[locale]/publish` | Publisher dashboard (own drafts, resume / discard) | **P0** |
| `/[locale]/publish/new` | Upload wizard — new draft | **P0** |
| `/[locale]/publish/[id]/edit` | Upload wizard — resume / edit an existing draft | **P0** |
| `/[locale]/cli/auth` | Device-code authorization page (CLI displays code, user enters here) | **P0** |
| `/[locale]/settings` | Profile, dept, language, theme | P1 |
| `/[locale]/admin` | Moderate, feature, ban | P1 |
| `/[locale]/docs/[[...slug]]` | MDX docs | P2 |

---

## 3. Drizzle schema

All in `lib/db/schema/`. `withTimezone: true, defaultNow()` on every timestamp. Text PKs via `nanoid` for user-facing IDs; numeric PKs in junction tables.

```ts
// schema/auth.ts — Better Auth shape
users: id (text pk), email (unique), emailVerified, name, image,
       locale ('en'|'zh' default 'en'), themePreference ('ivory'|'dark'|'system'),
       defaultDeptId (fk departments.id, nullable), createdAt, updatedAt
sessions, accounts, verifications: per Better Auth spec

// schema/org.ts
organizations: id, slug (unique), name, nameZh, logoUrl, createdAt
departments:
  id (text pk, dotted-path e.g. "eng.cloud.infra"),
  orgId (fk organizations),
  parentId (fk departments.id, self-ref, nullable),
  name, nameZh,
  pathDepth (int — derived for indexing),
  createdAt
  // INDEX: btree on id (default, used as text_pattern_ops for LIKE), (orgId, parentId), GIN trgm on name
memberships: id, userId, orgId, deptId, role ('viewer'|'publisher'|'admin'), createdAt
  // UNIQUE (userId, orgId)

// schema/extension.ts
extensions:
  id (text pk, nanoid),
  slug (unique, e.g. 'web-search-pro'),
  category ('skills'|'mcp'|'slash'|'plugins'),       // pgEnum
  badge ('official'|'popular'|'new' | null),
  scope ('personal'|'org'|'enterprise'),             // pgEnum
  funcCat ('workTask'|'business'|'tools'),           // pgEnum
  subCat (text),                                     // l1 key, validated against taxonomy.ts
  l2 (text, nullable),
  publisherUserId (fk users.id),
  ownerOrgId (fk organizations.id),
  deptId (fk departments.id),
  iconEmoji (text), iconColor (text),
  visibility ('draft'|'published'|'archived'),       // pgEnum, default 'draft'
  // i18n columns
  name, nameZh, description, descriptionZh, tagline, taglineZh,
  // metadata for detail page sidebar
  homepageUrl, repoUrl, licenseSpdx, compatibilityJson (jsonb — agent versions),
  // denormalized counters
  downloadsCount (int default 0),
  starsAvg (numeric(2,1) default 0),
  ratingsCount (int default 0),
  // FTS
  searchVector (tsvector, generated column — see §8),
  publishedAt, createdAt, updatedAt
  // INDEXES:
  //   idx_ext_category (category)
  //   idx_ext_scope (scope)
  //   idx_ext_funcSubL2 (funcCat, subCat, l2)
  //   idx_ext_dept_prefix on deptId text_pattern_ops  ← critical: enables descendant lookup via LIKE 'eng.cloud.%'
  //   idx_ext_search GIN (searchVector)
  //   idx_ext_downloads (downloadsCount DESC) for sort
  //   idx_ext_stars (starsAvg DESC) for sort

extensionVersions:
  id, extensionId (fk), version (semver text), changelog, changelogZh,
  manifestJson (jsonb), bundleFileId (fk files.id),
  status ('pending'|'scanning'|'ready'|'rejected'), publishedAt, createdAt
  // UNIQUE (extensionId, version)

files:
  id (text pk), extensionVersionId (fk, nullable for orphan uploads),
  r2Key (text), size (bigint), checksumSha256, mimeType,
  scanStatus ('pending'|'clean'|'flagged'), scanReport (jsonb), createdAt

tags:
  id (text pk = the key, e.g. 'real-time'),
  labelEn, labelZh
  // INDEX: GIN trgm on (labelEn, labelZh) for autocomplete

extensionTags:
  extensionId (fk), tagId (fk),
  PRIMARY KEY (extensionId, tagId)
  // INDEX (tagId, extensionId) for "find ext by tag"

// schema/collection.ts
collections:
  id, ownerUserId, name, nameZh,
  systemKind ('installed'|'saved'|null),  // null for user-created groups
  createdAt
collectionItems:
  collectionId, extensionId, addedAt
  PRIMARY KEY (collectionId, extensionId)

// schema/activity.ts
installs:
  id, userId, extensionId, version, source ('cli'|'web'),
  installedAt, uninstalledAt (nullable)
  // INDEX (userId, extensionId), partial WHERE uninstalledAt IS NULL
ratings:
  id, userId, extensionId, stars (int 1..5), review (text), createdAt
  // UNIQUE (userId, extensionId)
viewEvents: (P1) id, userId (nullable), extensionId, ts
```

**Critical indexing notes:**

- Department descendant matching uses the dotted-path id directly: `WHERE deptId = $1 OR deptId LIKE $1 || '.%'`. This requires `text_pattern_ops` on `deptId` to use the index for `LIKE`. No recursive CTE.
- Filter combinations: `(funcCat, subCat, l2)` covers drill-down.
- Sort indexes are separate (`downloadsCount DESC`, `starsAvg DESC`); Postgres index-scans when filter selectivity is low enough.

---

## 4. i18n strategy

- **Library**: next-intl. Locales `en` (default) | `zh`. **Always-prefixed URLs** (`/en/...`, `/zh/...`). Middleware redirects bare `/` → `/en` based on `Accept-Language`.
- **Static UI strings**: `lib/i18n/messages/{en,zh}.json`, namespaced by feature (`Sidebar.browse`, `FilterBar.scope.personal`, `Card.installed`). Reuse the prototype's `T` keys verbatim. Server components: `getTranslations()`. Client components: `useTranslations()`.
- **Dynamic content** (extension names, descriptions, dept names, tag labels, changelogs): **column-per-language** (`name` + `nameZh`, `description` + `descriptionZh`). Rationale: only 2 locales planned, prototype already uses this shape, keeps `WHERE` and FTS-per-locale simple. Migrate to a `translations` side-table if a 3rd locale arrives.
- **Tag labels**: `tags` table carries `labelEn` + `labelZh`, seeded from prototype's `TAG_LABELS`.
- **Locale switcher**: `<Link>` swapping the locale segment; preserves filter searchParams.
- **FTS**: separate weighted tsvector concatenating all language variants — see §8.

---

## 5. Theming

Two themes shipped: **Editorial Ivory** (default) + **Dark**. Mono Clean dropped.

Theme tokens in `app/globals.css` via Tailwind v4 `@theme` blocks, switched by a `data-theme` attribute on `<html>`:

```css
@import "tailwindcss";

@theme {
  /* Editorial Ivory (default) */
  --color-bg:           oklch(98.5% 0.008 80);
  --color-sidebar:      oklch(97.5% 0.008 80);
  --color-card:         #ffffff;
  --color-border:       oklch(92% 0.012 70);
  --color-ink:          oklch(22% 0.02 60);
  --color-ink-muted:    oklch(48% 0.015 60);
  --color-accent:       oklch(40% 0.09 35);
  --color-accent-fg:    oklch(98% 0.005 70);
  /* badges, filter states, etc. */
  --font-sans:    "Inter", ui-sans-serif, system-ui;
  --font-serif:   "Fraunces", Georgia, serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;
  --radius-card:  10px;
}

[data-theme="dark"] {
  --color-bg:           oklch(14% 0.006 240);
  --color-sidebar:      oklch(12% 0.005 240);
  --color-card:         oklch(19% 0.008 240);
  --color-border:       oklch(24% 0.008 240);
  --color-ink:          oklch(90% 0.006 240);
  --color-ink-muted:    oklch(58% 0.008 240);
  --color-accent:       oklch(72% 0.18 200);
  --color-accent-fg:    oklch(12% 0.01 240);
}

.serif { font-family: var(--font-serif); font-feature-settings: "ss01"; letter-spacing: -0.015em; }
```

Theme switch: `<ThemeSwitch>` in the top bar, persisted to `users.themePreference`, falls back to `prefers-color-scheme` for unauthenticated visitors. No flash on initial load (set `data-theme` from a cookie before hydration).

Fonts loaded via `next/font` in `app/layout.tsx` and wired into `--font-sans`/`--font-serif`/`--font-mono` at the `body` root.

---

## 6. Auth & access model

**Better Auth.** Cookie-based server-side sessions; no JWTs (we hit the DB on every RSC request anyway). Drizzle adapter; auth tables live in `lib/db/schema/auth.ts`.

- **Sign-up policy**: open. Email + password for v1; SSO/SAML deferred.
- **MVP roles** (on `memberships.role`): `viewer` (browse, install, rate), `publisher` (upload), `admin` (moderate).
- **Onboarding step** at `/[locale]/onboard` after first sign-up: pick your department. Required before homepage. Org membership auto-created (single-tenant for v1, but `organizations` table is populated so multi-org flip is just middleware later).
- **CLI auth**: device-code OAuth flow. CLI displays a short code → user opens `/[locale]/cli/auth`, signs in if needed, enters code, approves → CLI polls `/api/v1/auth/device/poll` until token issued. Token stored at `~/.config/agentcenter/credentials`.

---

## 7. Upload pipeline

```
[Publisher] /publish/new  (3-step wizard, client component)
  Step 1: Manifest form  (name, slug, category, scope, funcCat/subCat/l2, dept,
                          tags, description × 2 locales, install paths per agent)
            → Zod validate → server action createDraftExtension() → returns extensionId
  Step 2: File upload     POST /api/upload/sign  → R2 presigned PUT
                          → browser uploads bundle directly to R2
                          → server action attachFile(extensionId, fileId)
  Step 3: Review & submit → server action submitForReview(extensionId)
                          → submit(versionId) flips status to 'scanning'
                            (idempotent: pending|scanning → scanning, so a retry
                             after a failed inngest.send can re-queue the scan)
                          → inngest.send({ name: 'extension/scan.requested', ... })
                            (best-effort rollback to 'pending' on send failure)
                          → return to /publish dashboard

[Publisher] /publish (dashboard)
  - Lists my drafts with stage (needs upload / ready to submit / scanning / …).
  - Resumable rows (status='pending') link to /publish/[id]/edit → same wizard,
    pre-filled, slug+version locked while a bundle is uploaded (they form the
    R2 bundle key bundles/<slug>/<version>/bundle.zip).
  - Per-row Discard button hard-deletes the draft (FK cascades). R2 bundle
    objects are left for bucket lifecycle.

[Background, Inngest]
  on 'extension/scan.requested':
    1. fetch from R2
    2. checksum + size guard
    3. parse manifest.json against ManifestSchema (Zod)
    4. (optional) clamav scan
    5. write scanReport to files; on clean → status='ready'
    6. inngest.send({ name: 'extension/index.requested', ... })
  on 'extension/index.requested':
    1. UPDATE extensions SET searchVector = ...
    2. flip visibility='published' if all checks pass
    3. revalidateTag('extensions')
    4. inngest.send({ name: 'extension/published', ... })  // for downstream notifications later
```

**Synchronous** (server action, returns < 200ms): manifest creation, presigned URL signing, attach-file, submitForReview enqueue.
**Async** (Inngest): bundle download, scan, validation, indexing, publish flip.

The manifest spec lives in `docs/manifest-spec.md` (drafted in Phase 8 before the wizard). Includes:
- Identity: `slug`, `name`, `nameZh`, `version` (semver), `category`, `license`
- Discoverability: `tags`, `funcCat`, `subCat`, `l2`, `scope`
- Content: `description`, `descriptionZh`, `readme.md`, `screenshots/`
- Compatibility: `requires.agent` (e.g. `claude>=0.8`), `requires.os`
- Install targets: per-agent destination paths, defaulting to Claude paths

---

## 8. Search

Postgres FTS with `pg_trgm` fallback for short fuzzy queries.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE extensions ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')),       'A') ||
    setweight(to_tsvector('simple', coalesce(name_zh, '')),    'A') ||
    setweight(to_tsvector('simple', coalesce(tagline, '')),    'B') ||
    setweight(to_tsvector('simple', coalesce(tagline_zh, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')),    'C') ||
    setweight(to_tsvector('simple', coalesce(description_zh, '')), 'C')
  ) STORED;

CREATE INDEX idx_ext_search ON extensions USING GIN (search_vector);
CREATE INDEX idx_ext_name_trgm ON extensions USING GIN (lower(name) gin_trgm_ops);
CREATE INDEX idx_ext_name_zh_trgm ON extensions USING GIN (name_zh gin_trgm_ops);
```

**Why `'simple'` config**: Postgres has no built-in zh tokenizer; `zhparser` is an extension Neon may not enable. `'simple'` does whitespace+lowercase only — fine for short marketplace names/taglines in EN, and combined with `pg_trgm` on the same columns gives substring matching for ZH. We can swap the EN side to `'english'` for stemming if/when it matters.

**Filter composition** lives in `lib/search/query.ts` as one central `buildExtensionFilters(filters: Filters)` returning a Drizzle `SQL` expression. Filters originate as searchParams, parsed by Zod (`lib/validators/filters.ts`) — so the URL is the filter state (shareable, server-rendered, deeplinkable).

```ts
const whereClauses = [
  eq(extensions.visibility, 'published'),
  filters.category && filters.category !== 'all' ? eq(extensions.category, filters.category) : undefined,
  filters.scope    && filters.scope !== 'all'    ? eq(extensions.scope, filters.scope) : undefined,
  filters.funcCat  ? eq(extensions.funcCat, filters.funcCat) : undefined,
  filters.subCat   ? eq(extensions.subCat,  filters.subCat)  : undefined,
  filters.deptId   && filters.deptId !== '__all'
    ? or(eq(extensions.deptId, filters.deptId), like(extensions.deptId, filters.deptId+'.%'))
    : undefined,
  filters.q        ? or(
                      sql`${extensions.searchVector} @@ websearch_to_tsquery('simple', ${filters.q})`,
                      ilike(extensions.name, `%${filters.q}%`),
                      ilike(extensions.nameZh, `%${filters.q}%`),
                    ) : undefined,
  filters.tags?.length
    ? inArray(extensions.id,
        db.select({ id: extensionTags.extensionId })
          .from(extensionTags)
          .where(inArray(extensionTags.tagId, filters.tags))
          .groupBy(extensionTags.extensionId)
          .having(filters.tagMatch === 'all'
            ? sql`count(*) = ${filters.tags.length}`
            : sql`count(*) >= 1`)
      )
    : undefined,
].filter(Boolean);
```

Reserve **Meilisearch** for when (a) corpus > ~50k extensions, (b) typo-tolerance becomes a real complaint, or (c) facet counts get expensive.

---

## 9. CLI design

Separate Bun workspace package (`@agentcenter/cli`), distributed via npm (`npm i -g @agentcenter/cli`) and Homebrew (formula in P1). Single binary built with `bun build --compile` for zero-runtime install.

### Architecture

```
cli/src/
├── index.ts              # CLI entrypoint (commander)
├── api.ts                # registry API client (typed via shared types)
├── auth-store.ts         # ~/.config/agentcenter/credentials (mode 0600)
├── config-store.ts       # ~/.config/agentcenter/config.toml
├── commands/
│   ├── login.ts          # device-code flow
│   ├── install.ts        # download + dispatch to installer by category
│   ├── uninstall.ts
│   ├── list.ts           # list installed extensions on this machine
│   ├── config.ts         # set/get/list — agent target paths, registry URL
│   └── whoami.ts
└── installers/
    ├── index.ts          # dispatcher
    ├── skills.ts         # P0: download → extract to <agent>/skills/<slug>/
    ├── mcp.ts            # P1: register in claude_desktop_config.json or equivalent
    ├── slash.ts          # P1: drop into <agent>/commands/
    └── plugins.ts        # P1: <agent>/plugins/<slug>/ + activation
```

### Agent-agnostic with Claude-first defaults

The CLI doesn't hard-code Claude paths. Instead:

1. **Each extension manifest** declares per-agent install destinations:
   ```toml
   [install.claude]
   skills = "~/.claude/skills/{slug}"
   commands = "~/.claude/commands/{slug}"
   [install.aider]   # other agents can be supported later
   ...
   ```
2. **CLI config** picks an active agent profile (`agentcenter config set agent claude`) and overrides paths if needed (`agentcenter config set install.basePath /custom/path`).
3. **Default agent profile**: `claude`. New users get the right behavior without configuration.

### Auth

Device-code OAuth grant:
1. `agentcenter login` → CLI calls `/api/v1/auth/device/code` → gets `{ user_code, verification_uri }`
2. CLI prints: "Visit `https://agentcenter.app/en/cli/auth` and enter `XXXX-YYYY`"
3. CLI polls `/api/v1/auth/device/poll` every 5s
4. User completes flow on web → server links code to user → poll returns token
5. Token persisted to `~/.config/agentcenter/credentials` (mode 0600)

### Install flow (Skills, P0)

```
$ agentcenter install web-search-pro
1. CLI → GET /api/v1/extensions/web-search-pro             # manifest + version metadata
2. CLI → GET /api/v1/extensions/web-search-pro/bundle      # 302 → R2 signed URL
3. Download bundle to temp, verify checksum
4. Extract to manifest.install.claude.skills (default ~/.claude/skills/web-search-pro/)
5. CLI → POST /api/v1/installs                              # record install event
6. Print success + next-steps from manifest.postInstall
```

P0 supports the **skills** category only (simplest install: extract to a directory). P1 adds MCP (config-file mutation), slash commands (file drop), plugins (activation hooks).

---

## 10. Milestone order

| Phase | Duration | Deliverable |
|---|---|---|
| **0. Bootstrap** | 0.5d | `bun create next-app` (TS, App Router, no `src/`), Tailwind v4, shadcn init, fonts via next/font, Drizzle + Neon connection, `.env` template, basic CI lint |
| **1. Visual shell** | 1.5d | TopBar + Sidebar + ivory + dark theme tokens; theme-switch component; seed `lib/taxonomy.ts` + `lib/tags.ts` from prototype; statically render the home layout pixel-matched to the prototype |
| **2. DB + seed** | 1d | All schema files; `drizzle-kit generate` + `migrate`; `scripts/seed.ts` loads 16 prototype extensions, the dept tree, 32 tags, the func taxonomy. Working `select` query in a server component |
| **3. Browse + filter (vertical-slice demo)** | 2d | `/[locale]/extensions` with all filters wired through searchParams; ExtCard component; FilterBar Mode B; dept picker popover; sort. Home shows featured banner + first 6 + Browse All. **Anonymous browse works.** ← clickable demo URL by end of this phase |
| **4. Detail page** | 1d | `/extensions/[slug]` — react-markdown + rehype-sanitize for README, metadata sidebar (homepage/repo/license/compat), version table, install button (placeholder, wired in Phase 9) |
| **5. i18n** | 1d | next-intl wired, en + zh messages from prototype's `T`, locale switcher, middleware, always-prefixed URLs |
| **6. Auth** | 1.5d | Better Auth + Drizzle adapter, sign-in/up pages, dept-pick onboarding, `getSession()` helper, protect publish/collection routes |
| **7. Collections + Install events** | 1d | Server actions for `installExtension` (records event), `addToCollection`, `createCollection`; system 'installed'/'saved' collections seeded per user on signup |
| **8. Public registry API + manifest spec** | 1d | `docs/manifest-spec.md`, `/api/v1/extensions/...` endpoints, signed bundle URLs, install event POST endpoint |
| **9. CLI v1 (skills only)** | 3d | Bun workspace, device-code auth (web side: `/[locale]/cli/auth` page + `/api/v1/auth/device/...`), `install`/`list`/`uninstall`/`config`/`whoami`, agent-agnostic install dispatcher with Claude default. Distributed via npm |
| **10. Upload wizard** | 2d | 3-step wizard, R2 presigned upload, draft extension creation, manifest Zod validation |
| **11. Background jobs** | 1d | Inngest project init, `scan-bundle` + `reindex-search` functions, webhook route, status polling on publisher dashboard |
| **12. Search FTS** | 0.5d | tsvector migration, trgm indexes, top-bar search wired to filter query |
| **13. Polish** | 1.5d | empty states, `loading.tsx` + `error.tsx`, OG images, accessibility pass, dark-mode polish across all surfaces |

**Total: ~18 days** to v1. Clickable demo URL by end of Phase 3 (~3.5 days in).

### P1 (post-v1)
- CLI installers for MCP / slash commands / plugins
- Publisher dashboard (own extensions, install metrics, version diffs)
- Admin moderation
- Collection sharing
- Ratings & reviews UI on detail page
- View events + trending calculation
- Homebrew distribution for CLI

### P2
- MDX docs site at `/docs`
- SSO / SAML for enterprise sign-up
- Multi-tenant UI (org switcher, per-org branding)
- Meilisearch swap-in (only if Postgres FTS is hitting limits)

---

## 11. Locked decisions (the 10 that drove the plan)

These were decided in the planning conversation. Update this section in the same commit when any decision changes.

1. **Multi-tenant schema, single-tenant UI** — `organizations` table populated, single org for v1, no org switcher in UI. Multi-org flip is middleware-only later.
2. **Auth library**: Better Auth.
3. **Background jobs**: Inngest.
4. **Themes**: Editorial Ivory + Dark only. Mono Clean dropped.
5. **Bundle storage**: Cloudflare R2.
6. **Install semantics**: real machine-side install via the Agent CLI. Web records install events; CLI does the work. CLI bumped to **P0**.
7. **Sign-up policy**: open.
8. **Locale URLs**: always-prefixed (`/en/...`, `/zh/...`).
9. **Detail page README**: raw markdown stored, rendered server-side with `react-markdown` + `rehype-sanitize`. Manifest metadata rendered as side panel.
10. **CLI strategy**: agent-agnostic with Claude-first defaults. Extensions declare per-agent install paths in the manifest; users override via `agentcenter config`.

---

## 12. Prototype-to-Next mapping (load-bearing)

- `T` object in prototype HTML → split into `messages/en.json` + `messages/zh.json`, preserving keys verbatim.
- `DEPARTMENTS` constant → seeded into `departments` table; the dotted-path id is **kept verbatim as the primary key**. This is the load-bearing schema decision — it makes descendant filtering a single `LIKE` predicate.
- `FUNC_TAXONOMY` → static TS in `lib/taxonomy.ts`, not a DB table. Product-defined, rarely changes.
- `TAG_LABELS` → seeded into `tags` table.
- `EXTENSIONS` array → `scripts/seed.ts` rows; `dept`/`scope`/`funcCat`/`subCat` map to typed columns.
- `MY_DEPT_ID` constant → comes from authenticated user's `defaultDeptId`.
- `isDescendant(deptId, ancestorId)` → moves into the SQL query (`OR LIKE 'ancestor.%'`), no client-side recursion.
- `FilterAreaB` (Mode B drawer) is the only filter mode to build; A and C were prototype scaffolding.
