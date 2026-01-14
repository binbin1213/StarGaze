import { Env, Photo } from '../types';
import { authMiddleware, jsonResponse, errorResponse } from '../middleware/auth';
import { logActivity } from './logs';

export async function handlePhotos(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'GET') {
    const starId = url.searchParams.get('star_id');
    const all = url.searchParams.get('all') === 'true';
    const search = url.searchParams.get('search');
    const minAge = url.searchParams.get('min_age');
    const maxAge = url.searchParams.get('max_age');
    const minHeight = url.searchParams.get('min_height');
    const maxHeight = url.searchParams.get('max_height');
    const universities = url.searchParams.get('universities');
    const birthMonths = url.searchParams.get('birth_months');
    const degrees = url.searchParams.get('degrees');
    const tags = url.searchParams.get('tags');
    
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (starId) {
      whereClauses.push('p.star_id = ?');
      params.push(starId);
    }

    if (search) {
      whereClauses.push('(s.name LIKE ? OR s.name_en LIKE ? OR s.university LIKE ? OR s.major LIKE ? OR s.representative_works LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (minAge) {
      whereClauses.push("(strftime('%Y', 'now') - strftime('%Y', s.birthday)) >= ?");
      params.push(parseInt(minAge));
    }
    if (maxAge) {
      whereClauses.push("(strftime('%Y', 'now') - strftime('%Y', s.birthday)) <= ?");
      params.push(parseInt(maxAge));
    }

    if (minHeight) {
      whereClauses.push("CAST(s.height AS INTEGER) >= ?");
      params.push(parseInt(minHeight));
    }
    if (maxHeight) {
      whereClauses.push("CAST(s.height AS INTEGER) <= ?");
      params.push(parseInt(maxHeight));
    }

    if (universities) {
      const uniList = universities.split(',');
      const placeholders = uniList.map(() => '?').join(',');
      whereClauses.push(`s.university IN (${placeholders})`);
      params.push(...uniList);
    }

    if (birthMonths) {
      const monthList = birthMonths.split(',');
      const placeholders = monthList.map(() => '?').join(',');
      whereClauses.push(`CAST(strftime('%m', s.birthday) AS INTEGER) IN (${placeholders})`);
      params.push(...monthList.map(m => parseInt(m)));
    }

    if (degrees) {
      const degreeList = degrees.split(',');
      const placeholders = degreeList.map(() => '?').join(',');
      whereClauses.push(`s.degree IN (${placeholders})`);
      params.push(...degreeList);
    }

    if (tags) {
      const tagList = tags.split(',');
      const tagClauses = tagList.map(() => 's.tags LIKE ?').join(' OR ');
      whereClauses.push(`(${tagClauses})`);
      params.push(...tagList.map(t => `%${t}%`));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let query = `
      SELECT DISTINCT
        p.id, p.filename, p.original_name, p.star_id, p.width, p.height, p.size, p.mime_type, p.created_at, p.updated_at, p.tags,
        s.name as chineseName, 
        s.name_en as englishName, 
        s.name as star_name
      FROM photos p 
      LEFT JOIN stars s ON p.star_id = s.id
      ${whereSql ? whereSql + ' AND' : 'WHERE'} (
        p.id IN (
          SELECT id FROM (
            SELECT id, star_id, ROW_NUMBER() OVER (PARTITION BY star_id ORDER BY is_primary DESC, created_at DESC) as rn
            FROM photos
            WHERE star_id IS NOT NULL
          ) WHERE rn = 1
        )
        OR p.star_id IS NULL
      )
      ORDER BY 
        CASE WHEN s.name_en IS NULL OR s.name_en = '' THEN 1 ELSE 0 END,
        s.name_en ASC, 
        s.name ASC, 
        p.id DESC
    `;

    // Count query
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total 
      FROM photos p
      LEFT JOIN stars s ON p.star_id = s.id
      ${whereSql ? whereSql + ' AND' : 'WHERE'} (
        p.id IN (
          SELECT MIN(id) FROM photos WHERE star_id IS NOT NULL GROUP BY star_id
        )
        OR p.star_id IS NULL
      )
    `;
    
    const totalResult = await env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = totalResult?.total || 0;

    if (!all) {
      // Pagination
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const result = await env.DB.prepare(query).bind(...params).all<Photo>();
    const photos = result.results || [];
    
    const photosWithPaths = photos.map((photo) => {
      const baseUrl = env.R2_PUBLIC_URL || 'https://r2.binbino.cn';
      const ext = photo.filename.split('.').pop()?.toLowerCase() || 'jpg';
      return {
        ...photo,
        previewUrl: `${baseUrl}/photos/${photo.id}/original.${ext}`,
        thumbnailUrl: `${baseUrl}/photos/${photo.id}/thumbnail.jpg`,
        r2_path: `/images/${photo.id}`,
      };
    });
    
    return jsonResponse({
      photos: photosWithPaths,
      total
    });
  }

  return errorResponse('Method Not Allowed', 405);
}

export async function handleBatchDelete(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  if (request.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  try {
    const { ids } = await request.json() as { ids: number[] };
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('Invalid request data');
    }

    // Delete from R2 first
    for (const id of ids) {
      // List all objects with the prefix photos/{id}/
      const list = await env.R2.list({ prefix: `photos/${id}/` });
      const keys = list.objects.map(obj => obj.key);
      if (keys.length > 0) {
        await env.R2.delete(keys);
      }
    }

    // Delete from DB
    const placeholders = ids.map(() => '?').join(',');
    await env.DB.prepare(`DELETE FROM photos WHERE id IN (${placeholders})`)
      .bind(...ids)
      .run();

    const ip = request.headers.get('cf-connecting-ip') || '';
    await logActivity(env, auth.userId || null, 'batch_delete_photos', `Deleted ${ids.length} photos (IDs: ${ids.join(', ')})`, ip);

    return jsonResponse({ success: true, count: ids.length });
  } catch (e) {
    console.error('Batch delete error:', e);
    return errorResponse('Batch delete failed');
  }
}

export async function handleBatchUpdate(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  if (request.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  try {
    const { updates } = await request.json() as { updates: any[] };
    if (!updates || !Array.isArray(updates)) {
      return errorResponse('Invalid updates data');
    }

    const results = [];
    for (const data of updates) {
      const { id, chineseName, englishName, tags } = data;
      if (!id) continue;

      let star_id = data.star_id;

      // 如果提供了名字但没有 star_id，尝试查找
      if (!star_id && (chineseName || englishName)) {
        const star = await env.DB.prepare(
          'SELECT id FROM stars WHERE name = ? OR name_en = ?'
        ).bind(chineseName || '', englishName || '').first<{ id: number }>();
        if (star) {
          star_id = star.id;
        }
      }

      const fields: string[] = [];
      const params: any[] = [];

      if (star_id !== undefined) {
        fields.push('star_id = ?');
        params.push(star_id);
      }
      if (tags !== undefined) {
        fields.push('tags = ?');
        params.push(tags);
      }

      if (fields.length > 0) {
        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);
        await env.DB.prepare(
          `UPDATE photos SET ${fields.join(', ')} WHERE id = ?`
        ).bind(...params).run();
        results.push(id);
      }
    }

    if (results.length > 0) {
      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, auth.userId || null, 'batch_update_photos', `Batch updated ${results.length} photos (IDs: ${results.join(', ')})`, ip);
    }

    return jsonResponse({ success: true, updated: results.length });
  } catch (e) {
    console.error('Batch update error:', e);
    return errorResponse('Batch update failed');
  }
}

export async function handleUnbindAllPhotos(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  if (request.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  try {
    const { confirm } = await request.json() as { confirm: boolean };
    if (!confirm) {
      return errorResponse('Missing confirmation');
    }

    // 获取当前已绑定的照片数量
    const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM photos WHERE star_id IS NOT NULL').first<{ count: number }>();
    const count = countResult?.count || 0;

    if (count === 0) {
      return jsonResponse({ success: true, count: 0, message: 'No photos to unbind' });
    }

    // 执行解绑：将 star_id 设为 NULL，同时重置首图标识
    await env.DB.prepare('UPDATE photos SET star_id = NULL, is_primary = 0 WHERE star_id IS NOT NULL').run();

    const ip = request.headers.get('cf-connecting-ip') || '';
    await logActivity(env, auth.userId || null, 'unbind_all_photos', `Unbound all photos from stars (Affected: ${count} photos)`, ip);

    return jsonResponse({ success: true, count });
  } catch (e) {
    console.error('Unbind all error:', e);
    return errorResponse('Unbind all failed');
  }
}

export async function handlePhotoById(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const photoId = url.pathname.split('/').pop();
  const method = request.method;

  if (method === 'PATCH') {
    const auth = await authMiddleware(request, env);
    // Temporarily allow PATCH without auth for data correction
    /*
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }
    */

    try {
      const data = await request.json() as any;
      const fields: string[] = [];
      const params: any[] = [];

      if (data.star_id !== undefined) {
        fields.push('star_id = ?');
        params.push(data.star_id);
      }

      if (data.tags !== undefined) {
        fields.push('tags = ?');
        params.push(data.tags);
      }

      if (data.is_primary !== undefined) {
        fields.push('is_primary = ?');
        params.push(data.is_primary ? 1 : 0);
      }

      if (fields.length === 0) {
        return errorResponse('No fields to update');
      }

      // 如果要设为首图，需要先把该艺人的其他照片首图取消
      if (data.is_primary) {
        // 先获取该照片所属的 star_id
        const photo = await env.DB.prepare('SELECT star_id FROM photos WHERE id = ?').bind(photoId).first<Photo>();
        const targetStarId = data.star_id !== undefined ? data.star_id : photo?.star_id;
        
        if (targetStarId) {
          await env.DB.prepare('UPDATE photos SET is_primary = 0 WHERE star_id = ?').bind(targetStarId).run();
        }
      }

      params.push(photoId);
      await env.DB.prepare(`UPDATE photos SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(...params)
        .run();

      const ip = request.headers.get('cf-connecting-ip') || '';
      const photo = await env.DB.prepare('SELECT original_name FROM photos WHERE id = ?').bind(photoId).first<{ original_name: string }>();
      await logActivity(env, auth.userId || null, 'update_photo', `Updated photo ${photo?.original_name || photoId} (ID: ${photoId}): ${fields.join(', ')}`, ip);

      return jsonResponse({ success: true });
    } catch (e) {
      return errorResponse('Update failed');
    }
  }

  if (method === 'GET') {
    const photo = await env.DB.prepare(
      'SELECT p.*, s.name as star_name FROM photos p LEFT JOIN stars s ON p.star_id = s.id WHERE p.id = ?'
    ).bind(photoId).first<Photo>();

    if (!photo) {
      return errorResponse('Photo not found', 404);
    }

    const photoWithPath = {
      ...photo,
      r2_path: `/images/${photo.id}`,
    };

    return jsonResponse(photoWithPath);
  }

  if (method === 'PUT') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    try {
      const data = await request.json() as any;
      
      const updates: string[] = [];
      const params: any[] = [];

      if (data.star_id !== undefined) {
        updates.push('star_id = ?');
        params.push(data.star_id);
      }

      if (data.original_name !== undefined) {
        updates.push('original_name = ?');
        params.push(data.original_name);
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(photoId);

        await env.DB.prepare(
          `UPDATE photos SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...params).run();
      }

      // 批量编辑逻辑：同时更新关联的明星信息
      if (data.chineseName !== undefined || data.englishName !== undefined || data.tags !== undefined) {
        const photo = await env.DB.prepare('SELECT star_id FROM photos WHERE id = ?').bind(photoId).first<Photo>();
        if (photo && photo.star_id) {
          const starUpdates: string[] = [];
          const starParams: any[] = [];
          
          if (data.chineseName !== undefined) {
            starUpdates.push('name = ?');
            starParams.push(data.chineseName);
          }
          if (data.englishName !== undefined) {
            starUpdates.push('name_en = ?');
            starParams.push(data.englishName);
          }
          if (data.tags !== undefined) {
            starUpdates.push('tags = ?');
            starParams.push(data.tags);
          }
          
          if (starUpdates.length > 0) {
            starUpdates.push('updated_at = CURRENT_TIMESTAMP');
            starParams.push(photo.star_id);
            await env.DB.prepare(`UPDATE stars SET ${starUpdates.join(', ')} WHERE id = ?`).bind(...starParams).run();
          }
        }
      }

      const ip = request.headers.get('cf-connecting-ip') || '';
      const photoInfo = await env.DB.prepare('SELECT original_name FROM photos WHERE id = ?').bind(photoId).first<{ original_name: string }>();
      await logActivity(env, auth.userId || null, 'update_photo_content', `Updated content/association for photo ${photoInfo?.original_name || photoId} (ID: ${photoId})`, ip);
      
      return jsonResponse({ success: true });
    } catch (e) {
      console.error('Update photo error:', e);
      return errorResponse('Update failed');
    }
  }

  if (method === 'DELETE') {
    const auth = await authMiddleware(request, env);
    if (auth.error) {
      return errorResponse(auth.error, 401);
    }

    try {
      // List all objects with the prefix photos/{id}/
      const list = await env.R2.list({ prefix: `photos/${photoId}/` });
      const keys = list.objects.map(obj => obj.key);
      if (keys.length > 0) {
        await env.R2.delete(keys);
      }

      const photo = await env.DB.prepare('SELECT original_name FROM photos WHERE id = ?').bind(photoId).first<{ original_name: string }>();
      await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(photoId).run();
      
      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, auth.userId || null, 'delete_photo', `Deleted photo: ${photo?.original_name || 'Unknown'} (ID: ${photoId})`, ip);

      return jsonResponse({ success: true });
    } catch (e) {
      console.error('Delete photo error:', e);
      return errorResponse('Delete failed');
    }
  }

  return errorResponse('Method Not Allowed', 405);
}
