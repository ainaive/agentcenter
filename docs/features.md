# AgentCenter Feature Inventory · 功能清单

Source-of-truth list of what's shipped today, organized by capability area. For what changed when, see [daily-log.md](./daily-log.md).

当前已交付的能力清单，按功能领域分组。每日变更记录见 [daily-log.md](./daily-log.md)。

---

## English

### Browse & discover

- **Extension catalog** — Browse all published extensions in a paginated grid at `/extensions`.
- **Search** — Search by any phrase, in English or Chinese, including short fragments.
- **Department picker** — Narrow to a department and all of its sub-departments.
- **Scope filter** — Filter by Personal, Organization, or Enterprise.
- **Quick filters** — Toggle Trending, New, Official, or Open Source.
- **Tag filters** — Multi-select tags with "any" or "all" matching.
- **Sort** — Sort by downloads, stars, or most recently updated.
- **Creator filter** — Filter by the user who published the extension.
- **Publisher filter** — Filter by the organization behind the extension.
- **Shareable filter state** — Every filter combination is reflected in the URL, so any search can be bookmarked or shared.
- **Home: featured banner** — An editorial-style banner highlights one featured extension.
- **Home: trending row** — A cross-category mix of trending extensions (Skills, MCP servers, slash commands, plugins).
- **Whole-card click** — Click anywhere on an extension card to open it; Save / Install stay independently clickable.

### Detail page

- **README** — The extension's README rendered with safe markdown.
- **Sidebar metadata** — Homepage, repo, license, compatibility, identifier, scope, taxonomy, department.
- **Stats** — Average rating, downloads, version, last updated.
- **Install command** — A one-click copyable CLI snippet.
- **Tabs** — Overview, Setup, Versions, Reviews. Reading reviews works; writing them is not wired up yet.
- **Related extensions** — A row of suggestions related to the current extension.
- **Share** — A canonical link that's safe to share across hosts.

### Publish

- **4-step wizard** — Basics → Bundle → Listing → Review.
- **Live preview** — A sticky panel mirrors the listing card and the derived manifest as the form is filled.
- **Bundle upload** — Upload the extension package directly from the browser to cloud storage.
- **Automated scan** — Submitted bundles are checked for integrity, valid manifest, and schema before going live.
- **Auto-publish (personal)** — Personal-scope extensions are published immediately after the scan passes.
- **Admin review (org / enterprise)** — Org and enterprise extensions wait for an admin to approve.
- **Dashboard** — Track drafts, in-flight scans, rejected items (with reason shown inline), published, and archived.
- **Resume drafts** — Continue an unfinished publish later; slug and version lock once saved.
- **Discard drafts** — Owners can delete their own drafts cleanly.

### Accounts & sign-in

- **Sign up** — Open registration with email and password.
- **Sign in / out** — Cookie-based sessions.
- **Onboarding** — Pick a default department on first sign-in.
- **Preferences** — Language and theme are saved per account.
- **CLI device-flow auth** — Authorize the CLI from the web with a short code.

### Save & collections

- **Save** — Bookmark any extension to a personal "Saved" list.
- **Collections** — "Saved" plus user-created groups appear in the sidebar.

### Languages & themes

- **Bilingual UI** — English (default) and Chinese, with always-prefixed locale URLs (`/en`, `/zh`).
- **Bilingual content** — Extension titles, descriptions, tags, organization names, and department names all support per-language values.
- **Themes** — Editorial Ivory (default) and Dark; preference saved per account.

### Multi-tenancy (schema-only in v1)

- **Organizations & departments** — Modeled in the database and seeded; the v1 UI is single-tenant.
- **Department hierarchy** — Dotted-path identifiers; descendant filtering is supported.
- **Memberships** — Users can belong to multiple organizations.

### Public API

- **Registry API (`/api/v1/...`)** — Same listing semantics as the web UI; used by the CLI.

### CLI (deferred to roadmap)

- **Agent-agnostic** — Designed to work with multiple agents; Claude is the default target.
- **Distribution** — Shipped via npm.
- **Reads** — Pulls from the public registry API.

---

## 中文

### 浏览与发现

- **扩展目录** ——在 `/extensions` 浏览所有已发布扩展，支持分页。
- **搜索** ——任意短语搜索，支持中英文，含短片段查询。
- **部门选择器** ——收窄到某个部门及其所有子部门。
- **范围筛选** ——按"个人 / 组织 / 企业"筛选。
- **快速筛选** ——切换"热门 / 最新 / 官方 / 开源"。
- **标签筛选** ——多选标签，支持"任意 / 全部"匹配。
- **排序** ——按下载量、评分或最近更新排序。
- **作者筛选** ——按发布扩展的用户筛选。
- **发布商筛选** ——按背后的组织筛选。
- **可分享的筛选状态** ——所有筛选条件都反映在 URL 中，可收藏或分享任意搜索。
- **首页：精选 banner** ——编辑风格的精选 banner，突出一个推荐扩展。
- **首页：热门栏** ——跨类别混合展示热门扩展（Skill、MCP、斜杠命令、插件）。
- **整卡可点击** ——点击扩展卡片任意位置都能打开；Save / Install 仍可独立点击。

### 详情页

- **README** ——以安全 Markdown 渲染扩展的 README。
- **侧边栏元数据** ——主页、代码仓、许可证、兼容性、标识符、范围、分类、部门。
- **统计** ——平均评分、下载量、版本、最近更新。
- **安装命令** ——一键可复制的 CLI 命令片段。
- **Tabs** ——概览 / 安装 / 版本 / 评价。评价可读取；撰写尚未接通。
- **相关扩展** ——与当前扩展相关的推荐行。
- **分享** ——跨域名安全分享的规范链接。

### 发布

- **4 步向导** ——基础信息 → 扩展包 → 上架信息 → 确认提交。
- **实时预览** ——固定面板镜像列表卡片与派生的 manifest，随表单填写而更新。
- **扩展包上传** ——从浏览器直接将扩展包上传到云存储。
- **自动扫描** ——提交后自动校验完整性、manifest 有效性与 schema。
- **自动发布（个人）** ——个人范围扩展通过扫描后立即上线。
- **管理员审核（组织/企业）** ——组织/企业范围扩展需等待管理员审核。
- **控制台** ——查看草稿、扫描中、被拒（内嵌原因）、已发布、已归档。
- **继续草稿** ——稍后继续未完成的发布；slug 和版本号在保存后锁定。
- **丢弃草稿** ——作者本人可干净删除自己的草稿。

### 账号与登录

- **注册** ——邮箱+密码开放注册。
- **登录 / 退出** —— Cookie 会话。
- **引导** ——首次登录时选择默认部门。
- **偏好** ——语言与主题按账号保存。
- **CLI 设备流授权** ——通过网页用短码授权 CLI。

### 收藏与收藏夹

- **收藏** ——将任意扩展加入个人"已收藏"列表。
- **收藏夹** ——侧边栏展示"已收藏"和用户自定义分组。

### 语言与主题

- **双语界面** ——英文（默认）+ 中文，URL 始终带语言前缀（`/en`、`/zh`）。
- **双语内容** ——扩展标题、描述、标签、组织名、部门名均支持双语字段。
- **主题** —— Editorial Ivory（默认）+ Dark；按账号保存偏好。

### 多租户（v1 仅 Schema）

- **组织与部门** ——数据库已建模并播种；v1 UI 为单租户。
- **部门层级** ——点路径标识；支持后代筛选。
- **Memberships** ——用户可属于多个组织。

### 公共 API

- **注册表 API（`/api/v1/...`）** ——与 Web UI 列表语义一致；供 CLI 调用。

### CLI（延期至路线图）

- **与 Agent 无关** ——面向多 Agent 设计，默认面向 Claude。
- **分发** ——通过 npm 发布。
- **数据来源** ——调用公共注册表 API。
