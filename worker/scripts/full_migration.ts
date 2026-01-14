import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STARS_JSON_PATH = '/Users/binbin/Downloads/photo-gallery/stars.json';
const PHOTOS_DIR = '/Users/binbin/Downloads/photo-gallery/photos';
const BUCKET_NAME = 'photo-gallery-photos';
const DB_NAME = 'photo-gallery-db';

async function fullCleanAndRebuild() {
  console.log('🧹 正在执行全量清理...');
  
  try {
    // 1. 清空 D1
    console.log('🗑️  清空 D1 数据库...');
    const env = { ...process.env, WRANGLER_SEND_METRICS: 'false' };
    execSync(`wrangler d1 execute ${DB_NAME} --remote --command="DELETE FROM photos; DELETE FROM stars; DELETE FROM sqlite_sequence WHERE name IN ('photos', 'stars');" -y`, { stdio: ['inherit', 'inherit', 'ignore'], env });

    // 2. 导入 Stars
    console.log('👤 导入艺人信息...');
    const starsData = JSON.parse(fs.readFileSync(STARS_JSON_PATH, 'utf8'));
    
    // 建立文件名到 star_id 的映射 (star_id 会根据插入顺序自动生成，从 1 开始)
    const fileToStarIdMap = new Map<string, number>();
    
    const starsSql = starsData.map((s: any, index: number) => {
      const starId = index + 1;
      const name = s.chineseName || s.englishName || 'Unknown';
      const name_en = s.englishName || '';
      const nickname = s.nickname || '';
      const birthday = s.birthDate && s.birthDate.$date ? s.birthDate.$date.split('T')[0] : '';
      const birth_month = s.birthMonth || null;
      const height = s.height ? String(s.height) : '';
      const weight = s.weight ? String(s.weight) : '';
      const university = s.university || '';
      const major = s.major || '';
      const degree = s.degree || '';
      const biography = s.description || '';
      const works = s.representativeWorks ? s.representativeWorks.join(', ') : '';
      const tags = s.tags ? s.tags.join(', ') : '';
      const avatar = s.photoFilename ? `https://pub-84157d62283647f183921359c6c4c98c.r2.dev/photos/stars/${s.photoFilename}` : '';
      
      if (s.photoFilename) {
        // 统一小写进行匹配，增强健壮性
        fileToStarIdMap.set(s.photoFilename.toLowerCase(), starId);
      }
      
      const sql = `INSERT INTO stars (id, name, name_en, nickname, birthday, birth_month, height, weight, university, major, degree, biography, representative_works, tags, avatar_url) VALUES (${starId}, '${name.replace(/'/g, "''")}', '${name_en.replace(/'/g, "''")}', '${nickname.replace(/'/g, "''")}', '${birthday}', ${birth_month}, '${height}', '${weight}', '${university.replace(/'/g, "''")}', '${major.replace(/'/g, "''")}', '${degree.replace(/'/g, "''")}', '${biography.replace(/'/g, "''")}', '${works.replace(/'/g, "''")}', '${tags.replace(/'/g, "''")}', '${avatar}');`;
      return sql;
    }).join('\n');

    const tempStarsSql = path.join(__dirname, 'rebuild_stars.sql');
    fs.writeFileSync(tempStarsSql, starsSql);
    execSync(`wrangler d1 execute ${DB_NAME} --remote --file="${tempStarsSql}" -y`, { stdio: ['inherit', 'inherit', 'ignore'], env });
    fs.unlinkSync(tempStarsSql);

    // 3. 读取本地图片并导入 Photos
    console.log('📸 导入图片记录...');
    const localFiles = fs.readdirSync(PHOTOS_DIR).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    });
    
    const photosSql = localFiles.map(filename => {
      const starId = fileToStarIdMap.get(filename.toLowerCase()) || 'NULL';
      return `INSERT INTO photos (filename, original_name, star_id) VALUES ('${filename}', '${filename}', ${starId});`;
    }).join('\n');
    
    const tempPhotosSql = path.join(__dirname, 'rebuild_photos.sql');
    fs.writeFileSync(tempPhotosSql, photosSql);
    execSync(`wrangler d1 execute ${DB_NAME} --remote --file="${tempPhotosSql}" -y`, { stdio: ['inherit', 'inherit', 'ignore'], env });
    fs.unlinkSync(tempPhotosSql);

    // 4. 同步 R2
    console.log('🚀 同步图片到 R2...');
    const d1Output = execSync(`wrangler d1 execute ${DB_NAME} --remote --command="SELECT id, filename FROM photos" --json`, { env });
    const d1Response = JSON.parse(d1Output.toString());
    const photos = d1Response[0].results;

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const localPath = path.join(PHOTOS_DIR, p.filename);
      
      if (!fs.existsSync(localPath)) {
        console.warn(`[${i+1}/${photos.length}] ⚠️  文件缺失: ${p.filename}`);
        continue;
      }

      const ext = path.extname(p.filename).toLowerCase() || '.jpg';
      const r2Orig = `photos/${p.id}/original${ext}`;
      const r2Thumb = `photos/${p.id}/thumbnail.jpg`;

      process.stdout.write(`[${i+1}/${photos.length}] 同步 ID ${p.id}: ${p.filename} ... `);

      try {
        // 上传原图
        execSync(`wrangler r2 object put "${BUCKET_NAME}/${r2Orig}" --file="${localPath}" --remote`, { stdio: 'ignore', env });

        // 生成缩略图
        const thumbBuffer = await sharp(localPath)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        const thumbTemp = path.join(__dirname, `rebuild_thumb_${p.id}.jpg`);
        fs.writeFileSync(thumbTemp, thumbBuffer);
        execSync(`wrangler r2 object put "${BUCKET_NAME}/${r2Thumb}" --file="${thumbTemp}" --remote`, { stdio: 'ignore', env });
        fs.unlinkSync(thumbTemp);
        
        process.stdout.write('OK\n');
      } catch (err: any) {
        console.error(`❌ 失败: ${err.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('\n✨ 全量重建完成！');

    // 5. 记录日志
    console.log('📝 记录迁移日志...');
    const logDetails = `全量同步完成：导入艺人 ${starsData.length} 位，图片 ${localFiles.length} 张。`;
    const logSql = `INSERT INTO activity_logs (action, details) VALUES ('MIGRATION', '${logDetails}');`;
    execSync(`wrangler d1 execute ${DB_NAME} --remote --command="${logSql}" -y`, { stdio: ['inherit', 'inherit', 'ignore'], env });
    console.log('✅ 日志记录成功。');

  } catch (e: any) {
    console.error('❌ 出错:', e.message);
  }
}

fullCleanAndRebuild();
