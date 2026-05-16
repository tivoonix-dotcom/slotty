import { getMasterPath } from '../../app/paths';

/** Канонический публичный origin (ссылки для клиентов, соцсети). */
export const DEFAULT_PUBLIC_APP_ORIGIN = 'https://slotty.of.by';

/**
 * Origin для публичных ссылок мастера.
 * Приоритет: `VITE_PUBLIC_APP_URL` → localhost в dev → `slotty.of.by` в production.
 */
export function readPublicAppOrigin(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    const origin = window.location.origin?.trim();
    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return origin.replace(/\/$/, '');
    }
  }

  if (import.meta.env.PROD) return DEFAULT_PUBLIC_APP_ORIGIN;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  return DEFAULT_PUBLIC_APP_ORIGIN;
}

/** Имя бота без @ из Vite (для ссылок t.me/…?start=). */
export function readViteTelegramBotUsername(): string | undefined {
  const raw = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim().replace(/^@+/, '');
  if (!s) return undefined;
  if (!/^[a-zA-Z0-9_]{3,64}$/.test(s)) {
    console.warn('[SLOTTY] VITE_TELEGRAM_BOT_USERNAME имеет недопустимый формат, игнорируем');
    return undefined;
  }
  return s;
}

/**
 * Payload для ?start= в боте: `master_<slug>` или `master_<masterId>`.
 * Значение кодируется в URL отдельно.
 */
export function buildMasterTelegramStartPayload(
  profileSlug: string | null | undefined,
  masterId: string | null | undefined,
): string {
  const slug = typeof profileSlug === 'string' ? profileSlug.trim() : '';
  const id = typeof masterId === 'string' ? masterId.trim() : '';
  if (slug) return `master_${slug}`;
  if (id) return `master_${id}`;
  return 'master_profile';
}

export function buildTelegramMasterBookingUrl(
  botUsername: string,
  profileSlug: string | null | undefined,
  masterId: string | null | undefined,
): string {
  const bot = botUsername.trim().replace(/^@+/, '');
  const start = buildMasterTelegramStartPayload(profileSlug, masterId);
  return `https://t.me/${bot}?start=${encodeURIComponent(start)}`;
}

/** Абсолютная ссылка на публичную карточку мастера в веб-приложении. */
export function buildWebMasterProfileAbsoluteUrl(origin: string, masterId: string | null | undefined): string | null {
  const id = typeof masterId === 'string' ? masterId.trim() : '';
  if (!id) return null;
  const base = origin.replace(/\/$/, '');
  return `${base}${getMasterPath(id)}`;
}

export type ResolvedMasterBookingLink = {
  /** Основная ссылка для показа и копирования (бот или веб). */
  href: string;
  /** true если это deep-link в Telegram-бота. */
  isTelegramDeepLink: boolean;
};

/**
 * Разрешает ссылку для клиентов: бот из env или fallback на публичный профиль.
 * Если нет ни бота, ни origin/id — возвращает null.
 */
export function resolveMasterBookingLink(
  profileSlug: string | null | undefined,
  masterId: string | null | undefined,
  pageOrigin: string | undefined,
): ResolvedMasterBookingLink | null {
  const bot = readViteTelegramBotUsername();
  if (bot) {
    return {
      href: buildTelegramMasterBookingUrl(bot, profileSlug, masterId),
      isTelegramDeepLink: true,
    };
  }

  const origin = pageOrigin?.trim() || readPublicAppOrigin();
  const web = buildWebMasterProfileAbsoluteUrl(origin, masterId);
  if (!web) return null;
  console.warn(
    '[SLOTTY] VITE_TELEGRAM_BOT_USERNAME не задан — для «Ссылка для записи» используется веб-URL профиля мастера',
  );
  return { href: web, isTelegramDeepLink: false };
}
