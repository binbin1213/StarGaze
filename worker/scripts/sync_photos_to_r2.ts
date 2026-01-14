import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';

const PHOTOS_DIR = '/Users/binbin/Desktop/photos';
const BUCKET_NAME = 'photo-gallery-photos'; // 确认您的 R2 bucket 名称

async function syncPhotos() {
    console.log('🔍 正在从 D1 获取照片列表...');
    const output = execSync('wrangler d1 execute photo-gallery-db --remote --command="SELECT id, filename FROM photos;" --json').toString();
    const photos = JSON.parse(output)[0].results;

    console.log(`🚀 开始同步 ${photos.length} 张照片到 R2...`);

    for (let i = 0; i < photos.length; i++) {
        const { id, filename } = photos[i];
        const localPath = path.join(PHOTOS_DIR, filename);

        if (!fs.existsSync(localPath)) {
            console.warn(`[${i+1}/${photos.length}] ⚠️  文件不存在，跳过: ${filename}`);
            continue;
        }

        try {
            console.log(`[${i+1}/${photos.length}] 📦 处理照片 ID: ${id} (${filename})`);

            // 1. 上传原始图片
            const ext = path.extname(filename).toLowerCase() || '.jpg';
            const r2OriginalPath = `photos/${id}/original${ext}`;
            console.log(`   ⬆️  上传原始图...`);
            execSync(`wrangler r2 object put "${BUCKET_NAME}/${r2OriginalPath}" --file="${localPath}"`);

            // 2. 生成并上传缩略图
            console.log(`   🎨 生成缩略图...`);
            const thumbBuffer = await sharp(localPath)
                .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();
            
            const thumbLocalPath = path.join('./scripts', `temp_thumb_${id}.jpg`);
            fs.writeFileSync(thumbLocalPath, thumbBuffer);
            
            const r2ThumbPath = `photos/${id}/thumbnail.jpg`;
            console.log(`   ⬆️  上传缩略图...`);
            execSync(`wrangler r2 object put "${BUCKET_NAME}/${r2ThumbPath}" --file="${thumbLocalPath}"`);
            
            // 清理临时文件
            fs.unlinkSync(thumbLocalPath);

        } catch (e: any) {
            console.error(`❌ 处理照片 ${filename} 失败:`, e.message);
        }
    }

    console.log('✨ 所有照片同步完成！');
}

syncPhotos();
