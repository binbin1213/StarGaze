# Next.js Photo Gallery

Photo Gallery项目的Next.js前端应用。

## 项目结构

```
nextjs/
├── app/
│   ├── page.tsx              # 照片墙主页
│   ├── admin/
│   │   ├── page.tsx         # 管理面板
│   │   └── login/
│   │       └── page.tsx     # 登录页面
│   ├── layout.tsx             # 全局布局
│   └── globals.css            # 全局样式
├── components/
│   └── AuthProvider.tsx       # 认证Provider
├── lib/
│   └── api.ts                # API客户端
├── public/                    # 静态资源
├── package.json               # 依赖配置
├── next.config.js             # Next.js配置
├── tailwind.config.js          # Tailwind CSS配置
├── tsconfig.json             # TypeScript配置
└── .env.local                 # 环境变量
```

## 已实现功能

### 认证系统
- 登录/登出
- Token存储（localStorage）
- 自动Token验证
- 401自动跳转登录页

### 照片墙
- 照片网格展示
- 响应式布局（1-4列）
- 加载状态
- R2图片显示

### 管理面板
- 艺人管理（链接）
- 照片管理（链接）
- 登出功能

## 环境变量

```env
NEXT_PUBLIC_WORKER_URL=https://api.binbino.cn
NEXT_PUBLIC_R2_URL=https://r2.binbino.cn
```

## 开发

```bash
cd nextjs
npm run dev
```

## 构建

```bash
npm run build
```

## 部署

### 方式1：Vercel（推荐）

1. 推送代码到GitHub
2. 在Vercel导入项目
3. 配置环境变量
4. 部署

### 方式2：本地开发

```bash
npm run dev
```

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Axios

## 下一步

1. 添加艺人管理页面
2. 添加照片上传功能
3. 实现移动端UI/UX改进
4. 添加搜索和筛选功能
5. 部署到Vercel
