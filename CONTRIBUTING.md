# Contributing

## Workflow

All changes go through a feature branch and a pull request. There is no direct-to-`main` work.

```bash
git checkout main && git pull
git checkout -b <type>/<short-name>     # see "Branch names" below

# ... make your changes ...

bun run validate                        # lint + typecheck + tests, mirrors CI
git push -u origin HEAD
gh pr create                            # or open via the GitHub UI
```

### Branch names

Use a short type prefix matching the kind of work, then a hyphenated name:

- `feat/<name>` — new feature
- `fix/<name>` — bug fix
- `refactor/<name>` — refactor without behaviour change
- `test/<name>` — test-only changes
- `docs/<name>` — documentation only
- `chore/<name>` — tooling, dependency bumps, configuration

The `<name>` should describe the area, not the ticket — e.g. `fix/sidebar-i18n`, not `fix/issue-42`.

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/). One coherent unit per commit; split when natural. For multi-phase work, scope by phase: `feat(p10-publish): upload wizard`.

```text
<type>(<scope>): <one-line summary>

<optional body — explain why, not what; reference incidents or invariants
that wouldn't be obvious from the diff>
```

Don't:

- Use `git commit --amend` once a commit is on a pushed branch.
- Force-push (`--force`, `--force-with-lease`).
- Skip hooks (`--no-verify`).

If you need to undo work after pushing, prefer a corrective commit over rewriting history.

### Pull requests

The PR title should be a Conventional Commit summary. The body should cover:

- **Summary** — what changed, in 1–3 bullets
- **Test plan** — what you ran locally / what reviewers should verify

For non-trivial changes, also include:

- **Why** — motivation, constraints, or what bug/incident this addresses
- **Tradeoffs** — alternatives you considered and why this one won

CI runs on every push to a PR (`.github/workflows/ci.yml` — lint, typecheck, vitest). [CodeRabbit](https://www.coderabbit.ai) leaves an automated review. Address its findings before merging; "minor" findings can be deferred with a brief reply explaining why.

### Local validation

Run `bun run validate` before pushing. It runs the same three checks CI runs in the same order:

```bash
bun run lint
bun run typecheck
bun run test
```

E2E tests (`bun run test:e2e`) require a live dev server with a seeded database — run them locally on demand, not on every PR. They run nightly in [`.github/workflows/e2e.yml`](./.github/workflows/e2e.yml).

## Project conventions

### Locked product decisions

A handful of product/architecture decisions are locked for v1 and shouldn't be revisited inside a normal PR. They're listed in [`CLAUDE.md`](./CLAUDE.md#locked-product-decisions). If a PR needs to change one, update `CLAUDE.md` and `docs/PLAN.md` in the same commit as the code change.

### Tests live next to the code

- `lib/**/*.test.ts` and `cli/**/*.test.ts` — unit tests, colocated with their source
- `components/**/*.test.tsx` — component tests, colocated, run in happy-dom
- `tests/e2e/**/*.spec.ts` — Playwright E2E

When you add code under `lib/`, `cli/`, or `components/`, add or update its colocated test file. The vitest glob picks them up automatically.

### Style

- TypeScript strict — no `any` unless there's a specific reason and a comment.
- Prefer editing existing files over creating new ones.
- No comments unless the *why* is non-obvious. Don't explain what the code does — name things well instead.
- Match the project's terse, factual voice in code, commits, and PR descriptions. No marketing language.

## Getting help

- Architecture and phase plan: [`docs/PLAN.md`](./docs/PLAN.md)
- Deployment runbook: [`docs/DEPLOY.md`](./docs/DEPLOY.md)
- Manifest spec: [`docs/manifest-spec.md`](./docs/manifest-spec.md)
- Project rules (also followed by AI agents): [`CLAUDE.md`](./CLAUDE.md)
