# AgentCenter

A bilingual (EN/ZH) marketplace for AI agent extensions — Skills, MCP servers, slash commands, and plugins. Browse, search, and install extensions through the web UI; install them into your agent runtime through the companion CLI.

> Status: under active development. The web app and CLI are functional; the manifest spec, deployment guide, and full implementation plan are tracked under [`docs/`](./docs).

## What's in here

- **Web app** — browse, filter, and view extension detail pages; publish and manage your own extensions; bilingual UI with always-prefixed locales (`/en/...`, `/zh/...`)
- **CLI** — agent-agnostic installer with Claude-first defaults; logs in via device-code flow, installs extensions to `~/.claude/...` (or a path you configure)
- **Public registry API** — the `/api/v1/...` surface the CLI talks to

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Turbopack dev) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Radix |
| Runtime | Bun (local dev, CLI build); Node on Vercel (production) |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Auth | Better Auth (cookie sessions, Drizzle adapter) |
| Storage | Cloudflare R2 (bundle ZIPs, presigned PUT) |
| Background jobs | Inngest (scan, index, publish) |
| i18n | next-intl, locales `en` + `zh` |
| Search | Postgres FTS + `pg_trgm` |

## Project layout

```text
app/[locale]/...   # App Router pages, locale-segmented
app/api/...        # Better Auth, R2 presign, Inngest webhook, public registry API
components/        # ui / layout / extension / filters / publish
lib/               # db / auth / i18n / storage / jobs / search / validators
cli/               # standalone Bun-built CLI binary
drizzle/           # generated migrations
tests/             # E2E (Playwright) and integration suites
docs/              # plan, deployment guide, manifest spec
```

## Quickstart

```bash
# 1. Install dependencies
bun install

# 2. Provision a Neon (or local) Postgres database and copy the URL
cp .env.local.example .env.local   # then fill in DATABASE_URL etc.

# 3. Run migrations + seed sample data
bun run db:migrate
bun run db:seed

# 4. Start the dev server
bun run dev
```

Open <http://localhost:3000>. The minimum env vars needed for local dev are listed in [`docs/deploy.md`](./docs/deploy.md#5-local-development).

To work on the CLI:

```bash
cd cli
bun run dev login          # device-code flow
bun run dev install <slug>
bun run dev list
```

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Next.js dev server with Turbopack |
| `bun run build` | Production build |
| `bun run start` | Run the production build |
| `bun run lint` | ESLint over `app/`, `components/`, `lib/`, `scripts/` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Vitest unit + component tests |
| `bun run test:watch` | Vitest watch mode |
| `bun run test:coverage` | Vitest with v8 coverage |
| `bun run test:e2e` | Playwright E2E (needs a running dev server with seed data) |
| `bun run validate` | `lint -> typecheck -> test`, mirroring CI |
| `bun run db:migrate` | Apply Drizzle migrations |
| `bun run db:seed` | Seed sample extensions and tags |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run r2:cors` | Apply R2 bucket CORS rules |

## Documentation

- [`docs/architecture.md`](./docs/architecture.md) — how the pieces fit together (RSC layout, request flows, jobs, auth, CLI ↔ web)
- [`docs/api.md`](./docs/api.md) — public registry API (`/api/v1/...`) consumed by the CLI
- [`docs/cli.md`](./docs/cli.md) — CLI usage guide (login, install, configuration)
- [`docs/manifest-spec.md`](./docs/manifest-spec.md) — extension manifest format
- [`docs/plan.md`](./docs/plan.md) — implementation plan, phase schedule, locked product decisions
- [`docs/deploy.md`](./docs/deploy.md) — Neon, Cloudflare R2, Inngest, Vercel setup runbook
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — workflow, commit conventions, how to open a PR
- [`CLAUDE.md`](./CLAUDE.md) — project rules and decisions (also consumed by AI coding agents)

## Workflow

All changes go through a feature branch and a pull request. `bun run validate` mirrors what CI runs on every PR (lint, typecheck, test). See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for details.
