/** Портрет из Telegram CDN (временная ссылка, может протухнуть). */
export function isTelegramPortraitUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw) return false;
  const u = raw.toLowerCase();
  return (
    u.includes('telegram-cdn.org') ||
    u.includes('telesco.pe') ||
    u.includes('api.telegram.org/file/bot') ||
    /t\.me\/i\/userpic/i.test(u)
  );
}

/** Файл в Supabase Storage — стабильный URL для аватаров. */
export function isSupabaseStoredPortraitUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw) return false;
  return raw.toLowerCase().includes('/storage/v1/object/public/');
}

/** Загрузка в Storage не должна затираться при повторном входе через Telegram. */
export function isStablePortraitUrl(url: string | null | undefined): boolean {
  return isSupabaseStoredPortraitUrl(url);
}

/**
 * При синхронизации Telegram: не перезаписываем Supabase-загрузку;
 * обновляем только пустое поле или протухающий Telegram CDN.
 */
export function pickPortraitUrlOnTelegramSync(
  current: string | null | undefined,
  incomingTelegram: string | null | undefined,
): string | null {
  const c = current?.trim() || null;
  const i = incomingTelegram?.trim() || null;
  if (isStablePortraitUrl(c)) return c;
  if (!i) return c;
  if (!c) return i;
  if (isTelegramPortraitUrl(c)) return i;
  return c;
}

/** Портрет из Google OAuth — не отдаём в UI, показываем инициалы. */
export function isGoogleOAuthAvatarUrl(url: string | null | undefined): boolean {
  const raw = url?.trim().toLowerCase();
  if (!raw) return false;
  return raw.includes('googleusercontent.com') || raw.includes('ggpht.com');
}

/** URL для хедера / GET /api/me: без Google и генераторов. */
export function sanitizePortraitDisplayUrl(url: string | null | undefined): string | null {
  const raw = url?.trim() || null;
  if (!raw || isGoogleOAuthAvatarUrl(raw)) return null;
  return raw;
}

/** Нужно скачать портрет на сервер и сохранить в Storage. */
export function shouldMirrorPortraitToStorage(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw) return false;
  if (isStablePortraitUrl(raw)) return false;
  return isTelegramPortraitUrl(raw) || raw.startsWith('https://');
}
