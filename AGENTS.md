# AGENTS.md — dsh-photo-skins 仓库规则

本仓库是一个独立 cordis 插件包。涉及的第三方来源见 THIRD_PARTY_NOTICES.md。

## 包形态

- `"type": "module"`，node `^22.19 || >=24`；`dsh.bundle.patch` 声明 bundle 激活
  （cordis.patch.yml 行 id `photo-skins`），`dsh.client` 声明浏览器半区注入与
  `platform: "web"`。
- host / client 半区分层：`src/index.ts`（host，运行在 dsh host 进程）、
  `src/client/`（browser，Web GUI 侧）；纯逻辑放 host 侧可注入模块（library.ts /
  accent.ts），测试不得依赖 DSH 源码 checkout 的 fixture。
- 只基于官方 NPM SDK（`@deepseek-ai/*` devDependencies 类型）；禁止 tsconfig
  指向任何 DSH 源码 checkout。

## 构建

- `tsdown.config.ts` 是自包含构建预设；改动构建行为必须同步更新 `README*` 的
  Development 一节说明。
- 浏览器 bundle 纯度门：`@deepseek-ai/*` 值导入只允许平台模块表成员与
  inline-safe wire 层，其余一律构建失败（跨插件协作走 cordis 服务）。

## 安全语义（改动必须同步 README + 测试）

- 全部路由同源围栏；上传按魔数校验（禁 SVG）；25MB 上限；存储 id 白名单正则；
  原子写入。改动任何一条都要改 `README.md`/`README.zh.md` 的安全模型一节并补测试。

## 纪律

- 双语：README 中英配对（README.md + README.zh.md + README.i18n.yaml），
  UI 文案 `zh` 字典为 key 源、`en` 键集完整对照。
- 禁止 emoji（代码、注释、文档、UI 文案、提交信息）。
- 提交前必跑 `pnpm typecheck && pnpm test`。
