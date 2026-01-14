import { Env } from '../types';
import { authMiddleware, jsonResponse, errorResponse } from '../middleware/auth';
import { logActivity } from './logs';

export async function handleSettings(request: Request, env: Env): Promise<Response> {
  const method = request.method;

  if (method === 'GET') {
    const settingsStr = await env.KV.get('site_settings');
    const settings = settingsStr ? JSON.parse(settingsStr) : {
      siteName: '泰海图鉴',
      footerText: '© 2026 泰海图鉴 - 记录每一个闪耀时刻',
      allowDownload: true,
      statsVisible: true
    };
    return jsonResponse(settings);
  }

  if (method === 'POST') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    try {
      const data = await request.json() as any;
      await env.KV.put('site_settings', JSON.stringify(data));
      
      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, auth.userId, 'update_settings', `Updated site settings: ${data.siteName || 'Unknown'}`, ip);
      
      return jsonResponse({ success: true });
    } catch (e) {
      return errorResponse('Invalid settings data');
    }
  }

  return errorResponse('Method Not Allowed', 405);
}
