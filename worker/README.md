# Cloudflare Worker API

Photo Gallery项目的Cloudflare Worker API后端。

## 项目结构

```
worker/
├── src/
│   ├── index.ts              # 主入口文件
│   ├── types.ts              # TypeScript类型定义
│   ├── middleware/
│   │   └── auth.ts         # 认证和CORS中间件
│   ├── handlers/
│   │   ├── stars.ts         # 艺人API
│   │   ├── photos.ts        # 照片API
│   │   ├── upload.ts        # 上传API
│   │   └── auth.ts         # 认证API
│   └── utils/
│       └── crypto.ts       # 加密工具
├── wrangler.toml             # Cloudflare配置
├── package.json             # 依赖配置
├── tsconfig.json           # TypeScript配置
└── README.md              # 本文件
```

## 安装步骤

### 1. 安装依赖

```bash
cd new-architecture/worker
npm install
```

### 2. 配置Cloudflare

#### 2.1 登录Cloudflare

```bash
wrangler login
```

#### 2.2 创建D1数据库

```bash
wrangler d1 create photo-gallery-db
```

保存返回的`database_id`到`wrangler.toml`。

#### 2.3 创建R2存储桶

```bash
wrangler r2 bucket create photo-gallery-photos
```

#### 2.4 创建KV命名空间

```bash
wrangler kv:namespace create SESSIONS
```

保存返回的`id`到`wrangler.toml`。

#### 2.5 生成JWT Secret

```bash
cd ../scripts
node generate-hash.js
```

保存生成的`JWT Secret`到`wrangler.toml`。

#### 2.6 更新wrangler.toml

将以下占位符替换为实际值：

```toml
database_id = "your-database-id-here"
id = "your-kv-namespace-id-here"
JWT_SECRET = "your-jwt-secret-here"
```

### 3. 初始化数据库

```bash
cd ../scripts
wrangler d1 execute photo-gallery-db --file=./schema.sql
```

### 4. 创建管理员用户

```bash
cd ../scripts
node generate-hash.js your-secure-password
```

复制输出的`INSERT`语句并执行：

```bash
wrangler d1 execute photo-gallery-db --command="INSERT INTO users (username, password_hash) VALUES ('admin', '\$2b\$10\$...')"
```

### 5. 部署Worker

```bash
cd ../worker
npm run deploy
```

## API端点

### 认证

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| /api/auth/login | POST | 登录 | 否 |
| /api/auth/logout | POST | 登出 | 是 |
| /api/auth/verify | GET | 验证Token | 是 |

### 艺人

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| /api/stars | GET | 获取艺人列表 | 否 |
| /api/stars | POST | 创建艺人 | 是 |
| /api/stars/:id | GET | 获取艺人详情 | 否 |
| /api/stars/:id | PUT | 更新艺人 | 是 |
| /api/stars/:id | DELETE | 删除艺人 | 是 |

### 照片

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| /api/photos | GET | 获取照片列表 | 否 |
| /api/photos/:id | GET | 获取照片详情 | 否 |
| /api/photos/:id | PUT | 更新照片 | 是 |
| /api/photos/:id | DELETE | 删除照片 | 是 |

### 上传

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| /api/upload | POST | 上传照片 | 是 |

## 开发

### 本地开发

```bash
npm run dev
```

### 构建

```bash
npm run build
```

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|--------|
| DB | D1数据库绑定 | 是 |
| R2 | R2存储桶绑定 | 是 |
| KV | KV命名空间绑定 | 是 |
| JWT_SECRET | JWT密钥 | 是 |

## 注意事项

1. **CORS配置**：当前配置为允许所有来源（`*`），生产环境应限制为特定域名
2. **文件大小限制**：最大10MB
3. **会话过期**：24小时
4. **密码哈希**：使用bcrypt，salt rounds = 10

## 下一步

1. 配置Cloudflare账号和资源
2. 部署Worker
3. 测试所有API端点
4. 开始开发Next.js前端
