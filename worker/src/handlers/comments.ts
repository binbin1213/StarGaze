import { Env } from '../types';
import { authMiddleware, jsonResponse, errorResponse } from '../middleware/auth';
import { logActivity } from './logs';

export async function handleComments(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  // 管理员获取全站评论
  if (method === 'GET') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    const comments = await env.DB.prepare(`
      SELECT c.*, s.name as star_name, s.name_en as star_name_en
      FROM star_comments c
      LEFT JOIN stars s ON c.star_id = s.id
      ORDER BY c.created_at DESC
    `).all();

    return jsonResponse(comments.results);
  }

  return errorResponse('Method Not Allowed', 405);
}

export async function handleCommentsByStar(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const starId = url.pathname.split('/')[3]; // /api/stars/:id/comments
  const method = request.method;

  if (method === 'GET') {
    const comments = await env.DB.prepare(`
      SELECT id, nickname, content, created_at 
      FROM star_comments 
      WHERE star_id = ? 
      ORDER BY created_at DESC
    `).bind(starId).all();

    return jsonResponse(comments.results);
  }

  if (method === 'POST') {
    try {
      const data = await request.json() as { nickname: string; content: string };
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';

      if (!data.nickname || !data.content) {
        return errorResponse('昵称和评价内容不能为空');
      }

      // 1. IP 限制：单个 IP 对单个艺人仅限一条
      const existing = await env.DB.prepare(
        'SELECT id FROM star_comments WHERE star_id = ? AND ip_address = ?'
      ).bind(starId, ip).first();

      if (existing) {
        return errorResponse('您已经评价过这位艺人了哦', 403);
      }

      // 2. 写入数据库
      await env.DB.prepare(
        'INSERT INTO star_comments (star_id, nickname, content, ip_address) VALUES (?, ?, ?, ?)'
      ).bind(starId, data.nickname, data.content, ip).run();

      return jsonResponse({ success: true });
    } catch (e) {
      return errorResponse('提交评价失败');
    }
  }

  return errorResponse('Method Not Allowed', 405);
}

export async function handleCommentById(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const method = request.method;

  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  if (method === 'PUT') {
    try {
      const data = await request.json() as { nickname?: string; content?: string };
      await env.DB.prepare(
        'UPDATE star_comments SET nickname = COALESCE(?, nickname), content = COALESCE(?, content), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(data.nickname || null, data.content || null, id).run();

      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, auth.userId, 'update_comment', `Updated comment ID: ${id}`, ip);

      return jsonResponse({ success: true });
    } catch (e) {
      return errorResponse('更新评价失败');
    }
  }

  if (method === 'DELETE') {
    await env.DB.prepare('DELETE FROM star_comments WHERE id = ?').bind(id).run();
    
    const ip = request.headers.get('cf-connecting-ip') || '';
    await logActivity(env, auth.userId, 'delete_comment', `Deleted comment ID: ${id}`, ip);

    return jsonResponse({ success: true });
  }

  return errorResponse('Method Not Allowed', 405);
}
