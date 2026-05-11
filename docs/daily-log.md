# AgentCenter Daily Log · 每日简报

What changed each day. For the current capability list, see [features.md](./features.md).

每日变更记录。当前已交付能力清单见 [features.md](./features.md)。

---

## English

### 2026-05-11

**Briefing.** Personal "My Workspace" landing page — every signed-in user now has a profile hub with editable basics, four headline stats, and six tabs.

<details>
<summary>Details</summary>

- **Personal profile page** — Clicking the avatar in the top bar now reveals a new **Profile** option that opens your own workspace. The header shows your name, role, department, and the month you joined, with four numbers at a glance: how many extensions you've installed, how many you've published, total installs across your published work, and your weighted average rating. (#30, #31)

- **Editable profile basics** — Inside **Settings → Profile** you can change your display name, department, and a short bio (up to 280 characters). Email and the joined date are read-only. Save shows a confirmation; reloading the page confirms it stuck. (#30)

- **Six tabs of personal data** — *Installed* shows everything you've installed and what version is running. *Published* lists what you've shipped, with version, install count, and rating per row. *Drafts* mirrors the publish dashboard with a Continue button, and surfaces "Awaiting scan" or "Rejected" only when those statuses are relevant. *Saved* is your bookmark list. *Activity* merges installs, releases, and ratings into a single timeline (most recent twenty). Every section URL is shareable. (#30, #31)

- **Notifications and API tokens** — Both sub-tabs render a "Coming soon" placeholder while we wire them up. (#30)

</details>

---

### 2026-05-10

**Briefing.** Home page polish (banner, clickable cards, fixed trending row), new Creator + Publisher filters, production sign-up/sign-in fix, plus copy and layout cleanups.

<details>
<summary>Details</summary>

- **Home page** — Featured banner redesigned as a more polished, editorial composition (replacing the previous layout that left the right side feeling empty). The whole extension card is now clickable, not just the title. The "Trending" row used to be silently filtered to Skills only — it now shows a true cross-category mix of MCP servers, slash commands, and plugins as well, and the heading was simplified from "Trending Skills" to just "Trending". (#26, #28)

- **Browse: filter by Creator and Publisher** — Two new filters on the extensions page. Creator filters by the person who published the extension; Publisher filters by the organization behind it. A creator can belong to multiple publishers, which is reflected in the demo data. (#26)

- **Production sign-up and sign-in fix** — Registration and login were silently broken on the live site at `agentcenter.vercel.app` — requests were going nowhere. They now work on any deployment domain without extra configuration. (#27)

- **Top-bar search alignment** — The search box now sits centered in the top bar, with even space on both sides, instead of being pushed against the left. (#28)

- **Publish wizard naming** — Step 2 of the publish flow renamed from "Source / 代码来源" to "Bundle / 扩展包", which matches what the rest of the product calls it. (#28)

- **Chinese copy & typography polish** — Several wording and punctuation cleanups: a typo fix (`斜线命令` → `斜杠命令`), publisher terminology unified to `发布商` (previously a mix of `发布方` / `发布者`), proper Chinese em-dashes (`——`) replacing ASCII ones, friendlier empty-state wording, and product-name terms like `Skill` and `MCP` kept in English with proper Chinese spacing around them. (#26, #28)

- **Sidebar cleanup** — Removed an unused "Installed" entry that always showed `0`. (#26)

</details>

---

## 中文

### 2026-05-11

**简报。** 全新的"我的工作台"个人主页——每位登录用户都有一个集合页，能直接编辑基本资料、查看四项核心数据，并在六个分页之间切换。

<details>
<summary>详情</summary>

- **个人主页** ——点击顶部头像，下拉菜单里多了一项 **Profile**，进入属于你自己的工作台。页头显示你的姓名、角色、部门和加入月份，旁边还有四个一眼可见的数字：已安装的扩展数、已发布的扩展数、你发布的扩展总安装量，以及加权平均评分。(#30、#31)

- **可编辑的资料** ——在 **设置 → 个人资料** 里可以修改昵称、部门和一段不超过 280 字的简介。邮箱和加入时间为只读。保存后会出现成功提示；刷新页面验证数据已落库。(#30)

- **六个数据分页** ——*已安装* 展示你安装过的所有扩展和当前版本号。*我发布的* 列出你发布过的扩展，每行带版本、安装量和评分。*草稿* 复用发布面板的逻辑，提供"继续"按钮，并只在"等待扫描"或"已被拒"时显示状态。*已收藏* 是书签列表。*动态* 将安装、发布、评分汇总为一条时间线（最近 20 条）。所有分页 URL 均可分享。(#30、#31)

- **通知与 API 令牌** ——两个子分页暂以"即将推出"占位，相关功能正在排期中。(#30)

</details>

---

### 2026-05-10

**简报。** 首页打磨（banner、整卡可点击、修复热门栏）、新增"作者 + 发布商"筛选、生产环境注册/登录修复，以及若干文案与布局清理。

<details>
<summary>详情</summary>

- **首页** ——精选 banner 重新设计为更精致的编辑风格构图（此前右侧大片留白显得不协调）。扩展卡片现在整体可点击，不仅仅是标题。"热门"栏此前被悄悄限制为只展示 Skill，现在能真正混合展示 MCP、斜杠命令、插件等所有类型；标题也从"热门 Skill"简化为"热门"。(#26、#28)

- **浏览：按作者和发布商筛选** ——扩展列表页新增两个筛选条件。"作者"按发布扩展的用户筛选；"发布商"按背后的组织筛选。一个作者可以属于多个发布商，这一点在示例数据里也得到了体现。(#26)

- **生产环境注册/登录修复** ——线上站点 `agentcenter.vercel.app` 上的注册和登录此前一直静默失效，请求发不出去。现在任意部署域名下都能正常使用，无需额外配置。(#27)

- **顶栏搜索对齐** ——搜索框现在居中显示在顶栏内、两侧留白均分，不再紧贴左侧。(#28)

- **发布向导命名** ——发布流程第 2 步从"Source / 代码来源"改为"Bundle / 扩展包"，与产品其他位置的叫法保持一致。(#28)

- **中文文案与排版打磨** ——多处文字与标点优化：错字修正（`斜线命令` → `斜杠命令`）、"发布商"术语统一（原本 `发布方` / `发布者` 混用）、规范的中文破折号（`——`）替换 ASCII 版本、空状态用词更友好；同时 `Skill` / `MCP` 等产品术语保留英文，并按中文排版加上空格。(#26、#28)

- **侧边栏清理** ——移除一直显示 `0` 的"已安装"无用入口。(#26)

</details>
