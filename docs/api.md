# Public registry API

The `/api/v1/*` surface is the contract between the web app and the CLI (or any third-party tool that wants to talk to AgentCenter). Other API routes (`/api/auth`, `/api/upload/sign`, `/api/inngest`) are implementation details and are not documented here.

All paths are relative to the registry base URL — `https://agentcenter.app` in production, or whatever `registry` value is set in the CLI's `~/.config/agentcenter/config.toml`.

## Conventions

- Content type is JSON unless otherwise noted.
- All write endpoints require `Authorization: Bearer <token>`. The token is obtained via the device-code flow ([`POST /auth/device/code`](#post-apiv1authdevicecode)).
- Errors return JSON with the shape `{ "error": "<code>", "message": "<human-readable>" }` and a 4xx/5xx status. Common codes: `unauthenticated` (401), `not_found` (404), `invalid_body` (400), `bundle_unavailable` (503), `server_error` (500).
- Listing endpoints set `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

## Authentication — device code flow

The CLI is headless. It exchanges a short-lived **device code** (server-side, opaque) for a **user code** (short, human-readable) the user types into the browser. Once the user authorizes, the CLI polls for a session token.

### `POST /api/v1/auth/device/code`

Start a login. No auth required.

**Response**

```json
{
  "deviceCode": "f9b6c63a-…",
  "userCode": "ABCD-1234",
  "verificationUri": "/cli/auth",
  "expiresIn": 600
}
```

The `verificationUri` is a path on the registry; the CLI is expected to combine it with the registry base URL and open it in the user's browser.

### `POST /api/v1/auth/device/poll`

Poll for authorization. No auth required. The CLI polls every 5 s.

**Request**

```json
{ "deviceCode": "f9b6c63a-…" }
```

**Response — pending**

```json
{ "status": "pending" }
```

**Response — authorized** (returned exactly once; the row is then deleted)

```json
{ "status": "authorized", "token": "<session-token>" }
```

**Response — expired or unknown**

```json
{ "status": "expired" }
```

The `token` is a Better Auth session token. The CLI stores it in `~/.config/agentcenter/credentials.json` (mode 0600) and sends it as `Authorization: Bearer <token>` on subsequent calls.

## Extensions

### `GET /api/v1/extensions`

List published extensions. No auth required.

**Query parameters** (all optional)

| Param | Type | Description |
|---|---|---|
| `q` | string | Free-text search (Postgres FTS + `pg_trgm`) |
| `category` | `skills` \| `mcp` \| `slash` \| `plugins` | Filter by extension category |
| `scope` | `personal` \| `org` \| `enterprise` | Filter by scope |
| `funcCat` | `workTask` \| `business` \| `tools` | Filter by functional category |
| `subCat` | string | Filter by L1 subcategory |
| `tags` | comma-separated | e.g. `tags=search,api` |
| `tagMatch` | `any` \| `all` | Tag match mode (default `any`) |
| `filter` | `official` \| `trending` \| `new` | Curated filter |
| `sort` | `downloads` \| `stars` \| `recent` | Sort order (default `downloads`) |
| `page` | integer ≥ 1 | Page number, page size is fixed at 24 |

**Response**

```json
{
  "items": [
    {
      "slug": "web-search",
      "name": "Web Search",
      "nameZh": "网页搜索",
      "category": "skills",
      "scope": "personal",
      "badge": "official",
      "description": "Search the web from your agent.",
      "descriptionZh": "在你的智能体中搜索网页。",
      "tags": ["search", "api"],
      "funcCat": "workTask",
      "subCat": "softDev",
      "l2": "frontend",
      "downloadsCount": 1248,
      "starsAvg": "4.7"
    }
  ],
  "total": 87,
  "page": 1,
  "pageSize": 24
}
```

### `GET /api/v1/extensions/:slug`

Full metadata for a single extension. No auth required.

**Response**

```json
{
  "slug": "web-search",
  "name": "Web Search",
  "nameZh": "网页搜索",
  "category": "skills",
  "scope": "personal",
  "badge": "official",
  "tagline": "One-line tagline",
  "description": "Longer description.",
  "descriptionZh": "更长的描述。",
  "tags": ["search", "api"],
  "funcCat": "workTask",
  "subCat": "softDev",
  "l2": "frontend",
  "license": "MIT",
  "homepageUrl": "https://example.com",
  "repoUrl": "https://github.com/example/web-search",
  "compatibilityJson": { "agent": "claude", "minVersion": "1.0" },
  "downloadsCount": 1248,
  "starsAvg": "4.7",
  "ratingsCount": 42,
  "publishedAt": "2026-01-15T08:30:00.000Z",
  "version": "latest",
  "bundleUrl": "/api/v1/extensions/web-search/bundle"
}
```

`version` is currently the literal string `"latest"`; full version history is not yet exposed.

`bundleUrl` is a relative path to [`GET /api/v1/extensions/:slug/bundle`](#get-apiv1extensionsslugbundle) — clients should resolve it against the registry base URL.

**Errors**

- `404 not_found` — slug doesn't exist or isn't published.

### `GET /api/v1/extensions/:slug/bundle`

Download the latest ready bundle. No auth required. Returns a **302 redirect** to a Cloudflare R2 signed URL — clients should follow it (or read the `Location` header if they want to log the URL).

**Errors**

- `404 not_found` — slug doesn't exist.
- `503 bundle_unavailable` — extension exists but no version has reached `ready` status (still scanning, or scan failed).

The signed URL is valid for ~5 minutes. Clients should fetch the bundle immediately rather than caching the redirect.

## Installs

### `POST /api/v1/installs`

Record a successful install. **Requires** `Authorization: Bearer <token>`.

The CLI calls this *after* it has unzipped the bundle and written files locally — so even if the registry is unreachable at install time, the local install still succeeds.

**Request**

```json
{
  "extensionSlug": "web-search",
  "version": "1.2.0",
  "agentName": "claude",
  "agentVersion": "1.0.4"
}
```

`agentName` and `agentVersion` are informational — stored for analytics but not validated against an agent registry.

**Response**

```json
{
  "ok": true,
  "installId": "9f2d…",
  "isFirstInstall": true,
  "version": "1.2.0"
}
```

Every call records an `installs` row and bumps `downloadsCount`. `isFirstInstall` is `true` when this user has no prior install record for this extension; subsequent reinstalls and version upgrades return `false`. `version` is the resolved semver — if the request omitted `version` (or sent the legacy `"latest"` sentinel), this is the latest published version at the moment of install.

**Errors**

- `401 unauthenticated` — missing or invalid Bearer token.
- `400 invalid_body` — body failed schema validation.
- `404 not_found` — slug doesn't exist.
- `422 no_published_version` — slug exists but has no `ready` version yet (only possible when `version` is omitted).
- `500 internal_error` — unhandled server error.

## Versioning

The surface above is `/api/v1`. Breaking changes will introduce `/api/v2/...` — the `v1` namespace will not change incompatibly. Additive changes (new optional fields, new endpoints) may land within `v1` without notice.
