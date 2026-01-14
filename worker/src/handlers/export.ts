import { Env } from '../types';
import { authMiddleware, jsonResponse, errorResponse } from '../middleware/auth';
import { logActivity } from './logs';

export async function handleExport(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  try {
    // 获取所有艺人数据
    const stars = await env.DB.prepare('SELECT * FROM stars ORDER BY id ASC').all();
    
    // 获取所有照片数据
    const photos = await env.DB.prepare('SELECT * FROM photos ORDER BY id ASC').all();

    const exportData = {
      version: '1.0.0',
      export_date: new Date().toISOString(),
      stars: stars.results,
      photos: photos.results
    };

    const ip = request.headers.get('cf-connecting-ip') || '';
    await logActivity(env, auth.userId, 'export_data', `Exported full database backup (${stars.results.length} stars, ${photos.results.length} photos)`, ip);

    return jsonResponse(exportData);
  } catch (e) {
    console.error('Export error:', e);
    return errorResponse('Failed to export data');
  }
}

export async function handleImport(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  if (request.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  try {
    const data = await request.json() as any;
    if (!data.stars || !data.photos) {
      return errorResponse('Invalid import data format');
    }

    const { stars, photos } = data;
    let starsUpdated = 0;
    let photosUpdated = 0;

    // 导入艺人数据 - 使用 REPLACE 确保存在则更新，不存在则插入
    for (const star of stars) {
      const fields = Object.keys(star);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(star);
      
      await env.DB.prepare(
        `INSERT OR REPLACE INTO stars (${fields.join(', ')}) VALUES (${placeholders})`
      ).bind(...values).run();
      starsUpdated++;
    }

    // 导入照片数据
    for (const photo of photos) {
      // 过滤掉虚拟字段（如 previewUrl, thumbnailUrl 等，如果存在的话）
      const photoData = { ...photo };
      delete photoData.previewUrl;
      delete photoData.thumbnailUrl;
      delete photoData.r2_path;
      delete photoData.chineseName;
      delete photoData.englishName;
      delete photoData.star_name;

      const fields = Object.keys(photoData);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(photoData);

      await env.DB.prepare(
        `INSERT OR REPLACE INTO photos (${fields.join(', ')}) VALUES (${placeholders})`
      ).bind(...values).run();
      photosUpdated++;
    }

    const ip = request.headers.get('cf-connecting-ip') || '';
    await logActivity(env, auth.userId, 'import_data', `Imported database backup (${starsUpdated} stars, ${photosUpdated} photos)`, ip);

    return jsonResponse({
      success: true,
      message: `Successfully imported ${starsUpdated} stars and ${photosUpdated} photos`,
      starsCount: starsUpdated,
      photosCount: photosUpdated
    });
  } catch (e) {
    console.error('Import error:', e);
    return errorResponse('Failed to import data: ' + (e instanceof Error ? e.message : String(e)));
  }
}
