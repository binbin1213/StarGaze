import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const STARS_JSON_PATH = '/Users/binbin/Downloads/photo-gallery/stars.json';

async function migrate() {
    if (!fs.existsSync(STARS_JSON_PATH)) {
        console.error(`❌ 找不到文件: ${STARS_JSON_PATH}`);
        return;
    }

    const stars = JSON.parse(fs.readFileSync(STARS_JSON_PATH, 'utf8'));
    console.log(`🚀 开始准备迁移 ${stars.length} 条艺人数据...`);

    const sqlFile = './scripts/migration.sql';
    let sqlContent = 'DELETE FROM photos; DELETE FROM stars; DELETE FROM sqlite_sequence WHERE name IN (\'photos\', \'stars\');\n';

    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const starName = (star.chineseName || star.englishName || '未知').trim().replace(/'/g, "''");
        const starNameEn = (star.englishName || '').trim().replace(/'/g, "''");
        const birthday = star.birthDate?.$date ? new Date(star.birthDate.$date).toISOString().split('T')[0] : '';
        const height = star.height ? String(star.height) : '';
        const weight = star.weight ? String(star.weight) : '';
        const bio = (star.description || '').replace(/'/g, "''");
        
        // 插入艺人，使用自增 ID
        sqlContent += `INSERT INTO stars (id, name, name_en, birthday, height, weight, biography) VALUES (${i + 1}, '${starName}', '${starNameEn}', '${birthday}', '${height}', '${weight}', '${bio}');\n`;
        
        // 插入照片元数据
        if (star.photoFilename) {
            const photoFilename = star.photoFilename.replace(/'/g, "''");
            sqlContent += `INSERT INTO photos (filename, original_name, star_id) VALUES ('${photoFilename}', '${photoFilename}', ${i + 1});\n`;
        }
    }

    console.log('📝 正在写入 SQL 文件...');
    fs.writeFileSync(sqlFile, sqlContent);

    console.log('⚡️ 正在批量执行 SQL 到 D1...');
    try {
        execSync(`wrangler d1 execute photo-gallery-db --remote --file="${sqlFile}" -y`);
        console.log('✨ 迁移完成！清理临时文件...');
    } catch (e: any) {
        console.error('❌ 执行 SQL 失败:', e.message);
    } finally {
        if (fs.existsSync(sqlFile)) {
            fs.unlinkSync(sqlFile);
        }
    }
}

migrate();
