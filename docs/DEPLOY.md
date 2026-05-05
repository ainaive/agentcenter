# Deployment Guide

AgentCenter deploys to **Vercel** (web app) with **Neon** (Postgres), **Cloudflare R2** (bundle storage), and **Inngest** (background jobs).

---

## Prerequisites

| Service | What you need |
|---|---|
| [Vercel](https://vercel.com) | Account + project connected to this repo |
| [Neon](https://neon.tech) | Project + connection string |
| [Cloudflare R2](https://dash.cloudflare.com) | Bucket + API token with Object Read & Write |
| [Inngest](https://app.inngest.com) | Account + event key + signing key |

---

## 1. Neon — database setup

1. Create a Neon project in the **US East** region (matches Vercel `iad1`).
2. Copy the **pooled** connection string from the Neon dashboard (Pooler tab).  
   It looks like: `postgresql://user:pass@ep-xxx-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
3. Run the initial migrations (once):
   ```bash
   # From the repo root, with DATABASE_URL set in your shell or .env.local
   bun run db:migrate
   ```
4. Run the FTS migration (once, after `db:migrate`):
   ```bash
   psql $DATABASE_URL < drizzle/0002_fts_search_vector.sql
   ```
   Or paste the file contents into the **Neon SQL Editor**.
5. Seed reference data (optional, loads sample extensions):
   ```bash
   bun run db:seed
   ```

---

## 2. Cloudflare R2 — bucket + CORS

### Create the bucket

1. Go to **Cloudflare dashboard → R2 → Create bucket**.
2. Name it `agentcenter-bundles` (or update `R2_BUCKET` env var to match).
3. Region: automatic (Cloudflare places it closest to users).

### Create an API token

1. R2 → **Manage R2 API Tokens → Create API Token**.
2. Permissions: **Object Read & Write** scoped to the bucket.
3. Copy **Access Key ID** and **Secret Access Key**.
4. Copy your **Cloudflare Account ID** from the R2 overview page.

### Apply CORS rules

Run this once after the bucket is created, and again if the production domain changes:

```bash
R2_ACCOUNT_ID=xxx \
R2_ACCESS_KEY_ID=xxx \
R2_SECRET_ACCESS_KEY=xxx \
R2_BUCKET=agentcenter-bundles \
PRODUCTION_URL=https://yourdomain.com \
bun run r2:cors
```

This allows browsers on `localhost:3000`, `*.vercel.app`, and your production domain to `PUT` bundles directly to R2 via presigned URLs.

---

## 3. Inngest — background jobs

1. Create an Inngest account and a new **app**.
2. Copy the **Event Key** and **Signing Key** from the app settings.
3. After deploying to Vercel, register the webhook URL in the Inngest dashboard:
   ```
   https://yourdomain.com/api/inngest
   ```
   Inngest will verify it by calling the endpoint. The scan-bundle and reindex-search functions will appear as registered functions.

---

## 4. Vercel — deploy

### Connect the repo

1. Vercel → **Add New Project** → import this GitHub repo.
2. Vercel auto-detects Next.js and reads `vercel.json` — no framework config needed.

### Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `BETTER_AUTH_URL` | `https://yourdomain.com` |
| `BETTER_AUTH_SECRET` | Random 32+ char string (use `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET` | `agentcenter-bundles` (or your bucket name) |
| `INNGEST_EVENT_KEY` | From Inngest app settings |
| `INNGEST_SIGNING_KEY` | From Inngest app settings |

For **Preview deployments** use the same values, or point `DATABASE_URL` at a separate Neon branch.

### Deploy

Push to `main` — Vercel builds automatically. First deploy checklist:

- [ ] All env vars set
- [ ] `bun run db:migrate` run against Neon
- [ ] `drizzle/0002_fts_search_vector.sql` applied to Neon
- [ ] R2 CORS rules applied (`bun run r2:cors`)
- [ ] Inngest webhook URL registered

---

## 5. Local development

```bash
# 1. Install dependencies
bun install

# 2. Copy and fill in env vars
cp .env.local.example .env.local   # or create .env.local manually (see below)

# 3. Run migrations
bun run db:migrate

# 4. Seed sample data (optional)
bun run db:seed

# 5. Start dev server
bun run dev
```

### Minimum `.env.local` for local dev

```bash
# Postgres (Neon)
DATABASE_URL="postgresql://..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="any-32-char-string-for-local-dev"
```

R2 and Inngest env vars are only needed if you're testing the upload wizard or background jobs locally. Without them, upload signing returns 503 and `submitForReview` will fail gracefully.

### CLI (local)

```bash
cd cli
bun run dev login        # opens browser device-code flow
bun run dev install <slug>
bun run dev list
```

Or build the binary:

```bash
cd cli
bun run build            # produces cli/dist/agentcenter
./dist/agentcenter --help
```

---

## Architecture overview

```
Browser → Vercel (Next.js)
            ├── App Router pages (RSC + client islands)
            ├── /api/auth/...          Better Auth
            ├── /api/upload/sign       R2 presigned PUT
            ├── /api/v1/...            Public registry API (CLI)
            └── /api/inngest           Inngest webhook

Vercel → Neon (Postgres, pooled via @neondatabase/serverless)
Browser → R2 (direct PUT via presigned URL, no Vercel in the loop)
Inngest → Neon + R2 (scan-bundle, reindex-search background jobs)
CLI → Vercel /api/v1/... (device-code auth, extension install)
```
