# 🪄 dsh-photo-skins

中文 | [English](README.md)

一次导入，自动取色，让每一张照片成为 DSH Web GUI 的专属皮肤

DSH Web GUI 的照片皮肤插件：导入你自己的照片，把它变成这个界面的皮肤。照片铺
在 GUI 后面作为背景层，并自动提取照片主色作为界面强调色与明暗遮罩色调。渲染
可调：填充方式（铺满/完整显示）、模糊（0-100px，全局或按「空对话/有内容」分区）、
压暗（0-100%）与「跟随照片取色」开关。


## ✨ 功能

📥 三种方式导入照片

文件选择器、拖拽、粘贴，任选其一
支持 PNG / JPG / WebP / GIF，单张上限 25MB

👗 试穿 / 应用 / 删除

在首级设置区「照片皮肤」卡片中集中管理
「试穿」临时预览，不影响已经应用的照片
「应用」一键写入皮肤，「删除」一键清除本地副本

🎨 自动取色

照片主色自动成为界面强调色
生成明暗两套遮罩色调，让可读性遮罩带上照片自身的色调
输出 CSS 变量 --dsw-photo-accent / --dsw-photo-accent-soft / --dsw-photo-accent-contrast

🖼️ 渲染自由调节

填充方式：铺满（cover）/ 完整显示（contain）
模糊：0–100px，支持全局或拆分
压暗：0–100%，保证前景内容可读
跟随照片取色：随时开关

💾 本地持久化

已应用的照片经 photo-skins 设置命名空间持久化，刷新后依然生效
文件只保存在本机，不上传、不分享

## 🚀 安装  

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
`manifest.json`，记录显示名、类型、大小与导入时间）

## 安全模型

- 所有路由（`/api/photo-skins/*`）均带同源围栏（Sec-Fetch-Site / Origin）：
  跨站网页无法读取、导入或删除照片。
- 上传按文件魔数校验，不看文件名与声明类型——改名的 SVG 或可执行文件会被拒绝
  （415）。SVG 因脚本风险刻意不支持。
- 上传上限 25MB（413），原子写入（tmp + rename）。
- 存储 id 由本插件生成并过白名单正则，任何路径都不可能逃出存储目录。

## 已知限制

- 照片皮肤只做呈现：仅在 GUI 之下绘制背景层并写 CSS 变量，不触及模型请求与
  shell 内部组件。
- 自动取色为近似值（降采样后取主色）。
- GIF/APNG 外的动图与 SVG 目前均不支持。

## 本地开发
环境要求：Node.js ^22.19 || >=24，pnpm

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
