import { Env } from '../types';
import { authMiddleware, jsonResponse, errorResponse } from '../middleware/auth';
import { logActivity } from './logs';

/**
 * 创建数据库快照
 */
export async function handleCreateSnapshot(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  if (request.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  try {
    const { name } = await request.json() as { name?: string };
    
    // 获取当前数据，强制排序确保一致性
    const stars = await env.DB.prepare('SELECT * FROM stars ORDER BY id ASC').all();
    const photos = await env.DB.prepare('SELECT * FROM photos ORDER BY id ASC').all();

    const snapshotData = {
      version: '1.0.0',
      export_date: new Date().toISOString(),
      stars: stars.results,
      photos: photos.results
    };

    const ip = request.headers.get('cf-connecting-ip') || '';
    const backupName = name || `快照_${new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')}`;

    await env.DB.prepare(
      'INSERT INTO backups (name, data, user_id, ip) VALUES (?, ?, ?, ?)'
    ).bind(
      backupName,
      JSON.stringify(snapshotData),
      auth.userId,
      ip
    ).run();

    await logActivity(env, auth.userId, 'create_snapshot', `Created database snapshot: ${backupName}`, ip);

    return jsonResponse({ success: true, name: backupName });
  } catch (e) {
    console.error('Create snapshot error:', e);
    return errorResponse('Failed to create snapshot');
  }
}

/**
 * 获取快照列表
 */
export async function handleListSnapshots(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  try {
    const snapshots = await env.DB.prepare(
      `SELECT b.id, b.name, b.user_id, b.ip, b.created_at, u.username as creator 
       FROM backups b 
       LEFT JOIN users u ON b.user_id = u.id 
       ORDER BY b.created_at DESC`
    ).all();

    return jsonResponse(snapshots.results);
  } catch (e) {
    console.error('List snapshots error:', e);
    return errorResponse('Failed to list snapshots');
  }
}

/**
 * 从快照恢复数据
 */
export async function handleRestoreSnapshot(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  if (request.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return errorResponse('Missing snapshot ID');
  }

  try {
    const snapshot = await env.DB.prepare('SELECT * FROM backups WHERE id = ?').bind(id).first<any>();
    if (!snapshot) {
      return errorResponse('Snapshot not found');
    }

    const data = JSON.parse(snapshot.data);
    const { stars, photos } = data;

    // 批量导入逻辑 (参考 handleImport)
    let starsUpdated = 0;
    let photosUpdated = 0;

    for (const star of stars) {
      const fields = Object.keys(star);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(star);
      await env.DB.prepare(`INSERT OR REPLACE INTO stars (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values).run();
      starsUpdated++;
    }

    for (const photo of photos) {
      const photoData = { ...photo };
      // 过滤虚拟字段
      delete (photoData as any).previewUrl;
      delete (photoData as any).thumbnailUrl;
      delete (photoData as any).r2_path;
      delete (photoData as any).chineseName;
      delete (photoData as any).englishName;
      delete (photoData as any).star_name;

      const fields = Object.keys(photoData);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(photoData);
      await env.DB.prepare(`INSERT OR REPLACE INTO photos (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values).run();
      photosUpdated++;
    }

    const ip = request.headers.get('cf-connecting-ip') || '';
    await logActivity(env, auth.userId, 'restore_snapshot', `Restored from snapshot: ${snapshot.name} (${starsUpdated} stars, ${photosUpdated} photos)`, ip);

    return jsonResponse({ success: true, message: `Successfully restored ${starsUpdated} stars and ${photosUpdated} photos` });
  } catch (e) {
    console.error('Restore snapshot error:', e);
    return errorResponse('Failed to restore snapshot');
  }
}

/**
 * 删除快照
 */
export async function handleDeleteSnapshot(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  if (request.method !== 'DELETE') {
    return errorResponse('Method Not Allowed', 405);
  }

  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return errorResponse('Missing snapshot ID');
  }

  try {
    const snapshot = await env.DB.prepare('SELECT name FROM backups WHERE id = ?').bind(id).first<any>();
    if (!snapshot) {
      return errorResponse('Snapshot not found');
    }

    await env.DB.prepare('DELETE FROM backups WHERE id = ?').bind(id).run();

    const ip = request.headers.get('cf-connecting-ip') || '';
    await logActivity(env, auth.userId, 'delete_snapshot', `Deleted snapshot: ${snapshot.name}`, ip);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error('Delete snapshot error:', e);
    return errorResponse('Failed to delete snapshot');
  }
}

/**
 * 下载快照为 JSON
 */
export async function handleDownloadSnapshot(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  const url = new URL(request.url);
  const id = url.pathname.split('/').filter(p => p !== 'download').pop();

  if (!id) {
    return errorResponse('Missing snapshot ID');
  }

  try {
    const snapshot = await env.DB.prepare('SELECT * FROM backups WHERE id = ?').bind(id).first<any>();
    if (!snapshot) {
      return errorResponse('Snapshot not found');
    }

    return new Response(snapshot.data, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_${snapshot.name}_${new Date().getTime()}.json"`,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    console.error('Download snapshot error:', e);
    return errorResponse('Failed to download snapshot');
  }
}
