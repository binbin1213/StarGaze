import { Env } from '../types';
import { authMiddleware, jsonResponse, errorResponse } from '../middleware/auth';
import { logActivity } from './logs';
// @ts-ignore
import jpegDecWasm from '../../node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm';
// @ts-ignore
import jpegEncWasm from '../../node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm';
// @ts-ignore
import pngDecWasm from '../../node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm';
// @ts-ignore
import resizeWasm from '../../node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm';

import * as jpeg from '@jsquash/jpeg';
import * as png from '@jsquash/png';
import resize from '@jsquash/resize';

// Import init functions to manually load Wasm
// @ts-ignore
import { init as initJpegDec } from '@jsquash/jpeg/decode.js';
// @ts-ignore
import { init as initJpegEnc } from '@jsquash/jpeg/encode.js';
// @ts-ignore
import { init as initPngDec } from '@jsquash/png/decode.js';
// @ts-ignore
import { initResize } from '@jsquash/resize';

let modulesInitialized = false;

async function initModules() {
  if (modulesInitialized) return;
  
  try {
    console.log('[Thumbnail] Initializing Wasm modules...');
    await Promise.all([
      initJpegDec(jpegDecWasm),
      initJpegEnc(jpegEncWasm),
      initPngDec(pngDecWasm),
      initResize(resizeWasm)
    ]);
    console.log('[Thumbnail] Wasm modules initialized successfully');
    modulesInitialized = true;
  } catch (e) {
    console.error('[Thumbnail] Failed to initialize Wasm modules:', e);
  }
}

async function generateThumbnail(fileBuffer: ArrayBuffer, mimeType: string): Promise<ArrayBuffer | null> {
  await initModules();
  console.log(`[Thumbnail] Starting generation for ${mimeType}, size: ${fileBuffer.byteLength}`);
  try {
    let imageData;
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      imageData = await jpeg.decode(fileBuffer);
    } else if (mimeType === 'image/png') {
      imageData = await png.decode(fileBuffer);
    } else {
      console.log(`[Thumbnail] Unsupported mime type: ${mimeType}`);
      return null; // Unsupported format for thumbnail
    }
    
    console.log(`[Thumbnail] Decoded image: ${imageData.width}x${imageData.height}`);

    // Calculate new dimensions (max 400px)
    const MAX_SIZE = 400;
    let { width, height } = imageData;
    
    if (width > MAX_SIZE || height > MAX_SIZE) {
      if (width > height) {
        height = Math.round(height * (MAX_SIZE / width));
        width = MAX_SIZE;
      } else {
        width = Math.round(width * (MAX_SIZE / height));
        height = MAX_SIZE;
      }
    }
    
    console.log(`[Thumbnail] Resizing to: ${width}x${height}`);

    const resizedData = await resize(imageData, { width, height });
    console.log(`[Thumbnail] Resized. Encoding to JPEG...`);
    
    const thumbnailBuffer = await jpeg.encode(resizedData);
    console.log(`[Thumbnail] Encoded. Size: ${thumbnailBuffer.byteLength}`);
    
    return thumbnailBuffer;
  } catch (e: any) {
    console.error('[Thumbnail] Generation failed details:', e);
    console.error('[Thumbnail] Stack:', e.stack);
    return null;
  }
}

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  const formData = await request.formData();
  const file = formData.get('file') as unknown as File;
  const starId = formData.get('star_id') as string;

  if (!file) {
    return errorResponse('No file uploaded');
  }

  if (!file.type.startsWith('image/')) {
    return errorResponse('Invalid file type. Only images are allowed.');
  }

  if (file.size > 10 * 1024 * 1024) {
    return errorResponse('File too large. Maximum size is 10MB.');
  }

  try {
    const extension = file.name.split('.').pop() || 'jpg';

    const result = await env.DB.prepare(
      'INSERT INTO photos (filename, original_name, star_id, size, mime_type) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      file.name,
      file.name,
      starId ? parseInt(starId) : null,
      file.size,
      file.type
    ).run();

    const photoId = result.meta.last_row_id;
    const fileBuffer = await file.arrayBuffer();

    await env.R2.put(`photos/${photoId}/original.${extension}`, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate and upload thumbnail
    const thumbnailBuffer = await generateThumbnail(fileBuffer, file.type);
    if (thumbnailBuffer) {
      await env.R2.put(`photos/${photoId}/thumbnail.jpg`, thumbnailBuffer, {
        httpMetadata: { contentType: 'image/jpeg' },
      });
      console.log(`[Upload] Generated thumbnail for ${photoId}`);
    }

    console.log(`[Upload] Successfully uploaded to R2: photos/${photoId}/original.${extension}, Size: ${file.size}`);

    const ip = request.headers.get('cf-connecting-ip') || '';
    await logActivity(env, auth.userId, 'upload_photo', `Uploaded photo: ${file.name} (ID: ${photoId})`, ip);

    const workerUrl = env.WORKER_URL || 'https://api.binbino.cn';

    return jsonResponse({
      id: photoId,
      filename: file.name,
      url: `${workerUrl}/images/${photoId}/original.${extension}`,
      thumbnail: thumbnailBuffer ? `${workerUrl}/images/${photoId}/thumbnail.jpg` : null
    });
  } catch (e) {
    console.error('[Upload] Error:', e);
    return errorResponse('Upload failed');
  }
}

export async function handleBatchUpload(request: Request, env: Env): Promise<Response> {
  const auth = await authMiddleware(request, env);
  if (auth.error) {
    return errorResponse(auth.error, 401);
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('photos') as unknown as File[];
    const starId = formData.get('star_id') as string;
    
    if (!files || files.length === 0) {
      return errorResponse('No files uploaded');
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        if (!file.type.startsWith('image/')) continue;
        
        const extension = file.name.split('.').pop() || 'jpg';
        const result = await env.DB.prepare(
          'INSERT INTO photos (filename, original_name, star_id, size, mime_type) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`,
          file.name,
          starId ? parseInt(starId) : null,
          file.size,
          file.type
        ).run();

        const photoId = result.meta.last_row_id;
        const fileBuffer = await file.arrayBuffer();
        
        await env.R2.put(`photos/${photoId}/original.${extension}`, fileBuffer, {
          httpMetadata: { contentType: file.type },
        });

        // Generate and upload thumbnail
        const thumbnailBuffer = await generateThumbnail(fileBuffer, file.type);
        if (thumbnailBuffer) {
          await env.R2.put(`photos/${photoId}/thumbnail.jpg`, thumbnailBuffer, {
            httpMetadata: { contentType: 'image/jpeg' },
          });
        }
        
        // Debug Log
        console.log(`[BatchUpload] Successfully uploaded to R2: photos/${photoId}/original.${extension}, Size: ${file.size}`);
        
        successCount++;
      } catch (e: any) {
        console.error(`[BatchUpload] Failed to upload ${file.name}:`, e);
        errors.push(`Failed to upload ${file.name}: ${e.message}`);
      }
    }

    if (successCount > 0) {
      const ip = request.headers.get('cf-connecting-ip') || '';
      await logActivity(env, auth.userId, 'batch_upload', `Batch uploaded ${successCount} photos`, ip);
    }

    return jsonResponse({
      success: true,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e) {
    console.error('Batch upload error:', e);
    return errorResponse('Batch upload failed');
  }
}
