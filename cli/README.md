# AgentCenter CLI

Install and manage AI agent extensions from [AgentCenter](https://agentcenter.app).

## Installation

```bash
npm install -g @agentcenter/cli
# or
bun add -g @agentcenter/cli
```

## Commands

### Authentication

```bash
agentcenter login       # sign in via browser (device-code flow)
agentcenter logout      # clear stored credentials
agentcenter whoami      # show the signed-in account
```

### Extensions

```bash
agentcenter install <slug>        # download and install an extension
agentcenter install <slug> --dry-run   # preview without writing files
agentcenter uninstall <slug>      # remove an installed extension
agentcenter list                  # list locally installed extensions
```

### Configuration

```bash
agentcenter config list           # show all config values
agentcenter config get <key>      # print one value
agentcenter config set <key> <value>   # update a value
agentcenter config reset          # restore defaults
```

#### Config keys

| Key        | Default                      | Description                       |
| ---------- | ---------------------------- | --------------------------------- |
| `registry` | `https://agentcenter.app`    | Registry base URL                 |
| `agent`    | `claude`                     | Target agent (`claude`, `cursor`, …) |

## Storage

| Path                                      | Contents                  |
| ----------------------------------------- | ------------------------- |
| `~/.config/agentcenter/config.toml`       | CLI configuration         |
| `~/.config/agentcenter/credentials.json`  | Auth token (chmod 600)    |
| `~/.claude/skills/<slug>/`                | Installed skill bundles   |

## Building from source

```bash
bun install
bun run build    # produces dist/agentcenter
```
