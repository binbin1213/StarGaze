import * as fs from 'fs';
import * as path from 'path';

const CDN_TXT_PATH = '/Users/binbin/Downloads/photo-gallery/cdn-img.txt';
const PHOTOS_DIR = '/Users/binbin/Downloads/photo-gallery/photos';

function checkDiff() {
    const cdnFiles = new Set(
        fs.readFileSync(CDN_TXT_PATH, 'utf8')
            .split('\n')
            .filter(l => l.trim())
            .map(l => l.trim().split('/').pop()?.split('?')[0])
    );

    const localFiles = fs.readdirSync(PHOTOS_DIR).filter(f => 
        ['.jpg', '.jpeg', '.png', '.webp', '.JPG'].includes(path.extname(f))
    );

    console.log('--- 差异分析 ---');
    console.log(`CDN 总数: ${cdnFiles.size}`);
    console.log(`本地总数: ${localFiles.length}`);

    const onlyInLocal = localFiles.filter(f => !cdnFiles.has(f));
    console.log(`\n仅存在于本地 (${onlyInLocal.length}个):`);
    onlyInLocal.forEach(f => console.log(`- ${f}`));

    const onlyInCDN = Array.from(cdnFiles).filter(f => !localFiles.includes(f!));
    console.log(`\n仅存在于 CDN (${onlyInCDN.length}个):`);
    onlyInCDN.forEach(f => console.log(`- ${f}`));
}

checkDiff();
