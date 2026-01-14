# StarGaze - Thai Star Photo Gallery

本项目是一个专门服务于泰国艺人的现代照片展示与管理系统。采用前后端分离架构，充分利用 Cloudflare 的边缘计算能力，实现高性能、低延迟的全球访问。

## 🏗 架构概览

- **前端**: [Next.js](https://nextjs.org/) (App Router) + Tailwind CSS + Lucide Icons + SWR
- **后端**: [Cloudflare Workers](https://workers.cloudflare.com/) (TypeScript)
- **存储**: 
  - **数据库**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
  - **对象存储**: [Cloudflare R2](https://developers.cloudflare.com/r2/) (用于存放照片原图及缩略图)
- **部署**: [Vercel](https://vercel.com/) (前端) + [Cloudflare Workers](https://workers.cloudflare.com/) (后端)

## 📁 目录结构

```text
.
├── nextjs/          # 前端项目 (Next.js) - 建议部署至 Vercel
│   ├── app/         # 页面路由与逻辑
│   ├── components/  # 可复用 UI 组件
│   ├── lib/         # 工具函数与 fetcher
│   └── public/      # 静态资源
└── worker/          # 后端项目 (Cloudflare Workers) - 部署至 Cloudflare
    ├── src/
    │   ├── handlers/    # API 业务逻辑处理
    │   ├── middleware/  # 中间件 (鉴权等)
    │   └── index.ts     # 入口文件
    └── wrangler.toml    # Worker 配置文件
```

## 🚀 部署指南

### 1. 后端部署 (Cloudflare Workers)
1. 进入目录: `cd worker`
2. 安装依赖: `npm install`
3. 登录 Cloudflare: `npx wrangler login`
4. 创建 D1 数据库: `npx wrangler d1 create photo-gallery-db`
5. 创建 R2 存储桶: `npx wrangler r2 bucket create photo-gallery-images`
6. 修改 `wrangler.toml` 中的 `database_id` 和 `bucket_name`。
7. 部署: `npx wrangler deploy`

### 2. 前端部署 (Vercel)
1. 将代码上传至 GitHub/GitLab/Bitbucket。
2. 在 [Vercel 控制台](https://vercel.com/new) 导入仓库。
3. **关键配置**:
   - **Root Directory**: 设置为 `nextjs`
   - **Environment Variables**: 添加 `NEXT_PUBLIC_WORKER_URL`，值为你的 Cloudflare Worker 域名 (例如 `https://api.yourname.workers.dev`)。
4. 点击 **Deploy**。

## 🛠 本地开发环境要求
- Node.js 18+
- Cloudflare 账号
- Wrangler CLI (`npm install -g wrangler`)

## 🌟 核心特性

- **响应式设计**: 完美适配手机、平板与桌面端。
- **深色模式**: 支持系统自动切换及手动切换。
- **高性能照片墙**: 基于 SWR 的数据请求与缓存，无限滚动加载。
- **艺人生日提醒**: 首页自动展示当月寿星，并支持一键跳转。
- **环境背景**: 随主题变化的氛围气泡与侧边快捷导航。
- **管理后台**: 提供完整的照片上传、艺人管理、评论审核等功能。

## 📄 文档索引

- [API 接口文档](./worker/API.md)
- [R2 域名配置指南](./R2-DOMAIN-GUIDE.md)
- [使用手册](./USER-GUIDE.md)
