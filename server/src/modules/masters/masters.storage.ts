import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { getSupabaseStorageAdmin } from '../../lib/supabaseStorageAdmin.js';
import { ApiError } from '../../utils/ApiError.js';

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function masterMediaBucket(): string {
  const alt = env.SUPABASE_MASTER_MEDIA_BUCKET?.trim();
  if (alt) return alt;
  return env.SUPABASE_PROFILE_BUCKET.trim() || 'profile';
}

function assertStorage(): NonNullable<ReturnType<typeof getSupabaseStorageAdmin>> {
  const client = getSupabaseStorageAdmin();
  if (!client) {
    throw ApiError.serviceUnavailable(
      'Media upload is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server)',
      'NO_SUPABASE_STORAGE',
    );
  }
  return client;
}

function validateImage(buffer: Buffer, mimeType: string, maxBytes: number): string {
  const mime = mimeType.split(';')[0]?.trim().toLowerCase() || '';
  if (!allowedMime.has(mime)) {
    throw ApiError.badRequest('Allowed image types: JPEG, PNG, WebP', 'BAD_IMAGE_TYPE');
  }
  if (buffer.length > maxBytes) {
    throw ApiError.badRequest(`Image too large (max ${Math.round(maxBytes / (1024 * 1024))} MB)`, 'IMAGE_TOO_LARGE');
  }
  return mime;
}

/**
 * Обложка профиля мастера (кабинет): один файл на пользователя, перезапись.
 */
export async function uploadMasterHeroPhoto(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
  const client = assertStorage();
  const mime = validateImage(buffer, mimeType, 5 * 1024 * 1024);
  const bucket = masterMediaBucket();
  const ext = extForMime(mime);
  const path = `masters/${userId}/hero.${ext}`;

  const { error: upErr } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (upErr) {
    throw ApiError.internal(`Storage upload failed: ${upErr.message}`, 'STORAGE_UPLOAD');
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw ApiError.internal('Could not build public URL', 'STORAGE_PUBLIC_URL');
  }
  return data.publicUrl;
}

export async function uploadMasterPortfolioImage(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
  const client = assertStorage();
  const mime = validateImage(buffer, mimeType, 5 * 1024 * 1024);
  const bucket = masterMediaBucket();
  const ext = extForMime(mime);
  const path = `masters/${userId}/portfolio/${randomUUID()}.${ext}`;

  const { error: upErr } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) {
    throw ApiError.internal(`Storage upload failed: ${upErr.message}`, 'STORAGE_UPLOAD');
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw ApiError.internal('Could not build public URL', 'STORAGE_PUBLIC_URL');
  }
  return data.publicUrl;
}

export async function uploadMasterCertificateImage(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
  const client = assertStorage();
  const mime = validateImage(buffer, mimeType, 5 * 1024 * 1024);
  const bucket = masterMediaBucket();
  const ext = extForMime(mime);
  const path = `masters/${userId}/certificates/${randomUUID()}.${ext}`;

  const { error: upErr } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) {
    throw ApiError.internal(`Storage upload failed: ${upErr.message}`, 'STORAGE_UPLOAD');
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw ApiError.internal('Could not build public URL', 'STORAGE_PUBLIC_URL');
  }
  return data.publicUrl;
}
