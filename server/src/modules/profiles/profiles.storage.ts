import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

let adminClient: SupabaseClient | null | undefined;

function getStorageAdmin(): SupabaseClient | null {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  if (adminClient === undefined) {
    adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return adminClient;
}

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

/**
 * Загружает файл в Supabase Storage (bucket из env) и возвращает публичный URL.
 */
export async function uploadProfileAvatar(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
  const client = getStorageAdmin();
  if (!client) {
    throw ApiError.serviceUnavailable(
      'Avatar upload is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server)',
      'NO_SUPABASE_STORAGE',
    );
  }
  const mime = mimeType.split(';')[0]?.trim().toLowerCase() || '';
  if (!allowedMime.has(mime)) {
    throw ApiError.badRequest('Allowed image types: JPEG, PNG, WebP', 'BAD_IMAGE_TYPE');
  }
  if (buffer.length > 2 * 1024 * 1024) {
    throw ApiError.badRequest('Image too large (max 2 MB)', 'IMAGE_TOO_LARGE');
  }

  const bucket = env.SUPABASE_PROFILE_BUCKET.trim() || 'profile';
  const path = `${userId}/avatar.${extForMime(mime)}`;

  const { error: upErr } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (upErr) {
    throw ApiError.internal(`Storage upload failed: ${upErr.message}`, 'STORAGE_UPLOAD');
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw ApiError.internal('Could not build public URL for avatar', 'STORAGE_PUBLIC_URL');
  }
  return data.publicUrl;
}
