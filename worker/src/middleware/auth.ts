import { Env } from '../types';

export interface AuthResult {
  userId: number | null;
  error?: string;
}

export async function authMiddleware(request: Request, env: Env): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7);
  const session = await env.KV.get(`session:${token}`);

  if (!session) {
    return { userId: null, error: 'Invalid or expired token' };
  }

  try {
    const data = JSON.parse(session);
    
    if (new Date(data.expires_at) < new Date()) {
      await env.KV.delete(`session:${token}`);
      return { userId: null, error: 'Token expired' };
    }

    return { userId: data.user_id };
  } catch (e) {
    return { userId: null, error: 'Invalid session data' };
  }
}

export function handleCORS(request?: Request): Response {
  const origin = request?.headers.get('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export function jsonResponse(data: any, status: number = 200, headers: Record<string, string> = {}, request?: Request): Response {
  const origin = request?.headers.get('Origin') || '*';
  return Response.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      ...headers,
    },
  });
}

export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}
