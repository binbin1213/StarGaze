import * as fs from 'fs';
import { execSync } from 'child_process';

const CDN_TXT_PATH = '/Users/binbin/Downloads/photo-gallery/cdn-img.txt';

async function checkLinks() {
    console.log('🔍 开始检测 CDN 链接有效性 (使用 curl)...');
    
    try {
        const content = fs.readFileSync(CDN_TXT_PATH, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        const results = {
            total: lines.length,
            success: 0,
            failed: [] as { line: number, url: string, status: string | number }[]
        };

        for (let i = 0; i < lines.length; i++) {
            const url = lines[i].trim();
            const displayIndex = i + 1;
            
            process.stdout.write(`[${displayIndex}/${lines.length}] 正在检查: ${url.split('/').pop()} ... `);
            
            try {
                // 使用 curl 获取 HTTP 状态码
                const status = execSync(`curl -s -o /dev/null -I -w "%{http_code}" "${url}"`, { timeout: 10000 }).toString().trim();

                if (status === '200' || status === '301' || status === '302') {
                    process.stdout.write(`✅ OK (${status})\n`);
                    results.success++;
                } else {
                    process.stdout.write(`❌ 失败 (${status})\n`);
                    results.failed.push({
                        line: displayIndex,
                        url,
                        status
                    });
                }
            } catch (error: any) {
                process.stdout.write(`❌ 错误 (TIMEOUT/NETWORK)\n`);
                results.failed.push({
                    line: displayIndex,
                    url,
                    status: 'TIMEOUT'
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log('\n📊 检测报告:');
        console.log(`- 总链接数: ${results.total}`);
        console.log(`- 有效链接: ${results.success}`);
        console.log(`- 失效链接: ${results.failed.length}`);

        if (results.failed.length > 0) {
            console.log('\n❌ 以下链接无法访问:');
            results.failed.forEach(f => {
                console.log(`第 ${f.line} 行: ${f.url} (状态: ${f.status})`);
            });
        } else {
            console.log('\n✨ 所有链接均可正常访问！');
        }

    } catch (error: any) {
        console.error('❌ 读取文件或执行过程中出错:', error.message);
    }
}

checkLinks();
