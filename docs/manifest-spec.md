# AgentCenter Extension Manifest Spec

Every extension bundle (`.zip`) **must** contain a `manifest.toml` at the archive root.
The manifest declares identity, discoverability, compatibility, and per-agent install targets.

---

## Top-level sections

### `[extension]` — required

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | ✓ | URL-safe identifier, unique across the registry. Pattern: `[a-z0-9-]+`, max 64 chars. |
| `name` | string | ✓ | Display name in English. |
| `nameZh` | string | | Display name in Chinese (optional bilingual). |
| `version` | string | ✓ | Semver (e.g. `1.0.0`). |
| `category` | enum | ✓ | One of `skills`, `mcp`, `slash`, `plugins`. |
| `scope` | enum | ✓ | Audience: `personal`, `org`, `enterprise`. |
| `license` | string | | SPDX identifier (e.g. `MIT`, `Apache-2.0`). Omit for proprietary. |
| `description` | string | ✓ | Short description in English, max 280 chars. |
| `descriptionZh` | string | | Short description in Chinese. |
| `tagline` | string | | One-line tagline shown in the featured banner. |
| `tags` | string[] | | Tag slugs from the registry vocabulary (see Tags below). |

### `[categorization]` — required

| Field | Type | Description |
|---|---|---|
| `funcCat` | enum | Functional category: `workTask`, `business`, `tools`. |
| `subCat` | string | L1 subcategory key (e.g. `softDev`, `systemDesign`). |
| `l2` | string | L2 sub-subcategory key (e.g. `backend`, `frontend`). Optional. |

### `[links]` — optional

| Field | Type | Description |
|---|---|---|
| `homepage` | URL | Public homepage or docs site. |
| `repo` | URL | Source repository (GitHub, GitLab, etc.). |

### `[compatibility]` — optional

| Field | Type | Description |
|---|---|---|
| `minAgentVersion` | string | Minimum agent version required (semver, e.g. `0.8.0`). |
| `os` | string[] | Restrict to OS list: `darwin`, `linux`, `windows`. Omit = all. |

### `[install.<agent>]` — at least one required

Declares per-agent install destinations. The CLI reads the profile that matches
`agentcenter config get agent` (default: `claude`).

**Skills** (`category = "skills"`):

```toml
[install.claude]
skills = "~/.claude/skills/{slug}"
```

**MCP Servers** (`category = "mcp"`):

```toml
[install.claude]
mcpConfig = "~/.claude/claude_desktop_config.json"
mcpKey    = "{slug}"
```

**Slash Commands** (`category = "slash"`):

```toml
[install.claude]
commands = "~/.claude/commands/{slug}.md"
```

**Plugins** (`category = "plugins"`):

```toml
[install.claude]
plugins = "~/.claude/plugins/{slug}"
```

Path tokens:

| Token | Expands to |
|---|---|
| `{slug}` | Extension slug |
| `{version}` | Installed version |
| `{agent}` | Active agent profile name |

Optional `[install.<agent>.postInstall]`:

```toml
[install.claude.postInstall]
message = "Set your API key: agentcenter config set {slug}.apiKey <key>"
```

---

## Full example

```toml
[extension]
slug        = "web-search-pro"
name        = "Web Search Pro"
nameZh      = "网页搜索增强"
version     = "1.2.0"
category    = "skills"
scope       = "org"
license     = "MIT"
description = "Real-time web search integration for Claude via the Brave Search API."
descriptionZh = "为 Claude 接入 Brave 搜索 API，提供实时网页搜索能力。"
tagline     = "Search the web, right inside Claude."
tags        = ["search", "real-time", "stable"]

[categorization]
funcCat = "workTask"
subCat  = "softDev"
l2      = "backend"

[links]
homepage = "https://example.com/web-search-pro"
repo     = "https://github.com/example/web-search-pro"

[compatibility]
minAgentVersion = "0.8.0"
os = ["darwin", "linux"]

[install.claude]
skills = "~/.claude/skills/{slug}"

[install.claude.postInstall]
message = "Add your Brave API key: agentcenter config set web-search-pro.apiKey <your-key>"
```

---

## Bundle structure

```
web-search-pro-1.2.0.zip
├── manifest.toml       ← required, at archive root
├── skill.md            ← skill definition (for category=skills)
├── README.md           ← optional, rendered on detail page
└── assets/             ← optional supporting files
```

For `category = mcp`, include a `server.js` / `server.py` or equivalent binary.
For `category = slash`, include the command markdown file(s).
For `category = plugins`, include the plugin entry point per agent conventions.

---

## Tags vocabulary

Tags are defined in `lib/tags.ts`. Current set (32 tags):

`ai-native` `analytics` `automation` `ci-cd` `cloud` `code-gen` `code-review`
`data` `deployment` `devops` `document` `embedded` `enterprise` `grpc`
`http` `infra` `integration` `llm` `monitoring` `mqtt` `network` `open-source`
`performance` `personal` `real-time` `search` `security` `stable` `testing`
`translation` `ui` `version-control`

---

## Versioning rules

- Versions must be valid semver.
- Re-publishing the same `slug@version` is rejected (immutable releases).
- A new `version` is required for every update.
- The registry always serves the **latest published** version at `GET /api/v1/extensions/:slug`.
  Future `/api/v1/extensions/:slug/versions` endpoint will list history.
