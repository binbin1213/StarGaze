import { Env } from './types';
import { handleCORS } from './middleware/auth';
import { handleStars, handleStarById } from './handlers/stars';
import { handleComments, handleCommentsByStar, handleCommentById } from './handlers/comments';
import { handlePhotos, handlePhotoById } from './handlers/photos';
import { handleUpload, handleBatchUpload } from './handlers/upload';
import { handleAuth } from './handlers/auth';
import { handleImageProxy } from './handlers/image';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      if (path.startsWith('/images/')) {
        return handleImageProxy(request, env, ctx);
      }

      if (path === '/api/stars') {
        return handleStars(request, env);
      }

      if (path === '/api/comments') {
        return handleComments(request, env);
      }

      if (path.match(/^\/api\/comments\/\d+$/)) {
        return handleCommentById(request, env);
      }
      
      if (path === '/api/stats' || path === '/api/stats/visit') {
        const { handleStats } = await import('./handlers/stats');
        return handleStats(request, env);
      }

      if (path === '/api/schools') {
        const { handleSchools } = await import('./handlers/schools');
        return handleSchools(request, env);
      }

      if (path === '/api/settings') {
        const { handleSettings } = await import('./handlers/settings');
        return handleSettings(request, env);
      }

      if (path === '/api/export') {
        const { handleExport } = await import('./handlers/export');
        return handleExport(request, env);
      }

      if (path === '/api/import') {
        const { handleImport } = await import('./handlers/export');
        return handleImport(request, env);
      }

      if (path === '/api/snapshots') {
        const { handleListSnapshots, handleCreateSnapshot } = await import('./handlers/snapshots');
        if (request.method === 'POST') return handleCreateSnapshot(request, env);
        return handleListSnapshots(request, env);
      }

      if (path.match(/^\/api\/snapshots\/\d+$/)) {
        const { handleRestoreSnapshot, handleDeleteSnapshot } = await import('./handlers/snapshots');
        if (request.method === 'DELETE') return handleDeleteSnapshot(request, env);
        return handleRestoreSnapshot(request, env);
      }

      if (path.match(/^\/api\/snapshots\/\d+\/download$/)) {
        const { handleDownloadSnapshot } = await import('./handlers/snapshots');
        return handleDownloadSnapshot(request, env);
      }
      
      if (path.match(/^\/api\/stars\/\d+$/)) {
        return handleStarById(request, env);
      }

      if (path.match(/^\/api\/stars\/\d+\/comments$/)) {
        return handleCommentsByStar(request, env);
      }
      
      if (path === '/api/photos') {
        return handlePhotos(request, env);
      }
      
      if (path === '/api/photos/batch-delete') {
        const { handleBatchDelete } = await import('./handlers/photos');
        return handleBatchDelete(request, env);
      }

      if (path === '/api/photos/batch-update') {
        const { handleBatchUpdate } = await import('./handlers/photos');
        return handleBatchUpdate(request, env);
      }

      if (path === '/api/photos/unbind-all') {
        const { handleUnbindAllPhotos } = await import('./handlers/photos');
        return handleUnbindAllPhotos(request, env);
      }

      if (path.match(/^\/api\/photos\/\d+$/)) {
        return handlePhotoById(request, env);
      }
      
      if (path === '/api/upload') {
        return handleUpload(request, env);
      }

      if (path === '/api/upload-multiple') {
        return handleBatchUpload(request, env);
      }

      if (path === '/api/logs') {
        const { handleLogs } = await import('./handlers/logs');
        return handleLogs(request, env);
      }
      
      if (path.startsWith('/api/auth')) {
        return handleAuth(request, env);
      }
      
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
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
