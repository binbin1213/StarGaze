export async function authMiddleware(request, env) {
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
    }
    catch (e) {
        return { userId: null, error: 'Invalid session data' };
    }
}
export function handleCORS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}
export function jsonResponse(data, status = 200) {
    return Response.json(data, {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
export function errorResponse(message, status = 400) {
    return jsonResponse({ error: message }, status);
}
