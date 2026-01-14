import { Env, User } from '../types';
import { authMiddleware, jsonResponse, errorResponse } from '../middleware/auth';
import { generateToken } from '../utils/crypto';
import { logActivity } from './logs';
import bcrypt from 'bcryptjs';

interface LoginRequest {
  username?: string;
  password?: string;
}

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'POST' && path === '/api/auth/login') {
    try {
      const { username, password } = await request.json() as LoginRequest;

      if (!username || !password) {
        return errorResponse('Username and password are required');
      }

      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE username = ?'
      ).bind(username).first<User>();

      if (!user) {
        return errorResponse('Invalid credentials', 401);
      }

      const bcrypt = (await import('bcryptjs')).default;
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return errorResponse('Invalid credentials', 401);
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await env.KV.put(`session:${token}`, JSON.stringify({
        user_id: user.id,
        expires_at: expiresAt.toISOString(),
      }), {
        expirationTtl: 86400,
      });

      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, user.id, 'login', `User ${username} logged in`, ip);

      return jsonResponse({ token });
    } catch (e) {
      console.error('Login error:', e);
      return errorResponse('Login failed');
    }
  }

  if (method === 'POST' && path === '/api/auth/logout') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.substring(7);

    if (token) {
      await env.KV.delete(`session:${token}`);
    }

    return jsonResponse({ success: true });
  }

  if (method === 'GET' && path === '/api/auth/verify') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    return jsonResponse({ valid: true, userId: auth.userId });
  }

  if (method === 'POST' && path === '/api/auth/change-password') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    try {
      const { currentPassword, newPassword } = await request.json() as { currentPassword?: string, newPassword?: string };

      if (!currentPassword || !newPassword) {
        return errorResponse('Current and new password are required');
      }

      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(auth.userId).first<User>();

      if (!user) {
        return errorResponse('User not found', 404);
      }

      const bcrypt = (await import('bcryptjs')).default;
      const valid = await bcrypt.compare(currentPassword, user.password_hash);

      if (!valid) {
        return errorResponse('当前密码错误', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);

      await env.DB.prepare(
        'UPDATE users SET password_hash = ? WHERE id = ?'
      ).bind(newHash, auth.userId).run();

      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, auth.userId, 'update_password', `User changed password`, ip);

      return jsonResponse({ success: true });
    } catch (e) {
      console.error('Password change error:', e);
      return errorResponse('修改密码失败');
    }
  }

  return errorResponse('Not Found', 404);
}
