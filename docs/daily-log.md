# AgentCenter Daily Log · 每日简报

What changed each day. For the current capability list, see [features.md](./features.md).

每日变更记录。当前已交付能力清单见 [features.md](./features.md)。

---

## English

### 2026-05-10

Three PRs landed today.

- **#26 — Home improvements** ([feat/home-improvements](https://github.com/ainaive/agentcenter/pull/26))
  - Featured banner redesigned as an editorial composition: top rule split by an eyebrow caps label, centered serif headline with italic accent + italic-serif "deck" sentence, footer rule with mono installs counter and "View extension →" CTA. Iterated away from a hero-icon variant that felt unrefined against the typography.
  - Whole extension card is now clickable via a stretched-link `::after` overlay; Save/Install stay independently clickable on a higher z-index.
  - **Creator** and **Publisher** filters added on `/extensions`. Creator → `extensions.publisherUserId`; Publisher → `extensions.ownerOrgId` (existing columns, just exposed as those names in user-facing UI). New `lib/db/queries/facets.ts` returns `{id, name, count}` lookups for the dropdowns.
  - Seed rebuilt: 6 mock creator users, each unique extension `author` materialized as its own org, memberships derived from the (creator, owning org) pairs that emerge — most creators end up in several orgs naturally.
  - Sidebar's "Installed" pseudo-collection (hard-coded count 0) removed.
  - zh.json: `Skill` and `MCP` now appear as English in category labels and inline copy, with CJK-style spacing (`热门 Skill`, `搜索 Skill、MCP、…`).

- **#27 — Auth client baseURL fix** ([fix/auth-client-baseurl](https://github.com/ainaive/agentcenter/pull/27))
  - `lib/auth/client.ts` was constructed with `baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"`. On Vercel deploys missing the env var, every signup/sign-in POST went to localhost from the visitor's browser — silently broken on `agentcenter.vercel.app`.
  - Dropped `baseURL` entirely; Better Auth's React client falls back to the relative `/api/auth` path, which the browser resolves against `window.location.origin`. Works on any host, no env var needed.

- **#28 — Copy polish, top-bar, trending fix** ([fix/copy-and-bugs](https://github.com/ainaive/agentcenter/pull/28))
  - zh i18n polish: `斜线命令` typo standardized to `斜杠命令`; publisher unified to `发布商` (was a mix of 发布方/发布者); ASCII em-dashes `" — "` converted to CJK `——`; README empty-state `发布` → `提供`; permissions hint `请如实声明` → `请如实勾选`.
  - Publish wizard step 2 renamed `Source / 代码来源` → `Bundle / 扩展包`. Aligns with the codebase's existing term (`bundleFileId`, R2 "bundle storage", review section's bundle row).
  - Top-bar search input wrapped in `flex flex-1 justify-center` so the empty space splits evenly between left logo cluster and right nav cluster (was clinging to the left).
  - Home "Trending" row was `listExtensions({ category: "skills", … })` under a generic heading; MCP/slash/plugins never appeared. Drop the category filter; rename heading to plain "Trending" / "热门".
  - +7 tests on `filtersSchema` / `buildExtensionWhere` / round-trip helpers to backfill coverage for the creator/publisher additions from #26 (292 → 299 total).
  - Architecture doc refreshed: filter-bar island list now includes `PublisherPicker` + `CreatorPicker`; wizard step name `Source` → `Bundle` in three places.

---

## 中文

### 2026-05-10

今日合并 3 个 PR。

- **#26 ——首页改进** ([feat/home-improvements](https://github.com/ainaive/agentcenter/pull/26))
  - 精选 banner 重新设计为编辑风格：顶部细线居中嵌入 Eyebrow 标签 + 居中 serif 大标题（末词斜体强调）+ 斜体 serif 副本 + 底部细线 + 等宽下载次数 + "查看扩展 →" CTA。原本想用大图标方案，迭代后觉得与字体风格不协调，改为纯文字编排。
  - 扩展卡片整体可点击——通过链接的 `::after` 拉伸覆盖整张卡，Save / Install 按钮通过更高 z-index 保留独立点击。
  - `/extensions` 增加 **作者** 与 **发布商** 筛选。作者 → `extensions.publisherUserId`；发布商 → `extensions.ownerOrgId`（沿用现有列，仅在面向用户的 UI 中改名）。新增 `lib/db/queries/facets.ts` 返回 `{id, name, count}` 用于填充下拉。
  - 种子数据重建：6 个模拟作者账号，每个扩展的 `author` 字段被实例化为独立组织，memberships 从 (作者, 所属组织) 配对中自然派生——大多数作者会自然出现在多个发布商下。
  - 删除侧边栏多余的"已安装"伪收藏夹（原本写死计数 0）。
  - zh.json：分类标签与正文中的 `Skill` 与 `MCP` 改用英文，按中日韩排版规则添加空格（`热门 Skill`、`搜索 Skill、MCP、…`）。

- **#27 —— Auth 客户端 baseURL 修复** ([fix/auth-client-baseurl](https://github.com/ainaive/agentcenter/pull/27))
  - `lib/auth/client.ts` 写死 `baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"`。Vercel 部署若缺失该环境变量，访客浏览器的注册/登录请求会发到 localhost——`agentcenter.vercel.app` 上静默失败。
  - 直接移除 `baseURL`；Better Auth 的 React 客户端会回退到相对路径 `/api/auth`，由浏览器解析为 `window.location.origin`。在任意域名下都能用，无需环境变量。

- **#28 ——文案打磨、顶栏、热门修复** ([fix/copy-and-bugs](https://github.com/ainaive/agentcenter/pull/28))
  - 中文 i18n 打磨：修正 `斜线命令` → `斜杠命令`；发布方统一为 `发布商`（原有 发布方/发布者 混用）；ASCII 破折号 `" — "` 改为中文样式 `——`；README 空态 `发布` → `提供`；权限提示 `请如实声明` → `请如实勾选`。
  - 发布向导第 2 步重命名 `Source / 代码来源` → `Bundle / 扩展包`，与代码库其他位置的术语统一（`bundleFileId`、R2 "bundle storage"、Review 步骤的 bundle 行）。
  - 顶栏搜索框包裹 `flex flex-1 justify-center`，让左侧 logo 与右侧导航之间的空白均分（原本搜索框紧贴左侧）。
  - 首页"热门"原本写死 `listExtensions({ category: "skills", … })`，但标题是通用的；MCP / 斜杠命令 / 插件从未出现。去掉类别筛选，标题改为 "Trending" / "热门"。
  - 补充 7 个测试覆盖 #26 引入的 `filtersSchema` / `buildExtensionWhere` / 往返序列化（292 → 299）。
  - Architecture 文档同步刷新：filter-bar 客户端岛列表加入 `PublisherPicker` + `CreatorPicker`；向导步骤名 `Source` → `Bundle`（三处）。
