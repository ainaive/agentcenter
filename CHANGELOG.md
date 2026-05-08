# Changelog

All notable changes to AgentCenter and the bundled `@agentcenter/cli` are
recorded here. Versions follow [Semantic Versioning](https://semver.org).

## [0.2.0] — 2026-05-08

Internal-quality release. No new product features; four targeted refactors
that consolidated duplicated logic, tightened correctness, and removed
dead code, plus the matching test additions and doc refreshes.

### Refactored

- **Install recording** (#4) — Web button (`installExtension` server
  action) and CLI route (`POST /api/v1/installs`) now both delegate to
  one `recordInstall` module in `lib/installs/record.ts`. The module
  owns extension lookup (by `id` or `slug`), version resolution
  (omitted ⇒ latest published, ordered by `publishedAt DESC,
  createdAt DESC`), the `installs` insert, the `Installed` collection
  upsert, and the atomic `downloadsCount` increment — all three writes
  inside one `db.transaction`. Throws typed `InstallError`; wrappers
  translate to surface (action union or HTTP status).
- **Version lifecycle** (#4) — Three transitions of `extensionVersions.status`,
  `files.scanStatus`, and `extensions.visibility` consolidated in
  `lib/extensions/state.ts`: `submit(versionId)` (pending→scanning),
  `recordScanResult(versionId, fileId, result)` (scanning→ready|rejected),
  and `publishVersion(versionId)` (ready→published, stamps `publishedAt`).
  All three enforce source-state preconditions, throwing
  `VersionStateError` when refused; `scan-bundle.ts` catches and treats
  as no-op so duplicate Inngest deliveries don't poison terminal state.
- **Manifest schema** (#6) — `lib/validators/manifest.ts` exports a
  single `ExtensionManifestCore` mirroring `docs/manifest-spec.md`. The
  form schema (`ManifestFormSchema`) and bundle schema
  (`BundleManifestSchema`) both derive from it. Closes drift between
  the two old schemas (slug max 80 vs 64, description 300 vs 280, name
  min 2 vs 1, missing fields).
- **Filter hook** (#8) — `useFilterUrl`'s untyped `get/set/getMulti/setMulti`
  replaced by typed `useFilters()` returning `{ filters, update, pending }`.
  String-key typos at the component layer are now compile errors.
  Comma-encoding for `tags` lives in one place.

### Behaviour changes

- **`installs.version` no longer contains the literal string `"latest"`.**
  Web installs now record the resolved semver. The CLI route still
  accepts `"latest"` from older clients and translates it to "resolve
  internally."
- **`downloadsCount` semantics shift from "distinct users who installed"
  to "total install events."** Every install records a row and bumps
  the counter; the `Installed` collection is now a separate idempotent
  membership concept used by the UI's "Installed" view.
- **CLI `downloadsCount` increment is now atomic** — the route used to
  do read-then-write, which could lose updates under concurrent
  installs. Both surfaces now go through `sql\`+ 1\``.
- **Bundle scan validation tightens to the spec.** Bundles with 1-char
  names, missing descriptions, or slugs that fail the regex are now
  rejected at scan time; previously the form schema enforced these,
  the bundle schema didn't.
- **Form description is now required** to match the manifest spec.

### Fixed

- **Dead `to_tsvector` UPDATE removed from `reindex-search.ts`** — the
  `extensions.search_vector` column has been a Postgres `GENERATED
  ALWAYS … STORED` column since the P12 migration, so the hand-rolled
  UPDATE always threw and the catch-block fallback (plain visibility
  flip) was the only path that ran. Postgres maintains the column from
  source content automatically; no application write is needed.
- **`useFilters` preserves duplicate query keys** — a URL with
  `?tags=a&tags=b` (two separate params instead of one comma-joined)
  used to silently drop the first value. The same pre-existing issue
  was in the old `useFilterUrl.get()`.
- **Form `validate()` mirrors schema constraints** — short slugs (1–2
  chars) and 1-char names used to pass the form's hand-rolled
  `validate()`, then fail server-side. Now caught inline.

### CLI

- The CLI's response handling for `POST /api/v1/installs` continues to
  use a fire-and-forget pattern; the response shape change
  (`{ ok, alreadyInstalled }` → `{ ok, installId, isFirstInstall, version }`)
  is documented in `docs/api.md` but does not affect the bundled CLI.

### Tests

182 tests (was ~120 at start of session). New coverage on:
`lib/installs/record.test.ts`, `lib/extensions/state.test.ts`,
`lib/validators/manifest.test.ts` (rewritten),
`lib/validators/filters.test.ts` (expanded), `lib/hooks/use-filters.test.ts`.

## [0.1.0] — 2026-04 (initial)

Internal v1 — Phases 0–13 of `docs/plan.md`. Browse, detail, publish,
auth, collections, install events, public registry API, CLI v1
(skills only), upload wizard, background jobs, FTS.
