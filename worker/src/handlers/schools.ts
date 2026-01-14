import { Env } from '../types';
import { authMiddleware, jsonResponse, errorResponse } from '../middleware/auth';
import { logActivity } from './logs';

export async function handleSchools(request: Request, env: Env): Promise<Response> {
  const method = request.method;

  if (method === 'GET') {
    const schools = await env.DB.prepare(`
      SELECT 
        university as name,
        COUNT(*) as star_count
      FROM stars
      WHERE university IS NOT NULL AND university != ''
      GROUP BY university
      ORDER BY star_count DESC
    `).all();
    return jsonResponse(schools.results);
  }

  if (method === 'POST') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    try {
      const { oldName, newName } = await request.json() as { oldName: string, newName: string };
      if (!oldName || !newName) {
        return errorResponse('Missing oldName or newName');
      }

      const result = await env.DB.prepare(
        'UPDATE stars SET university = ? WHERE university = ?'
      ).bind(newName, oldName).run();

      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, auth.userId, 'update_school', `Renamed school from "${oldName}" to "${newName}" (updated ${result.meta.changes} stars)`, ip);

      return jsonResponse({ success: true });
    } catch (e) {
      return errorResponse('Invalid request data');
    }
  }

  return errorResponse('Method Not Allowed', 405);
}
