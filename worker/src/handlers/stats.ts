import { Env } from '../types';
import { jsonResponse } from '../middleware/auth';

export async function handleStats(request: Request, env: Env): Promise<Response> {
  const method = request.method;

  if (method === 'POST' && new URL(request.url).pathname === '/api/stats/visit') {
    // 增加访问量
    await env.DB.prepare('UPDATE site_stats SET value = value + 1, updated_at = CURRENT_TIMESTAMP WHERE key = "visitor_count"').run();
    const visitorCount = await env.DB.prepare('SELECT value FROM site_stats WHERE key = "visitor_count"').first<{ value: number }>();
    return jsonResponse({ visitorCount: visitorCount?.value || 0 });
  }

  if (method === 'GET') {
    // 1. 总照片数
    const photosCount = await env.DB.prepare('SELECT COUNT(*) as total FROM photos').first<{ total: number }>();

    // 2. 总明星数
    const starsCount = await env.DB.prepare('SELECT COUNT(*) as total FROM stars').first<{ total: number }>();
    
    // 3. 学校数量 (去重后的大学数量)
    const schoolsCount = await env.DB.prepare('SELECT COUNT(DISTINCT university) as total FROM stars WHERE university IS NOT NULL AND university != "" AND university != "未知"').first<{ total: number }>();
    
    // 4. 平均年龄 (在数据库端计算，排除无效日期和未来日期)
    const avgAgeResult = await env.DB.prepare(`
      SELECT ROUND(AVG(
        CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', birthday) AS INTEGER) - 
        (strftime('%m-%d', 'now') < strftime('%m-%d', birthday))
      )) as averageAge
      FROM stars 
      WHERE birthday IS NOT NULL 
      AND birthday != "" 
      AND birthday != "未知"
      AND birthday GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
      AND birthday < date('now')
    `).first<{ averageAge: number }>();

    // 5. 本月新增 (照片)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = firstDayOfMonth.toISOString().slice(0, 19).replace('T', ' '); // 匹配 SQLite 格式
    const newThisMonth = await env.DB.prepare('SELECT COUNT(*) as total FROM photos WHERE created_at >= ?').bind(monthStartStr).first<{ total: number }>();

    // 6. 获取总访问量
    const visitorCount = await env.DB.prepare('SELECT value FROM site_stats WHERE key = "visitor_count"').first<{ value: number }>();

    return jsonResponse({
      totalPhotos: photosCount?.total || 0,
      totalStars: starsCount?.total || 0,
      totalSchools: schoolsCount?.total || 0,
      averageAge: avgAgeResult?.averageAge || 0,
      newThisMonth: newThisMonth?.total || 0,
      visitorCount: visitorCount?.value || 0
    }, 200, {
      'Cache-Control': 'public, max-age=60' // 统计数据更新频率较高，缓存时间缩短
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
