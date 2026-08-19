# dsh-photo-skins

中文 | [English](README.md)

DSH Web GUI 的照片皮肤插件：导入你自己的照片，把它变成这个界面的皮肤。照片铺
在 GUI 后面作为背景层，并自动提取照片主色作为界面强调色与明暗遮罩色调。渲染
可调：填充方式（铺满/完整显示）、模糊（0-100px，全局或按「空对话/有内容」分区）、
压暗（0-100%）与「跟随照片取色」开关。

独立 cordis 插件：设置卡 + 宿主路由 + 设置命名空间 + 客户端图层控制器。

## 功能

- 通过文件选择器、拖拽或粘贴导入照片（PNG / JPG / WebP / GIF，单张上限 25MB）。
- 在首级设置区「照片皮肤」卡中试穿 / 应用 / 删除照片。
- 已应用的照片经 `photo-skins` 设置命名空间持久化，刷新页面后仍然生效；文件
  只存在本机。
- 自动取色：照片主色成为卡片强调色并渲染进明暗遮罩（CSS 变量
  `--dsw-photo-accent`、`--dsw-photo-accent-soft`、`--dsw-photo-accent-contrast`）。
- 模糊：一个全局值，或分「空对话/有内容」两个独立值、随消息出现实时切换。

## 安装

从 npm：

```sh
dsh plugin --profile web add dsh-photo-skins
```

从本仓库安装（开发调试）：

```sh
pnpm install && pnpm build
dsh plugin --profile web add link:.
```

然后刷新正在运行的 Web GUI（若新设置区没有出现，重启 `dsh web`）。

## 存储位置

照片保存在 `<DSH_HOME>/photo-skins/<id>/`（`original.<ext>` 加一份
`manifest.json`，记录显示名、类型、大小与导入时间）。不上传、不分享；删除即删
除本地副本。

## 安全模型

- 所有路由（`/api/photo-skins/*`）均带同源围栏（Sec-Fetch-Site / Origin）：
  跨站网页无法读取、导入或删除你的照片。
- 上传按文件魔数校验，不看文件名与声明类型——改名的 SVG 或可执行文件会被拒绝
  （415）。SVG 因脚本风险刻意不支持。
- 上传上限 25MB（413），原子写入（tmp + rename）。
- 存储 id 由本插件生成并过白名单正则，任何路径都不可能逃出存储目录。

## 已知限制

- 照片皮肤只做呈现：仅在 GUI 之下绘制背景层并写 CSS 变量，不触及模型请求与
  shell 内部组件。
- 不参与 `dsh-skin use` 的皮肤互斥体系，与激活皮肤按画序共存（激活时照片层覆
  盖皮肤背景）。
- 自动取色为近似值（降采样后取主色）。
- 除 GIF/APNG 外的动图与 SVG 均不支持。

## 开发

```sh
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm build       # tsdown -> lib/（host 半区）+ lib/client.js（浏览器 bundle）
```

构建产出面向 `window.__ModuleLoader__` 的 closure-factory 浏览器 bundle，
lightningcss 内联 CSS Modules、`@deepseek-ai` 平台模块外部化。

## 许可

BSD-3-Clause。涉及的第三方来源见 THIRD_PARTY_NOTICES.md。
