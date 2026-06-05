import type { BackendProfile } from '../../auth/types';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';

/** Сгенерированные аватарки по имени — не считаем загруженным фото. */
export function isGeneratedPlaceholderAvatarUrl(url: string | null | undefined): boolean {
  const u = url?.trim().toLowerCase();
  if (!u) return false;
  if (u.includes('ui-avatars.com')) return true;
  if (u.includes('dicebear.com')) return true;
  if (u.includes('robohash.org')) return true;
  if (u.includes('avatar.iran.liara.run')) return true;
  return false;
}

/** Портрет из Google OAuth — буква «J» и т.п.; показываем инициалы вместо. */
export function isGoogleOAuthAvatarUrl(url: string | null | undefined): boolean {
  const u = url?.trim().toLowerCase();
  if (!u) return false;
  return u.includes('googleusercontent.com') || u.includes('ggpht.com');
}

/** Портрет из Telegram CDN (не ссылка на профиль t.me/username). */
export function isTelegramPortraitUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw)) return false;
  const u = raw.toLowerCase();
  return (
    u.includes('telegram-cdn.org') ||
    u.includes('telesco.pe') ||
    /t\.me\/i\/userpic\//i.test(u)
  );
}

/** Файл, загруженный в Supabase Storage (POST /api/me/avatar). */
export function isSupabaseProfileAvatarUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw)) return false;
  const u = raw.toLowerCase();
  if (!u.includes('/storage/v1/object/public/')) return false;
  return /\/avatar\.(jpe?g|png|webp)(\?|#|$)/i.test(u);
}

function isSupabaseStoredPortraitUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw) || isGoogleOAuthAvatarUrl(raw)) return false;
  return raw.toLowerCase().includes('/storage/v1/object/public/');
}

/** Реальное фото для отображения: Supabase / Telegram / Storage, не Google и не генератор. */
export function resolvePortraitDisplayUrl(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw) || isGoogleOAuthAvatarUrl(raw)) return null;
  if (isSupabaseProfileAvatarUrl(raw) || isTelegramPortraitUrl(raw) || isSupabaseStoredPortraitUrl(raw)) {
    return optimizeAvatarUrl(raw, 256) || raw;
  }
  return null;
}

/** Реальное фото пользователя (загрузка / Telegram), не OAuth Google. */
export function isUserUploadedAvatarUrl(url: string | null | undefined): boolean {
  return resolvePortraitDisplayUrl(url) != null;
}

/** Для онбординга: только Supabase-загрузка или портрет Telegram после сохранения. */
export function isOnboardingAvatarPhotoUrl(url: string | null | undefined): boolean {
  return isSupabaseProfileAvatarUrl(url) || isTelegramPortraitUrl(url);
}

/**
 * Инициалы для плейсхолдера: первые буквы первых двух слов, как в UI
 * («Иванова Мария» → «ИМ», «Мария Иванова» → «МИ»).
 */
export function profileDisplayInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = [...parts[0]!][0];
    const b = [...parts[1]!][0];
    if (a && b) return `${a}${b}`.toLocaleUpperCase('ru-RU');
  }
  const first = [...(parts[0] ?? 'S')][0];
  return (first ?? 'S').toLocaleUpperCase('ru-RU');
}

/**
 * Единый URL аватара аккаунта из GET /api/me (`header_avatar_url`, fallback `avatar_url`).
 * Google OAuth и внешние ссылки без Storage/Telegram → null → инициалы в UI.
 */
export function accountAvatarUrl(profile: BackendProfile | null | undefined): string | null {
  if (!profile) return null;
  const raw = (profile.header_avatar_url ?? profile.avatar_url)?.trim() || null;
  return resolvePortraitDisplayUrl(raw);
}

/** @deprecated alias — accountAvatarUrl */
export function profileDisplayAvatarUrl(profile: BackendProfile | null | undefined): string | null {
  return accountAvatarUrl(profile);
}
