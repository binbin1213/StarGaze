const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const CONTAINER_NAME = 'photo-gallery-mongodb';
const DB_NAME = 'photo_gallery'; // 数据库名
const COLLECTIONS = ['stars', 'photos'];
const OUTPUT_DIR = path.join(__dirname, 'migration_data');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

async function exportData() {
    console.log(`🚀 开始从容器 ${CONTAINER_NAME} 导出数据...`);

    for (const col of COLLECTIONS) {
        try {
            const containerPath = `/tmp/${col}.json`;
            const localPath = path.join(OUTPUT_DIR, `${col}.json`);

            console.log(`📦 正在导出集合: ${col}...`);
            
            // 1. 在容器内执行导出
            const uri = `mongodb://admin:photo_gallery_2024@localhost:27017/${DB_NAME}?authSource=admin`;
            execSync(`docker exec ${CONTAINER_NAME} mongoexport --uri="${uri}" --collection ${col} --out ${containerPath} --jsonArray`, { stdio: 'inherit' });

            // 2. 将文件从容器拷贝到本地
            console.log(`🚚 正在拷贝 ${col}.json 到本地...`);
            execSync(`docker cp ${CONTAINER_NAME}:${containerPath} ${localPath}`);
            
            console.log(`✅ ${col} 导出成功: ${localPath}`);
        } catch (error) {
            console.error(`❌ 导出 ${col} 失败:`, error.message);
        }
    }

    console.log('\n✨ 导出完成！请检查 migration_data 目录。');
}

exportData();
