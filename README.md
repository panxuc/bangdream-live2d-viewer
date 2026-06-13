# BanG Dream! Live2D / Spine Viewer

一个面向 BanG Dream! 相关角色资源的在线查看与导出工具，支持加载、预览、组合和导出 Live2D / Spine 模型。项目是非官方粉丝工具，仅供学习、交流与展示使用。

## 功能

- 在线加载 Live2D 和 Spine 模型资源
- 支持多图层叠加、排序、复制和基础变换
- 支持动作、表情、借用动作/表情等预览选项
- 支持本地模型压缩包导入
- 支持画布背景设置、图片导出和批量导出
- 支持模型资源下载打包

## 技术栈

- Next.js App Router
- React 19
- PixiJS、pixi-live2d-display-advanced、pixi-spine
- Tailwind CSS
- OpenNext for Cloudflare Workers
- pnpm

## 本地开发

```bash
pnpm install
pnpm dev
```

默认开发地址为 `http://localhost:3000`。

## 环境变量

项目提供默认值，不配置环境变量也可以运行。需要替换资源来源或 ZIP 注释时，可以复制 `.env.example` 为 `.env.local` 后修改：

```bash
cp .env.example .env.local
```

| 变量 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_BANGDREAM_R2_ORIGIN` | BanG Dream! 资源 R2 源站 |
| `NEXT_PUBLIC_BANGDREAM_SPINE_ASSET_BASE` | Spine 资源索引和资源基址 |
| `NEXT_PUBLIC_BESTDORI_LIVE2D_ASSET_BASE` | Bestdori Live2D 资源页面基址 |
| `NEXT_PUBLIC_ZIP_COMMENT` | 下载 ZIP 文件注释 |

帮助页链接、Bestdori 首页/支持页和 7z wasm 兜底 CDN 是代码内固定链接，不作为部署环境变量配置。

## Cloudflare Workers 部署

这个项目包含 `app/api/*` Route Handlers，不是纯静态站点。部署到 Cloudflare 时使用 OpenNext Cloudflare adapter 构建 Workers。

本地预览生产构建：

```bash
pnpm build:cloudflare
pnpm wrangler dev
```

部署前先登录 Cloudflare：

```bash
pnpm wrangler login
pnpm deploy
```

如果使用 Cloudflare Workers 的 Git 集成，构建设置可以使用：

- Build command: `pnpm build:cloudflare`
- Deploy command: `pnpm opennextjs-cloudflare deploy`
- Wrangler config: `wrangler.jsonc`

当前配置只需要 Workers Assets 绑定，不需要额外创建 R2、KV 或 D1。项目没有使用 `next/image` 和 ISR；如果以后增加图片优化或增量缓存，再按 OpenNext 文档补 Cloudflare Images 或 R2 绑定。

## 脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Next.js 开发服务器 |
| `pnpm build` | 构建 Next.js 应用 |
| `pnpm build:cloudflare` | 构建 OpenNext Cloudflare Worker |
| `pnpm preview` | 构建并用 Wrangler 本地预览 |
| `pnpm deploy` | 构建并部署到 Cloudflare Workers |
| `pnpm lint` | 运行项目 lint |
| `pnpm check` | 运行基础检查 |

## 授权

本项目代码使用 MIT License，见 `LICENSE`。

BanG Dream! 相关角色、素材、商标以及第三方资源的权利归其各自权利人所有。本项目不授予这些素材或商标的任何使用许可，请勿用于商业用途。
