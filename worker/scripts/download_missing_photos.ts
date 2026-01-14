import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const CDN_TXT_PATH = '/Users/binbin/Downloads/photo-gallery/cdn-img.txt';
const PHOTOS_DIR = '/Users/binbin/Downloads/photo-gallery/photos';

async function syncMissingFromCDN() {
    console.log('🔄 正在寻找本地缺失的图片...');

    try {
        // 1. 获取 CDN 列表中的文件名
        const cdnContent = fs.readFileSync(CDN_TXT_PATH, 'utf8');
        const cdnLines = cdnContent.split('\n').filter(line => line.trim());
        const cdnFiles = new Map<string, string>(); // Filename -> URL

        cdnLines.forEach(line => {
            const url = line.trim();
            const filename = url.split('/').pop()?.split('?')[0];
            if (filename) {
                cdnFiles.set(filename, url);
            }
        });

        // 2. 获取本地已有的文件名
        const localFiles = new Set(
            fs.readdirSync(PHOTOS_DIR).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.webp', '.JPG'].includes(ext);
            })
        );

        // 3. 找出缺失的文件
        const missingFiles: { filename: string, url: string }[] = [];
        for (const [filename, url] of cdnFiles.entries()) {
            if (!localFiles.has(filename)) {
                missingFiles.push({ filename, url });
            }
        }

        console.log(`📊 统计结果:`);
        console.log(`- CDN 总数: ${cdnFiles.size}`);
        console.log(`- 本地总数: ${localFiles.size}`);
        console.log(`- 缺失总数: ${missingFiles.length}`);

        if (missingFiles.length === 0) {
            console.log('✨ 本地图片已是最新，无需补齐。');
            return;
        }

        console.log('\n🚀 开始补齐缺失图片:');
        for (const file of missingFiles) {
            const destPath = path.join(PHOTOS_DIR, file.filename);
            process.stdout.write(`正在下载: ${file.filename} ... `);
            
            try {
                // 使用 curl 下载
                execSync(`curl -s -L -o "${destPath}" "${file.url}"`);
                process.stdout.write('✅ 成功\n');
            } catch (err: any) {
                process.stdout.write(`❌ 失败: ${err.message}\n`);
            }
        }

        // 最后再次验证数量
        const finalCount = fs.readdirSync(PHOTOS_DIR).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.JPG'].includes(ext);
        }).length;
        console.log(`\n🏁 补齐完成！本地现在共有 ${finalCount} 张图片。`);

    } catch (error: any) {
        console.error('❌ 执行失败:', error.message);
    }
}

syncMissingFromCDN();
