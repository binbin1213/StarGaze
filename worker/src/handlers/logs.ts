import { authMiddleware, errorResponse, jsonResponse } from '../middleware/auth';
import { Env } from '../types';

export async function handleLogs(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const action = url.searchParams.get('action');
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT l.*, u.username FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id';
    const params: any[] = [];

    if (action) {
      query += ' WHERE l.action = ?';
      params.push(action);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = await env.DB.prepare(query).bind(...params).all();

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs';
    const countParams: any[] = [];
    if (action) {
      countQuery += ' WHERE action = ?';
      countParams.push(action);
    }
    const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    return jsonResponse({
      logs: logs.results,
      pagination: {
        page,
        limit,
        total: totalResult?.total || 0,
        totalPages: Math.ceil((totalResult?.total || 0) / limit)
      }
    });
  } catch (e) {
    console.error('Logs API error:', e);
    return errorResponse('Failed to fetch logs');
  }
}

export async function logActivity(
  env: Env, 
  userId: number | null, 
  action: string, 
  details?: string, 
  ipAddress?: string
) {
  try {
    await env.DB.prepare(
      'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(userId, action, details || null, ipAddress || null).run();
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}
