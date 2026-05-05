# AgentCenter

Internal-flavored marketplace for AI agent extensions: Skills, MCP servers, slash commands, plugins. Bilingual (EN/ZH) from day one. See `docs/PLAN.md` for the full implementation plan and milestone schedule.

## Tech stack

- TypeScript, Next.js 16 (App Router, RSC, Turbopack dev), Tailwind CSS v4, shadcn/ui + Radix
  - Next 16 has breaking changes from earlier versions; consult `node_modules/next/dist/docs/` and the project's top-level `AGENTS.md` before writing Next-specific code.
- Bun for local dev and CLI build; Vercel + Node runtime for the web app in prod
- PostgreSQL (Neon hosted) with Drizzle ORM
- Better Auth (cookie sessions, Drizzle adapter)
- Cloudflare R2 for bundle storage
- Inngest for background jobs (scan, index, publish)
- next-intl for i18n; locales `en` (default) + `zh`, always-prefixed URLs (`/en/...`, `/zh/...`)
- Fonts via `next/font`: Inter (UI), Fraunces (display, italic), JetBrains Mono (tags/counts)
- Postgres FTS + `pg_trgm` for search; Meilisearch deferred

## Locked product decisions

1. **Multi-tenant schema, single-tenant UI** for v1.
2. **Themes**: Editorial Ivory (default) + Dark. Mono Clean dropped.
3. **Filter UI**: Mode B (drawer-style multi-row) only. Modes A/C in the prototype were comparison scaffolding.
4. **Sign-up**: open. SSO/invite-only later if needed.
5. **Locale URLs**: always prefixed; no implicit default.
6. **Detail page README**: raw markdown stored, server-rendered with `react-markdown` + `rehype-sanitize`. Manifest metadata (homepage, repo, license, compatibility, screenshots) rendered as a side panel.
7. **Install button**: triggers real install via the Agent CLI. Web records install events; the CLI does the work.
8. **Agent CLI**: agent-agnostic with Claude-first defaults. Extensions declare destination paths per agent in their manifest; user can override via `agentcenter config set`. Default target: `~/.claude/...`. Distributed via npm (Bun-built binary).
9. **Department IDs**: dotted-path text PKs (e.g. `eng.cloud.infra`). Descendant filter is a single `LIKE 'parent.%'` predicate, not a recursive CTE.
10. **Dynamic content i18n**: column-per-language (`name` + `nameZh`, `description` + `descriptionZh`). `tags` table carries `labelEn` + `labelZh`.

## Workflow

- **Commit per coherent unit** — roughly one per phase, split when natural. Conventional-commits style with phase scope: `feat(p2-db): drizzle schema + seed data`.
- Before each commit, surface a diff summary and proposed commit message. Wait for explicit go-ahead before running `git commit`.
- At the end of each phase, pause for an explicit checkpoint before starting the next phase.
- No `--amend`, no force-push, no `--no-verify`. Corrective commits over history rewrites.
- Work on `main` directly (solo project, empty repo). Switch to feature branches + PRs only on request.
- When a binding decision changes, update `docs/PLAN.md` in the same commit as the code change.

## Project structure (target)

See `docs/PLAN.md` §1 for the full tree. High-level layout:

- `app/[locale]/...` — App Router pages, locale-segmented
- `app/api/...` — Better Auth handler, R2 presigned upload, install events, Inngest webhook, public registry API (`/api/v1/...`) used by the CLI
- `components/{ui,layout,extension,filters,publish}` — UI components
- `lib/{db,auth,i18n,storage,jobs,search,validators}` — server-side infra
- `cli/` — separate Bun-built binary, ships in Phase 9 (agent-agnostic, Claude-first defaults)
- `drizzle/` — generated migrations
- `docs/` — plan, ADRs, manifest spec

## Design references

The original prototype lives outside this repo at `/tmp/agentcenter-design/` (extracted from a Claude Design handoff bundle). Key files:

- `agentcenter/project/AgentCenter v2.html` — the primary design (1641 lines, Editorial Ivory aesthetic, Mode B filters)
- `agentcenter/chats/chat1.md` — full design conversation, including the iteration history that produced the locked decisions

These are reference-only. Production components recreate the design in React/Tailwind, not by copying the prototype's inline styles.
