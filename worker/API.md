# StarGaze API 文档

本文档描述了 StarGaze 后端提供的 API 接口。

## 基础信息

- **Base URL**: `https://api.binbino.cn` (或您的 Worker 域名)
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (仅管理接口需要)

---

## 📸 照片 (Photos)

### 1. 获取照片列表
`GET /api/photos`

**查询参数:**
- `page` (number): 页码，默认为 1
- `limit` (number): 每页数量，默认为 20
- `star_id` (number): 过滤指定艺人的照片
- `search` (string): 搜索关键词 (匹配艺人姓名、作品等)
- `all` (boolean): 是否获取全部数据 (不分页)
- `min_age` / `max_age` (number): 年龄范围过滤
- `min_height` / `max_height` (number): 身高范围过滤
- `universities` (string): 院校过滤 (逗号分隔)
- `birth_months` (string): 出生月份过滤 (逗号分隔)
- `tags` (string): 标签过滤 (逗号分隔)

**响应示例:**
```json
{
  "photos": [
    {
      "id": 1,
      "filename": "abc.jpg",
      "star_name": "艺人姓名",
      "previewUrl": "...",
      "thumbnailUrl": "...",
      "r2_path": "/images/1"
    }
  ],
  "total": 100
}
```

### 2. 获取单张照片详情
`GET /api/photos/:id`

---

## 🌟 艺人 (Stars)

### 1. 获取艺人列表
`GET /api/stars`

**响应内容:** 包含所有艺人的基本信息、照片数量以及首图 ID。该接口有 30 分钟缓存。

### 2. 获取艺人详情
`GET /api/stars/:id`

**响应内容:** 包含艺人详细资料及其名下的所有照片。

---

## 📊 统计 (Stats)

### 1. 获取系统统计
`GET /api/stats`

**响应内容:**
```json
{
  "totalPhotos": 1000,
  "totalStars": 50,
  "totalSchools": 20,
  "averageAge": 22,
  "newThisMonth": 5
}
```

---

## 🖼 图片代理 (Image Proxy)

### 1. 获取图片原图/缩略图
`GET /images/:id`

**查询参数:**
- `size` (string): 传 `thumbnail` 获取缩略图，不传获取原图。

---

## 🔐 管理接口 (需鉴权)

### 1. 登录
`POST /api/auth/login`

### 2. 上传照片
`POST /api/upload` (单张)
`POST /api/upload-multiple` (多张)

### 3. 批量删除/更新
`POST /api/photos/batch-delete`
`POST /api/photos/batch-update`

### 4. 备份与还原 (Snapshots)
- `GET /api/snapshots`: 获取备份列表
- `POST /api/snapshots`: 创建备份
- `GET /api/snapshots/:id`: 还原备份
- `DELETE /api/snapshots/:id`: 删除备份
- `GET /api/snapshots/:id/download`: 下载 SQL 备份文件
