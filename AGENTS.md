# AGENTS.md

## 本地汉化维护与交接（2026-10-07；最近更新 2026-10-22）

这是用户自用的 Claudian 简体中文汉化源码仓库，与同级 `obsidian-git` 仓库
一样在本地维护。以下为交接记录；接手时先检查实际 Git 和安装状态。

### 当前状态

- 本地维护分支：`zh-cn`，保留原来的 `main` 分支。
- 官方远程：`origin` → `https://github.com/YishenTu/claudian.git`。
  不把它当成用户自己的 fork，不向官方仓库推送本地汉化。
- 汉化历史：基于 `2.3.15`（`929ff4f5ad9bc1338ab975c5e10309d0480d3fe5`）的完整
  汉化已提交为 `ad123ef8`（"zh-cn: 保存基于 2.3.15 的完整汉化"，
  138 个文件 +7988/-844）。2026-10-22 合并官方发布标签 `2.3.27`
  （`96854b448b6af39a19d42b5a97093efb6c57c3be`，tag 对象指向该提交），当前
  基线即 `2.3.27`；未合并更新的 `origin/main` tip（按交接规范只合并正式
  发布标签）。
- 合并 `2.3.27` 的冲突处理：87 个冲突文件（84 修改 + 3 个上游删除文件，
  后者确认为上游真实删除，随 `git rm` 结束）。10 个语言包 JSON 按 key 做
  并集合并（上游新增 192 个 key、本地新增 569 个 key 全部保留，上游删除
  2 个 fork 相关 key）。其余 TS 冲突以官方 2.3.27 版本为基线重放汉化
  改动；上游已把大量字面量迁移到自带翻译的新 i18n key（如
  `chat.tools.status.*`、`chat.web.*`、`chat.approval.*`），直接采用；
  上游仍未本地化的字面量（如 SideChatController 源会话变更报错、
  EffortSelector/ModelSelector、DeepSeek 权限模式等约 59 处）重新用
  `t()` 包裹并复用或补充 key。
- 本次补译与修正：上游新增 key 的简体中文翻译由上游自带，本地仅修正
  `chat.permissionMode.claude.yolo`（"YOLO 模式"）、`chat.linkedContent.missing`
  （"内容缺失"，旧值带未传的 `{path}` 占位符）；新增 `chat.sessions.unread`、
  `chat.subagents.initializing`、`chat.tools.statusLabel`、
  `inlineEdit.lineSingular/linePlural`、`chat.sessions.markUnread/markRead/
  copySessionId`、`chat.errors.copySessionId` 及名词单位 key（如
  `chat.composer.nodeSingular`）等；术语统一"智能体/答案"；
  `chat.tools.changes` 等含 `{unit}` 参数的 key 为满足上游新增的
  locales 参数一致性测试改为名词单位插值，英文断言相应从
  "1 session that is running" 调整为 "1 session running"。
- 2026-10-22 验证（Node `v26.9.0`，比 `.node-version` 的 `24.16.0` 新，
  engines 范围外告警不影响结果）：类型检查、lint、生产构建通过；
  `npm test` 全绿（jest 8855 通过 / 5 跳过 / 0 失败，node:test 86 通过，
  测试总数从 7312 增至 8860）；性能检查通过，冷模块加载中位
  98.9 ms，超过 50 ms 提示线，未达复核线。
- 已通过 Obsidian CLI 重载并打开真实聊天面板，确认输入提示、推理强度、
  权限选项和命令菜单显示中文；用户正在试用（2.3.15 时确认，2.3.27 合并
  后尚未重新安装试用，部署前按下方"Personal OS 试用安装"流程备份）。

### 后续汉化与上游同步

1. 在 `zh-cn` 上维护。首次同步上游前，先把当前汉化保存为独立提交，区分并
   保留用户后续改动；不用丢弃工作区的方式恢复官方版本。
2. 获取上游后合并用户指定的发布标签；未指定时优先正式发布版本。冲突处
   保留新版功能逻辑并补译，不统一选择 `ours` 或 `theirs`。
3. 界面文案通过 `t()` 和 `src/i18n/locales/zh-CN.json` 维护。新增键时保持
   各语言包结构一致；本次新增文案在其他未补译语言中保留英文。
   模块级菜单和权限选项在读取或渲染时翻译，避免缓存启动时的语言。
4. 保留命令 ID、配置键、协议值、权限决定和原生推理值；中文显示不能改变
   实际发送给提供商的值。同步后继续验证中文控件的操作结果和已有配置兼容性。
5. 按下方完整验证要求检查后再构建部署，并更新本节的版本、验证和安装记录。
   `main.js`、`styles.css` 是被 Git 忽略的产物，汉化维护以源码和测试为准。

### Personal OS 试用安装

- 知识库：`/home/nldff/文档/obsidian/Personal OS`。
- 实际插件 ID 为 `realclaudian`，安装目录是该知识库的
  `.obsidian/plugins/realclaudian/`，与源码仓库目录名 `claudian` 不同。
- 已复制并校验 `main.js`、`manifest.json`、`styles.css`，保留现有
  `data.json`、`.claudian/claudian-settings.json`、会话和笔记。
- 本次覆盖前的备份位于源码仓库
  `.context/plugin-backups/20261007-221445/`；安装包和界面截图也在 `.context/`。
  后续覆盖前仍须备份原来的三个发布文件，不替换整个插件目录。
- 当前 `.env.local` 未设置 `OBSIDIAN_VAULT`。构建脚本自动复制目标使用
  `claudian` 目录；启用自动复制前必须核对其与实际插件 ID 的一致性。
- 部署后校验文件，并用 Obsidian CLI 重载 `realclaudian`、打开聊天面板检查。
  在 Obsidian 中更新官方插件会覆盖本地汉化构建。

## Loading and verification

- For test changes or changes to the code they cover, follow `tests/AGENTS.md`, even when no test edit is planned.
- Tests follow the guides of the source they cover; they do not inherit `src/` instructions automatically.
- Build, dependency, lockfile, locale/static-asset import, and `esbuild.config.mjs` changes also require `scripts/AGENTS.md`. Composition changes require the guides of the services being wired.
- Use the Node version in `.node-version`. For code changes, the full verification command is:

```bash
npm run typecheck && npm run lint && npm run test && npm run build && npm run check:performance
```

- For focused changes, `npm run test:affected -- --base origin/main` selects related tests; it does not replace typecheck, lint, build, or performance checks. Documentation-only changes need `git diff --check` (CI enforces it on every pull request) and their affected documentation tests, not a production build.
- Dev and production builds load `.env.local` and may copy artifacts into the configured `OBSIDIAN_VAULT`, including removal of its old `.codex-vendor`. Check that destination before building; clearing the shell variable does not prevent reloading it from the file.

## Architectural constraints

- `src/main.ts` is the sole concrete composition root and lifecycle publisher. App subcomposition returns complete domains, never a second root or service locator.
- `src/composition/` holds main-owned wiring that must reach both `app/` and `features/`. Only `main.ts` and other composition modules import it; it never imports `main.ts` or concrete providers, and `main.ts` still constructs, registers, and tears it down.
- App repositories/settings/storage depend on core contracts, not feature orchestration or provider-native protocols. Concrete provider imports are confined to `main.ts` and provider-default assembly.
- Features use `FeatureHost` and core registries, never concrete app/provider implementations. `FeatureHost` stays feature-neutral; chat-only capabilities belong in chat's `ChatFeatureHost` extension. Providers use `ProviderHost`, never feature orchestration. Core imports none of these implementations.
- Shared ACP code contains protocol mechanics and protocol-level normalization only; provider launch policy, extensions, provider-specific normalization, and history stay provider-owned.
- Each piece of mutable state or policy has one authoritative owner; other modules read derived projections or call the owner's API. Do not add parallel flags, maps, or guards that must be kept in sync; consolidate into the owner instead. Code that only looks alike under different provider semantics is not shared policy.

## Local conventions

- Use English for code/comments/identifiers/commits/code blocks. Soft-wrap Markdown. Put uncommitted notes, traces, and throwaway scripts in `.context/`. No production `console.*`.
- TypeScript files use PascalCase for their main concept, camelCase for utility bags, and kebab-case for external package names. Preserve `index.ts` barrels, `types.ts` buckets, and source-mirrored test names; this does not require creating new barrels or type buckets. No interface `I` prefix. Preserve acronym capitals in filenames and matching owned identifiers (`ACPClientConnection`, `buildACPUsageInfo`, `URLs`); leading acronyms remain lowercase in camelCase (`acpConnection`). Preserve external API names and serialized keys. Folders use kebab-case; imports omit `.ts` and prefer `@/`.
- UI actions use native controls. Buttons that do not submit a form declare `type="button"`; non-native controls need equivalent accessible names, roles, and keyboard behavior.

## Regression verification

- For behavior changes, demonstrate the intended failing regression before implementation and rerun it afterward. Documentation/mechanical changes are exempt; when automation is infeasible, record a repeatable reproduction and verify the nearest stable contract.

## Instruction maintenance

- Keep non-obvious constraints at their narrowest common scope, with one authoritative home and explicit exceptions. Remove implementation inventories, generic advice, inherited duplicates, and retired decisions.
- Each guide has a sibling `CLAUDE.md` containing only `@AGENTS.md`.
