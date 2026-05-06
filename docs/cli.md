# CLI

The AgentCenter CLI is a single Bun-built binary that installs extensions from the registry into your local agent runtime. It defaults to Claude (`~/.claude/...`) but is agent-agnostic — point it elsewhere via `agentcenter config set agent <name>`.

This guide is organized as flows. For an exhaustive flag list, run `agentcenter <command> --help`.

## Install the CLI

The CLI lives at `cli/` in the repo. There's no npm release yet — build from source:

```bash
cd cli
bun install
bun run build
# Produces: cli/dist/agentcenter (single binary, ~40 MB)

# Either run it directly or symlink onto your PATH:
ln -s "$(pwd)/dist/agentcenter" ~/.local/bin/agentcenter
agentcenter --version
```

For local development without building, `bun run dev <command>` runs the TypeScript source directly (e.g. `bun run dev install web-search`).

## First-time setup: log in

```bash
agentcenter login
```

The CLI:

1. Asks the registry for a device code via `POST /api/v1/auth/device/code`.
2. Prints a short user code and the verification URL, then opens the URL in your browser (best-effort).
3. Polls every 5 s until you authorize the code in the browser, the code expires (10 min), or you Ctrl-C.
4. On success, fetches your profile and writes credentials to `~/.config/agentcenter/credentials.json` (mode 0600).

Output looks like this:

```text
Open the following URL in your browser and enter the code below:

  https://agentcenter.app/cli/auth

  Code: ABCD-1234

Waiting for authorization.....
Signed in as alice@example.com (Alice Bob)
```

Verify with `agentcenter whoami`. Sign out with `agentcenter logout`.

## Install an extension

```bash
agentcenter install <slug>
```

The CLI:

1. Resolves the extension via `GET /api/v1/extensions/:slug`.
2. Asks for the bundle via `GET /api/v1/extensions/:slug/bundle` — gets back a 302 to a signed R2 URL.
3. Downloads the bundle ZIP.
4. Unzips it under your install directory (defaults to `~/.claude/<category>/<slug>/`, see [Configuration](#configuration)).
5. Posts an install event to `POST /api/v1/installs` so the registry can bump `downloadsCount` and add the extension to your `installed` collection. This call is best-effort — if the registry is unreachable, the local install still succeeds.

Use `--dry-run` to resolve the bundle URL and category without writing any files:

```bash
agentcenter install web-search --dry-run
```

You don't need to be logged in to install — only the install-event POST requires auth, and it's silently skipped if no token is on disk.

## List and uninstall

```bash
agentcenter list           # alias: agentcenter ls
agentcenter uninstall <slug>
```

`list` reads the local install directory and prints installed slugs. `uninstall` removes the directory; if the registry is reachable it'll consult the metadata first to find the right category, otherwise it falls back to the default category (`skills`).

## Configuration

Config lives at `~/.config/agentcenter/config.toml`. Two top-level keys today:

| Key | Default | Purpose |
|---|---|---|
| `registry` | `https://agentcenter.app` | Registry base URL — change to point at staging or a self-hosted instance |
| `agent` | `claude` | Agent name; reserved for future per-agent install paths |

Inspect and modify via the `config` subcommand:

```bash
agentcenter config list                      # alias: agentcenter config ls
agentcenter config get registry
agentcenter config set registry https://staging.agentcenter.app
agentcenter config reset                     # back to defaults
```

You can also set `installDir` to override the default path:

```bash
agentcenter config set installDir /opt/claude
```

## Files the CLI writes

| Path | What |
|---|---|
| `~/.config/agentcenter/credentials.json` | Session token + cached email/name (mode 0600) |
| `~/.config/agentcenter/config.toml` | TOML configuration |
| `~/.claude/<category>/<slug>/...` | Default install location for extensions |

`credentials.json` is the only file that contains a secret. Treat it like an SSH key.

## Troubleshooting

### `Authorization timed out or was denied`

The user code is valid for 10 minutes. Run `agentcenter login` again.

### `Bundle not yet available for "<slug>"`

The extension exists but no version has reached `ready` status — either the upload is still being scanned, or the scan failed. Wait a minute and retry, or check the extension's detail page for status.

### `Registry error: 401`

Your stored token has expired or been revoked. Run `agentcenter logout` then `agentcenter login`.

### `Network error during install`

The actual download is direct from R2 via a signed URL, so transient errors here usually mean a flaky network rather than a registry problem. Retry.

## What the CLI does *not* do (yet)

- Does not check version constraints from `compatibilityJson` against your runtime.
- Does not support pinning an extension to a specific version (`<slug>@<version>`).
- Does not warn before overwriting a previously installed copy.
- Does not stream a progress bar during downloads — you get a single `Downloading...` line.

These are tracked in [`plan.md`](./plan.md).
