import { Env } from '../types';
import { jsonResponse } from '../middleware/auth';

export async function handleStats(request: Request, env: Env): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, ''); // 移除末尾斜杠

  if (method === 'POST' && (path === '/api/stats/visit' || path === '/api/stats/visit/')) {
    // 增加访问量
    try {
      // 先尝试更新
      const result = await env.DB.prepare('UPDATE site_stats SET value = value + 1, updated_at = CURRENT_TIMESTAMP WHERE key = "visitor_count"').run();
      
      // 如果没有行被更新（说明记录不存在），则插入
      if (result.meta.changes === 0) {
        await env.DB.prepare('INSERT OR IGNORE INTO site_stats (key, value) VALUES ("visitor_count", 1)').run();
      }
      
      const visitorCount = await env.DB.prepare('SELECT value FROM site_stats WHERE key = "visitor_count"').first<{ value: number }>();
      return jsonResponse({ visitorCount: Number(visitorCount?.value || 0) }, 200, {}, request);
    } catch (e) {
      console.error('Visit record error:', e);
      return jsonResponse({ visitorCount: 1 }, 200, {}, request);
    }
  }

  if (method === 'GET') {
    try {
      console.log('Handling GET /api/stats');
      
      // 1. 总照片数
      const photosCount = await env.DB.prepare('SELECT COUNT(*) as total FROM photos').first<{ total: number }>();

      // 2. 总明星数
      const starsCount = await env.DB.prepare('SELECT COUNT(*) as total FROM stars').first<{ total: number }>();
      
      // 3. 学校数量
      const schoolsCount = await env.DB.prepare('SELECT COUNT(DISTINCT university) as total FROM stars WHERE university IS NOT NULL AND university != "" AND university != "未知"').first<{ total: number }>();
      
      // 4. 平均年龄
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

      // 5. 本月新增
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = firstDayOfMonth.toISOString().slice(0, 19).replace('T', ' ');
      const newThisMonth = await env.DB.prepare('SELECT COUNT(*) as total FROM photos WHERE created_at >= ?').bind(monthStartStr).first<{ total: number }>();

      // 6. 获取总访问量
      const visitorResult = await env.DB.prepare('SELECT value FROM site_stats WHERE key = "visitor_count"').first<{ value: number }>();
      
      const responseData = {
        version: "2026-01-14-FINAL-V1",
        totalPhotos: photosCount?.total || 0,
        totalStars: starsCount?.total || 0,
        totalSchools: schoolsCount?.total || 0,
        averageAge: avgAgeResult?.averageAge || 0,
        newThisMonth: newThisMonth?.total || 0,
        visitorCount: Number(visitorResult?.value || 0)
      };

      console.log('Success - Sending data:', JSON.stringify(responseData));

      return jsonResponse(responseData, 200, {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }, request);
    } catch (error: any) {
      console.error('Stats GET Error:', error);
      return jsonResponse({ 
        error: error.message,
        version: "2026-01-14-ERROR",
        visitorCount: 0 
      }, 200, {}, request);
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
