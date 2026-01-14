import { handleCORS } from './middleware/auth';
import { handleStars, handleStarById } from './handlers/stars';
import { handlePhotos, handlePhotoById } from './handlers/photos';
import { handleUpload } from './handlers/upload';
import { handleAuth } from './handlers/auth';
import { handleImageProxy } from './handlers/image';
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        if (request.method === 'OPTIONS') {
            return handleCORS();
        }
        try {
            if (path === '/api/stars') {
                return handleStars(request, env);
            }
            if (path.match(/^\/api\/stars\/\d+$/)) {
                return handleStarById(request, env);
            }
            if (path === '/api/photos') {
                return handlePhotos(request, env);
            }
            if (path.match(/^\/api\/photos\/\d+$/)) {
                return handlePhotoById(request, env);
            }
            if (path === '/api/upload') {
                return handleUpload(request, env);
            }
            if (path.startsWith('/api/auth')) {
                return handleAuth(request, env);
            }
            if (path.match(/^\/images\/\d+$/)) {
                return handleImageProxy(request, env);
            }
            return new Response('Not Found', {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
        catch (error) {
            console.error('API Error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
    },
};
