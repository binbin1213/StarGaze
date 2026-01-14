import { Env, Star } from '../types';
import { authMiddleware, jsonResponse, errorResponse } from '../middleware/auth';
import { logActivity } from './logs';

export async function handleStars(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'GET') {
    const stars = await env.DB.prepare(`
      SELECT 
        s.id, s.name, s.name_en, s.thai_name, s.nickname, s.birthday, 
        s.height, s.weight, s.measurements, s.biography, s.avatar_url, 
        s.university, s.major, s.degree, s.representative_works, s.tags, 
        s.created_at, s.updated_at,
        COUNT(p.id) as photo_count,
        (SELECT id FROM photos WHERE star_id = s.id ORDER BY is_primary DESC, created_at DESC LIMIT 1) as primary_photo_id
      FROM stars s
      LEFT JOIN photos p ON s.id = p.star_id
      GROUP BY s.id
      ORDER BY s.name
    `).all<Star & { photo_count: number; primary_photo_id?: number }>();
    return jsonResponse(stars.results, 200, {
      'Cache-Control': 'public, max-age=1800'
    });
  }

  if (method === 'POST') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    try {
      const data = await request.json() as Partial<Star>;
      const result = await env.DB.prepare(
        'INSERT INTO stars (name, name_en, thai_name, nickname, birthday, height, weight, measurements, biography, university, major, degree, representative_works, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        data.name,
        data.name_en || null,
        data.thai_name || null,
        data.nickname || null,
        data.birthday || null,
        data.height || null,
        data.weight || null,
        data.measurements || null,
        data.biography || null,
        data.university || null,
        data.major || null,
        data.degree || null,
        data.representative_works || null,
        data.tags || null
      ).run();

      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, auth.userId, 'create_star', `Created star: ${data.name}`, ip);

      return jsonResponse({ id: result.meta.last_row_id });
    } catch (e) {
      return errorResponse('Invalid request data');
    }
  }

  return errorResponse('Method Not Allowed', 405);
}

export async function handleStarById(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const method = request.method;

  if (method === 'GET') {
    const star = await env.DB.prepare('SELECT * FROM stars WHERE id = ?').bind(id).first<Star>();
    if (!star) {
      return errorResponse('Star not found', 404);
    }

    // 同时获取该艺人的照片，首图优先，其次按创建时间倒序
    const photos = await env.DB.prepare('SELECT * FROM photos WHERE star_id = ? ORDER BY is_primary DESC, created_at DESC').bind(id).all();
    
    return jsonResponse({
      ...star,
      photos: photos.results
    });
  }

  if (method === 'PUT') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    try {
      const data = await request.json() as Partial<Star>;
      await env.DB.prepare(
        'UPDATE stars SET name = ?, name_en = ?, thai_name = ?, nickname = ?, birthday = ?, height = ?, weight = ?, measurements = ?, biography = ?, university = ?, major = ?, degree = ?, representative_works = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(
        data.name,
        data.name_en || null,
        data.thai_name || null,
        data.nickname || null,
        data.birthday || null,
        data.height || null,
        data.weight || null,
        data.measurements || null,
        data.biography || null,
        data.university || null,
        data.major || null,
        data.degree || null,
        data.representative_works || null,
        data.tags || null,
        id
      ).run();

      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, auth.userId, 'update_star', `Updated star: ${data.name} (ID: ${id})`, ip);

      return jsonResponse({ success: true });
    } catch (e) {
      return errorResponse('Invalid request data');
    }
  }

  if (method === 'DELETE') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    const star = await env.DB.prepare('SELECT name FROM stars WHERE id = ?').bind(id).first<{ name: string }>();
    await env.DB.prepare('DELETE FROM stars WHERE id = ?').bind(id).run();
    
    const ip = request.headers.get('cf-connecting-ip') || '';
    await logActivity(env, auth.userId, 'delete_star', `Deleted star: ${star?.name || 'Unknown'} (ID: ${id})`, ip);

    return jsonResponse({ success: true });
  }

  return errorResponse('Method Not Allowed', 405);
}
