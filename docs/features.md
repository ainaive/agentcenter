# AgentCenter Feature Inventory · 功能清单

Source-of-truth list of what's shipped today, organized by capability area. For what changed when, see [daily-log.md](./daily-log.md).

当前已交付的能力清单，按功能领域分组。每日变更记录见 [daily-log.md](./daily-log.md)。

---

## English

### Browse & discover

- **Extension catalog** at `/extensions` — server-rendered grid with URL-bound filter state
  - Full-text search via `tsvector` (with weighted columns) + `pg_trgm` ILIKE fallback for short queries and CJK substrings
  - Department picker — dotted-path tree, descendant filtering via `LIKE 'parent.%'`
  - Scope pills — personal / org / enterprise
  - Filter chips — trending / new / official / open source
  - Tag drawer — multi-select with any/all match modes
  - Sort — downloads / stars / recent
  - Creator filter — picks an extension's publishing user
  - Publisher filter — picks the owning organization
- **Home page** — editorial featured banner + cross-category trending row
  - Whole extension card is clickable (stretched-link pattern)

### Detail page

- README rendered server-side from raw markdown (`react-markdown` + `rehype-sanitize`)
- Sidebar metadata — homepage, repo, license, compatibility, slug, scope, taxonomy, department
- Stats — average rating, downloads, version, last updated
- Install command (CLI snippet) with copy button
- Tabs — overview / setup / versions / reviews (reviews list is rendered; writing reviews not wired yet)
- Related extensions row
- Share button — canonical URL composed from `NEXT_PUBLIC_APP_URL` (not request `Host`, to prevent header spoofing)

### Publish

- 4-step wizard — Basics → Bundle → Listing → Review
- Sticky live-preview pane mirroring the listing card and the derived `manifest.json`
- Bundle upload via R2 presigned PUT URLs (browser → R2 directly; Vercel only signs)
- Inngest scan job — checksum, manifest parse, schema validation; auto-publishes personal scope, awaits admin review for org/enterprise
- Dashboard — drafts, scan-in-flight, rejected (with inline scan reason), published, archived
- Resume drafts via `/publish/[id]/edit` — slug + version locked once persisted
- Discard drafts (owner-checked, draft-only, FK cascade)

### Auth & accounts

- Better Auth — email + password, cookie sessions, Drizzle adapter
- Open sign-up; sign-in; sign-out
- Onboarding step — pick default department
- Locale and theme preference stored on the user row
- CLI device-flow auth (short code; sign-in required)

### Save & collections

- Save extensions (per-user bookmarks)
- Sidebar Collections section — "Saved" + custom user groups

### Multi-tenancy (schema only for v1)

- Organizations and departments seeded in DB; UI is single-tenant for v1
- Departments use dotted-path text PKs; `LIKE 'parent.%'` for descendant filtering
- Memberships link users ↔ orgs (M:N)

### Internationalization & theming

- next-intl with always-prefixed locale URLs (`/en`, `/zh`)
- Bilingual columns on extensions / tags / orgs / departments
- Editorial Ivory (default) + Dark themes; preference per-user

### Background jobs

- Inngest — `extension/scan.requested` → bundle scan → `extension/index.requested` → search reindex (`revalidateTag("extensions")`)

### Public API

- `/api/v1/...` registry surface consumed by the CLI (same listing semantics as the web UI, via shared `buildExtensionWhere` / `buildExtensionOrder`)

### CLI (Phase 9 — deferred to roadmap)

- Agent-agnostic, Claude-first defaults
- Distributed via npm (Bun-built binary)
- Reads the public `/api/v1` registry

### Infrastructure

- Next 16 (App Router, RSC, Turbopack dev), Tailwind v4, shadcn/ui + Radix
- PostgreSQL on Neon (FTS, `pg_trgm`)
- Cloudflare R2 for bundle storage
- Vercel deploy (Node runtime)

---

## 中文

### 浏览与发现

- **扩展目录** 位于 `/extensions`——服务端渲染的网格，筛选状态绑定到 URL
  - 全文搜索基于 `tsvector`（按列加权）+ `pg_trgm` ILIKE 回退（短查询和中日韩子串）
  - 部门选择器——点路径树，使用 `LIKE 'parent.%'` 进行后代筛选
  - 范围标签——个人 / 组织 / 企业
  - 筛选 chip——热门 / 最新 / 官方 / 开源
  - 标签抽屉——多选，支持任意/全部匹配
  - 排序——下载量 / 评分 / 最新
  - 作者筛选——按发布扩展的用户筛选
  - 发布商筛选——按所属组织筛选
- **首页** ——编辑风格 banner + 跨类别热门栏
  - 扩展卡片整体可点击（stretched-link 模式）

### 详情页

- 服务端渲染 README（`react-markdown` + `rehype-sanitize`）
- 侧边栏元数据——主页、代码仓、许可证、兼容性、标识、范围、分类、部门
- 统计——平均评分、下载量、版本、最近更新
- CLI 安装命令片段，带复制按钮
- Tabs——概览 / 安装 / 版本 / 评价（评价列表已展示；撰写评价尚未接通）
- 相关扩展行
- 分享按钮——使用 `NEXT_PUBLIC_APP_URL` 作为规范 URL（避免请求 `Host` 头被伪造）

### 发布

- 4 步向导——基础信息 → 扩展包 → 上架信息 → 确认提交
- 实时预览面板，镜像列表卡片和派生的 `manifest.json`
- 通过 R2 预签名 PUT URL 上传扩展包（浏览器直传 R2；Vercel 仅签名）
- Inngest 扫描任务——校验和、manifest 解析、schema 校验；个人范围自动发布，组织/企业范围等待管理员审核
- 控制台——草稿、扫描中、被拒绝（内嵌原因）、已发布、已归档
- 通过 `/publish/[id]/edit` 继续草稿——slug + 版本号在保存后锁定
- 丢弃草稿（仅作者本人、仅草稿、FK 级联清理）

### 认证与账号

- Better Auth——邮箱+密码、Cookie 会话、Drizzle 适配器
- 开放注册；登录；退出
- 引导步骤——选择默认部门
- 语言和主题偏好存储在用户记录上
- CLI 通过短码设备流授权（需先登录）

### 收藏与收藏夹

- 收藏扩展（按用户隔离的书签）
- 侧边栏收藏夹——"已收藏" + 用户自定义分组

### 多租户（v1 仅 Schema）

- 数据库种子已包含组织和部门；v1 UI 为单租户
- 部门使用点路径文本主键；通过 `LIKE 'parent.%'` 进行后代筛选
- Memberships 关联用户 ↔ 组织（多对多）

### 国际化与主题

- next-intl，URL 始终带语言前缀（`/en`、`/zh`）
- 扩展 / 标签 / 组织 / 部门表均支持双语字段
- Editorial Ivory（默认）+ Dark 主题；按用户保存偏好

### 后台任务

- Inngest——`extension/scan.requested` → 扫描扩展包 → `extension/index.requested` → 搜索重建索引（`revalidateTag("extensions")`）

### 公共 API

- `/api/v1/...` 注册表接口，供 CLI 调用（与 Web UI 共享 `buildExtensionWhere` / `buildExtensionOrder`，列表语义一致）

### CLI（Phase 9 ——延期至路线图）

- 与具体 Agent 无关，默认面向 Claude
- 通过 npm 分发（Bun 构建的二进制）
- 调用 `/api/v1` 公共注册表

### 基础设施

- Next 16（App Router、RSC、Turbopack dev），Tailwind v4，shadcn/ui + Radix
- PostgreSQL on Neon（FTS、`pg_trgm`）
- Cloudflare R2 存储扩展包
- Vercel 部署（Node 运行时）
