# Architecture

How AgentCenter fits together today. For *what we plan to build next*, see [`plan.md`](./plan.md). For deployment, see [`deploy.md`](./deploy.md).

## Topology

```text
Browser ──── Vercel (Next.js 16) ──── Neon (Postgres)
                ├── App Router pages (RSC + client islands)
                ├── /api/auth/...        Better Auth cookie sessions
                ├── /api/v1/...          Public registry API (CLI)
                ├── /api/upload/sign     R2 presigned PUT
                └── /api/inngest         Inngest webhook
                                              │
Browser ─── direct PUT ──→  Cloudflare R2 ←──┘
                                              │
                                          Inngest ──→ Neon + R2 (background jobs)

CLI (Bun-built binary) ──── /api/v1/... (Bearer token via device-code flow)
```

Web requests hit Vercel; the CLI hits the same Vercel deployment but talks only to the `/api/v1` surface. Bundles flow directly between the browser/CLI and R2 via signed URLs — Vercel never proxies binary content.

## Web app layout

The App Router tree is locale-segmented. URLs are always prefixed (`/en/...`, `/zh/...`); there is no implicit default.

```text
app/
├── layout.tsx                 # html/body, font loaders, theme cookie
├── [locale]/
│   ├── layout.tsx             # next-intl provider, AppShell (sidebar + topbar)
│   ├── page.tsx               # home (featured + trending)
│   ├── extensions/
│   │   ├── page.tsx           # browse (filter bar + grid)
│   │   ├── error.tsx          # listing route error boundary
│   │   └── [slug]/
│   │       ├── page.tsx       # detail (hero + tabs + sidebar)
│   │       └── error.tsx      # detail route error boundary
│   ├── publish/
│   │   ├── page.tsx           # dashboard (my extensions, with resume + discard)
│   │   ├── new/page.tsx       # upload wizard (new draft)
│   │   └── [id]/edit/page.tsx # upload wizard (resume / edit existing draft)
│   ├── (auth)/sign-in,sign-up
│   └── cli/auth/page.tsx      # device-code authorization UI
└── api/                       # see "API surfaces" below
```

### RSC vs client islands

Server components render the static shell, fetch data via Drizzle, and stream HTML. Client components are reserved for interactive bits — filter chips, the install button, the upload wizard, the user menu — and are marked with `"use client"`. The pattern is "server frame, client islands."

The filter bar (`components/filters/filter-bar.tsx`) is a server component but composes client islands (`FilterChips`, `SortSelect`, `DeptPicker`, `TagDrawer`). Each island calls the typed `useFilters()` hook (`lib/hooks/use-filters.ts`), which exposes a parsed `filters` object and an `update(partial)` setter. Filter state lives in the URL — no global store, no context, and back/forward works. The hook delegates URL parsing/serializing to `parseFilters` / `serializeFilters` in `lib/validators/filters.ts` so the same conventions apply to both server-side reads (in RSCs) and client-side writes.

### i18n

Locales live under `lib/i18n/messages/{en,zh}.json`. `next-intl` is configured with `localePrefix: "always"`. Static UI strings come from `useTranslations(...)`; bilingual content (extension `name` / `nameZh`, tag labels) is column-per-language in Postgres and resolved at the component level via `tagLabel(...)` / direct field access.

### Theme

`Editorial Ivory` (default) and `Dark`. The active theme is stored in a cookie (`theme`), read in the root layout, and applied as a `data-theme` attribute. The toggle (`ThemeSwitch`) writes the cookie and triggers `router.refresh()`.

## Request flows

### Browse

```text
GET /en/extensions?category=skills&dept=eng.cloud&sort=stars
  └─ app/[locale]/extensions/page.tsx (RSC)
      ├─ parseFilters(searchParams)
      ├─ Promise.all([listExtensions, countFilteredExtensions, getTagsWithCounts])
      └─ <FilterBar tags={tags} /> + <ExtGrid items={items} />
```

`buildExtensionWhere` / `buildExtensionOrder` in `lib/search/query.ts` compose Drizzle SQL clauses from filters; they're pure (no DB call), unit-tested, and shared with `/api/v1/extensions` so web and CLI see the same listing semantics.

### Detail

```text
GET /en/extensions/my-skill
  └─ app/[locale]/extensions/[slug]/page.tsx (RSC)
      ├─ getExtensionBySlug(slug)                ─► extensions row + tag ids
      ├─ Promise.all:
      │     ├─ getLatestExtensionVersion(id)     ─► version + bundle size for hero / About
      │     ├─ listExtensionVersions(id)         ─► full changelog feed for the Versions tab
      │     └─ getRelatedExtensions(id, cat)     ─► top 4 by downloads in the same category
      └─ <ExtHero /> + <ExtTabs> + <ExtAboutCard /> + <ExtRelatedList />
```

The page is a two-column layout: the hero (icon block, title + badge, Install/Save/Share CTA row, four-stat grid) sits above a tab strip, with a sticky sidebar on the right.

`<ExtTabs>` is a thin wrapper over `@base-ui/react/tabs`, so keyboard navigation, `aria-controls` wiring, and selected-state styling come from the primitive. Four tabs:

- **Overview** — README rendered with `react-markdown` + `rehype-sanitize`, followed by a tag chip strip.
- **Setup** — the `agentcenter install <slug>` command in a copyable terminal block, plus a Requirements list derived from `extensions.compatibilityJson`.
- **Versions** — flat changelog from `listExtensionVersions` (status `ready` only, ordered by `publishedAt DESC`), with the latest entry tagged "Current".
- **Reviews** — empty-state placeholder; the reviews flow isn't wired yet.

The sidebar has two cards. `<ExtAboutCard>` renders publisher / version / size / license / updated / scope plus the homepage and repo links — every URL passes through `safeExternalUrl()` (allowlists `http(s):`, drops anything else) before reaching `href`. `<ExtRelatedList>` shows the four related extensions; it returns `null` when empty so an empty card never shows.

The share URL on the hero is composed from `process.env.NEXT_PUBLIC_APP_URL` rather than the request `Host` header, since spoofable forwarded headers would let an attacker control what gets copied to clipboard.

### Publish

```text
Browser                          Vercel                          R2          Inngest
   │ form submit                    │                              │             │
   ├──── createDraftExtension ────► server action  ──► extensions row (status=draft)
   │                                │                              │             │
   ├──── upload bundle ─────────────│─── presigned PUT URL ───────►│             │
   │                                │                              │             │
   ├──── attachFile(versionId) ────► server action  ──► files row + extensionVersion
   │                                │                              │             │
   ├──── submitForReview ──────────► server action  ──► sendEvent("extension/scan.requested")
   │                                │                              │             │
   │                                │                              │  scan-bundle:
   │                                │                              │   download from R2,
   │                                │                              │   sha-256 checksum,
   │                                │                              │   parse manifest.toml,
   │                                │                              │   validate schema,
   │                                │                              │   mark version ready/rejected,
   │                                │                              │   sendEvent("extension/index.requested")
   │                                │                              │             │
   │                                │                              │  reindex-search:
   │                                │                              │   set extension visibility=published,
   │                                │                              │   revalidateTag("extensions")
```

The upload goes browser → R2 directly (presigned PUT) — Vercel only signs the URL. The Inngest webhook lives at `/api/inngest`. Job source: `lib/jobs/scan-bundle.ts` and `lib/jobs/reindex-search.ts`.

A note on `scan-bundle`: download + checksum + manifest parsing live in a single `step.run` rather than separate steps, because Inngest serializes step return values across boundaries and `Buffer` doesn't survive that round-trip.

R2 bundle keys are `bundles/<slug>/<version>/bundle.zip` (`bundleKey()` in `lib/storage/r2.ts`). Two consequences worth knowing: (1) the wizard locks `slug` and `version` in resume/edit mode whenever a bundle has been uploaded — letting either change would orphan the bundle at the old key — and (2) discarding a draft only deletes DB rows; the R2 object is left for bucket lifecycle to garbage-collect.

### Resume, edit, and discard

The dashboard at `/[locale]/publish` shows each draft's stage (`Needs bundle upload` / `Ready to submit` / `Awaiting scan` / etc., derived from `extensionVersions.status` + `bundleFileId` via `rowAction()` in `lib/publish/row-action.ts`). Rows whose latest version is `pending` are clickable and link into `/publish/[id]/edit`, which loads the draft via `getDraft()` and mounts the same `<UploadWizard>` in resume mode — Step 1 form pre-filled, slug/version locked, initial step derived from whether a bundle is uploaded. Step 1's submit calls `updateDraftExtension()` instead of `createDraftExtension()`; the action refuses (`version_not_editable`) once status leaves `pending`.

Each draft row also gets a `<DiscardButton>` that calls `discardDraft()` — owner-checked, draft-visibility-only, hard delete (FK cascades clean up versions/tags/files-row links). `getDraft` and `discardDraft` deliberately collapse non-owner into `not_found` so the public action contract can't be used to probe existence.

### Version state transitions

`lib/extensions/state.ts` owns every transition of `extensionVersions.status`, `files.scanStatus`, and `extensions.visibility`. Three functions:

- `submit(versionId)` — moves a version into `scanning`. Idempotent: accepts `pending` *or* `scanning` as the source state, so a Step 3 retry after a failed `inngest.send` can re-queue the scan instead of getting stuck. Versions in `ready` / `rejected` reject the transition.
- `recordScanResult(versionId, fileId, result)` — applies the outcome of a bundle scan in one transaction; success sets `files.scanStatus='clean' + version.status='ready' + checksumSha256`, failure sets `'flagged' + 'rejected'`. The job calls this once with a discriminated `result`.
- `publishVersion(versionId)` — flips `extensions.visibility='published'` and stamps both rows with `publishedAt`, returning the `extensionId` for the job's downstream `revalidateTag` and `extension/published` event.

`extensions.search_vector` is a Postgres `GENERATED ALWAYS ... STORED` column (see `drizzle/0002_fts_search_vector.sql`); no application code writes it. The `reindex-search` job's earlier hand-rolled `to_tsvector` UPDATE was dead — the generated column always reflects the source content.

### Install (CLI path)

```text
agentcenter install my-skill
  ├─ GET /api/v1/extensions/my-skill                     metadata (name, version, category)
  ├─ GET /api/v1/extensions/my-skill/bundle              302 → signed R2 URL
  ├─ fetch(signed-url)                                   ZIP bytes
  ├─ unzip + write to ~/.claude/skills/my-skill/         (or configured agent path)
  └─ POST /api/v1/installs (Bearer token)                records install event, increments downloadsCount
```

The web "Install" button takes the same conceptual path but goes through the `installExtension` server action instead of the public API: it bumps the same counters and records the same install event, so leaderboards stay consistent across surfaces.

Both surfaces are thin wrappers around `recordInstall` in `lib/installs/record.ts`, which owns: extension lookup (by `id` from the web button or `slug` from the CLI), version resolution (an omitted version means "latest published" — `extension_versions` ordered by `publishedAt DESC` among `status='ready'`), the `installs` row insert, the `installed` collection upsert, and the atomic `downloadsCount` bump — all three writes go through `db.transaction`. Each call records a row, so `downloadsCount` is total install events; the `installed` collection is a separate, idempotent membership concept used by the UI's "Installed" view. Failures throw a typed `InstallError` (`extension_not_found`, `no_published_version`); wrappers translate to their surface (action union or HTTP status).

## Error handling

Server-component throws are caught by App Router `error.tsx` boundaries layered closest-first. Three boundaries today:

- `app/[locale]/extensions/error.tsx` — listing-route boundary. Renders a friendly "couldn't load extensions" empty card with a retry button (calls `reset()`); the locale layout (sidebar + topbar) keeps rendering, so users can navigate away even while the listing is broken.
- `app/[locale]/extensions/[slug]/error.tsx` — detail-route boundary. Same pattern, plus a **Back to marketplace** link alongside Retry — users may not want to retry the same broken slug. `notFound()` from `getExtensionBySlug` is intercepted by the framework and routes to `not-found.tsx`, not here.
- `app/[locale]/error.tsx` — locale-level catchall for any throw the inner boundaries don't cover.

All three render generic copy and surface only `error.digest` (the opaque correlation id) — never `error.message`, since Drizzle's `NeonDbError` and friends embed raw SQL fragments and stack traces that would leak internals to users. Boundary copy lives under `extensions.errorBoundary.*`, `detail.errorBoundary.*`, and `errors.generic.*` in the i18n catalogs.

The boundaries are uniform — there's no per-query `try/catch` in the page components. A transient Neon `fetch failed` is treated the same as any other server-side throw.

## Authentication

Two parallel flows on top of one Better Auth instance:

- **Web** — cookie sessions. `signIn.email()` from `authClient` (`better-auth/react`) sets the cookie; subsequent server components read the session via `getSession()`. Client components subscribe via `authClient.useSession()` for reactive updates.
- **CLI** — device-code flow on top of Better Auth's `verifications` table.
  1. CLI: `POST /api/v1/auth/device/code` → server creates two `verifications` rows (`dc:poll:<deviceCode>` and `dc:user:<userCode>`) and returns the user code.
  2. User: opens `/{locale}/cli/auth` in a browser, signs in, enters the user code; the page resolves user code → device code, marks the poll row authorized, and stores a session token in it.
  3. CLI: polls `POST /api/v1/auth/device/poll` every 5 s. When the row is authorized, the token is returned once and the row is deleted.
  4. CLI persists the token in `~/.config/agentcenter/credentials.json` (mode 0600) and uses it as a `Bearer` for authenticated v1 calls.

The token is a Better Auth session token — the same kind a browser cookie carries — so the same `sessions` table backs both flows.

## API surfaces

| Path | Purpose |
|---|---|
| `/api/auth/[...all]` | Better Auth — session cookies, sign-in, sign-up, sign-out (web) |
| `/api/v1/...` | Public registry API consumed by the CLI ([`api.md`](./api.md)) |
| `/api/upload/sign` | Web-internal — issues an R2 presigned PUT URL for the upload wizard |
| `/api/inngest` | Webhook — Inngest dispatches `scan-bundle` and `reindex-search` here |

Only `/api/v1/*` is treated as a contract; the others are implementation details.

## Data flow at a glance

```text
publish wizard ──→ extensions (draft) ──→ files + extensionVersions ──→ Inngest scan
                                                                           │
                          extensions (published, search_vector) ←──── reindex-search
                                            │
                          listExtensions (browse) ── installExtension / install API
                                                            │
                                                       installs row
                                                       collections "installed"
                                                       downloadsCount++
```

Every write that affects what users see in the listing (publish, install) ends with a `revalidateTag` so the next browse render hits fresh data.
