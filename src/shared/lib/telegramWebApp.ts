/** Синхронное чтение start_param из классического Telegram WebApp (если есть). */
export function readTelegramWebAppStartParam(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const unsafe = (
    window as unknown as {
      Telegram?: { WebApp?: { initDataUnsafe?: { start_param?: string } } };
    }
  ).Telegram?.WebApp?.initDataUnsafe?.start_param;
  const s = typeof unsafe === 'string' ? unsafe.trim() : '';
  return s || undefined;
}

type ClassicWebApp = {
  initData?: string;
  initDataUnsafe?: {
    start_param?: string;
    user?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
  };
};

function getClassicWebApp(): ClassicWebApp | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Telegram?: { WebApp?: ClassicWebApp } }).Telegram?.WebApp;
}

/**
 * Подписанная строка initData с клиента Telegram (нужна для POST /api/auth/telegram).
 * У @telegram-apps/sdk иногда пусто до инициализации — тогда читаем из официального WebApp.
 */
export function getTelegramWebAppInitDataRaw(): string | undefined {
  const raw = getClassicWebApp()?.initData;
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return undefined;
}

export type TelegramUserPreview = {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
};

function parseUserFromInitDataQuery(raw: string): TelegramUserPreview | null {
  try {
    const userJson = new URLSearchParams(raw.trim()).get('user');
    if (!userJson) return null;
    const u = JSON.parse(userJson) as {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
    if (typeof u.id !== 'number') return null;
    return {
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      username: u.username,
      photoUrl: u.photo_url,
    };
  } catch {
    return null;
  }
}

/** Данные пользователя из Mini App (без ожидания ответа бэка). */
export function readTelegramWebAppUserPreview(): TelegramUserPreview | null {
  const webApp = getClassicWebApp();
  const u = webApp?.initDataUnsafe?.user;
  if (u && typeof u.id === 'number') {
    return {
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      username: u.username,
      photoUrl: u.photo_url,
    };
  }
  const raw = webApp?.initData;
  if (typeof raw === 'string' && raw.trim()) {
    return parseUserFromInitDataQuery(raw);
  }
  return null;
}

export function formatTelegramUserDisplayName(u: TelegramUserPreview): string {
  const parts = [u.firstName, u.lastName].map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
  if (parts.length) return parts.join(' ');
  if (u.username && u.username.trim()) return u.username.trim();
  return `Пользователь ${u.id}`;
}
