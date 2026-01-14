# Cloudflare R2 域名配置指南

为了让前端能够正常显示存储在 R2 中的图片，您需要为 R2 存储桶配置自定义域名或开启公有访问。

## 方案一：使用自定义域名（推荐）

这是最专业且稳定的方式，需要您在 Cloudflare 中有一个托管的域名。

1.  **进入 R2 控制台**：登录 Cloudflare，点击左侧菜单的 **R2**。
2.  **选择存储桶**：点击您为本项目创建的存储桶（如 `photo-gallery-images`）。
3.  **进入设置**：点击顶部导航栏的 **Settings** (设置)。
4.  **公开访问 (Public Access)**：
    *   找到 **Custom Domains** 部分。
    *   点击 **Connect Domain**。
    *   输入您想使用的子域名（例如 `img.yourdomain.com`）。
    *   Cloudflare 会自动为您配置 DNS 记录。
5.  **更新配置**：
    *   在 `wrangler.toml` 中，虽然我们通过 Worker 代理访问，但如果有直接访问需求，可以使用此域名。
    *   **注意**：本项目目前主要通过 Worker 的 `/images/:id` 接口代理 R2 图片，这样可以处理图片缩放并隐藏 R2 的直接 URL。

## 方案二：允许 Worker 访问 R2 (已在项目中实现)

本项目默认采用 **Worker 代理模式**，这意味着您不需要公开 R2 存储桶。

### 1. 绑定配置
确保 `new-architecture/worker/wrangler.toml` 中包含以下绑定：

```toml
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "您的存储桶名称"
```

### 2. 跨域配置 (CORS)
如果图片加载出现跨域错误，您需要在 R2 存储桶中配置 CORS：

1.  在 R2 存储桶的 **Settings** 页面，找到 **CORS Policy**。
2.  点击 **Add CORS Policy**，输入以下内容：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## 为什么我们使用 Worker 代理访问？

1.  **图片缩放**：通过 Worker 接口（`/images/:id?size=thumbnail`），我们可以利用 Cloudflare 的 API 动态生成缩略图，节省带宽。
2.  **安全性**：不需要将整个 R2 存储桶暴露在公网。
3.  **统一性**：前端只需要与 API 域名交互，不需要管理多个域名。
