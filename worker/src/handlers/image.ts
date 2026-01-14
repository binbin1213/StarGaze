import { Env, Photo } from '../types';

export async function handleImageProxy(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  
  // Try to find in Cloudflare Cache first
  const cache = caches.default;
  let cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const path = url.pathname;
  const photoId = path.split('/')[2];
  const size = url.searchParams.get('size'); // 'thumbnail' or undefined

  if (!photoId) {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(photoId).first<Photo>();
    
    if (!photo) {
      return new Response('Photo not found', { status: 404 });
    }

    let object;

    // If thumbnail requested, try to fetch it
    if (size === 'thumbnail') {
      object = await env.R2.get(`photos/${photo.id}/thumbnail.jpg`);
      if (object) {
        return new Response(object.body, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      // Fallback to original if thumbnail not found
    }

    // 尝试所有可能的路径和后缀组合
    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
    
    // 1. 绝对优先尝试直接基于 filename 的路径: photos/{filename}
    // 这是最准确的，因为数据库里的 filename 记录了上传时的真实路径
    if (!object && photo.filename) {
      // 尝试多种可能的 filename 路径格式
      const possibleKeys = [
        `photos/${photo.filename}`,
        photo.filename,
        `images/${photo.filename}`
      ];
      
      for (const key of possibleKeys) {
        object = await env.R2.get(key);
        if (object) {
          break;
        }
      }
    }

    // 2. 尝试基于 ID 的路径: photos/{id}/original.{ext}
    if (!object) {
      for (const ext of extensions) {
        const key = `photos/${photo.id}/original.${ext}`;
        object = await env.R2.get(key);
        if (object) {
          break;
        }
      }
    }

    // 3. 尝试其他可能存在的旧路径格式 (文件名部分)
    if (!object && photo.filename) {
      const filenameOnly = photo.filename.split('/').pop();
      if (filenameOnly) {
        const fallbackKeys = [
          `photos/${filenameOnly}`,
          `images/${filenameOnly}`,
          filenameOnly,
          // 增加：直接尝试数据库里的 r2_path (如果它包含 /photos/ 前缀)
          (photo as any).r2_path?.startsWith('/') ? (photo as any).r2_path.substring(1) : (photo as any).r2_path
        ].filter(Boolean) as string[];
        
        for (const key of fallbackKeys) {
          object = await env.R2.get(key);
          if (object) {
            break;
          }
        }
      }
    }

    if (!object) {
      return new Response('Image not found in R2', { status: 404 });
    }

    const response = new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || photo.mime_type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });

    // Cache the response
    ctx.waitUntil(cache.put(request, response.clone()));

    return response;
  } catch (error) {
    console.error('Image proxy error:', error);
    return new Response('Failed to fetch image', { status: 500 });
  }
}
