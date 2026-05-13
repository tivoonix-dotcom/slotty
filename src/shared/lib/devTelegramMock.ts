import { mockTelegramEnv, serializeInitDataQuery } from '@telegram-apps/sdk';

let applied = false;

/** Сброс после cleanup init (React Strict Mode / смена маршрута). */
export function resetDevTelegramMockState(): void {
  applied = false;
}

/** Реальный клиент Telegram уже передал initData (не полагаемся на isTMA() + localStorage). */
function hasRealTelegramInitData(): boolean {
  if (typeof window === 'undefined') return false;
  const data = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp
    ?.initData;
  return typeof data === 'string' && data.length > 0;
}

/**
 * Вне Telegram (браузер) без мока SDK бросает UnknownEnvError при postEvent.
 * - Не используем isTMA(): из localStorage могут читаться старые launch params → ложный «внутри TMA».
 * - В iframe (self !== top) mockTelegramEnv без onEvent выходит раньше и не настраивает postMessage — передаём onEvent.
 */
export function ensureDevTelegramMock(): void {
  if (typeof window === 'undefined') return;
  if (import.meta.env.VITE_DISABLE_TELEGRAM_MOCK === 'true') return;
  if (hasRealTelegramInitData()) return;

  if (applied) return;
  applied = true;

  const masterFromUrl = new URLSearchParams(window.location.search).get('master_id');

  const tgWebAppData = serializeInitDataQuery({
    auth_date: new Date(),
    hash: '__local_dev__',
    signature: '__local_dev__',
    ...(masterFromUrl ? { start_param: masterFromUrl } : {}),
    user: {
      id: 1000001,
      first_name: 'Локальный',
      last_name: 'Просмотр',
      username: 'local_preview',
    },
  });

  mockTelegramEnv({
    resetPostMessage: true,
    onEvent: (_evt, next) => {
      next();
    },
    launchParams: {
      tgWebAppPlatform: 'web',
      tgWebAppVersion: '8.0',
      tgWebAppThemeParams: {
        bg_color: '#fdfcfb',
        text_color: '#1c1c1e',
      },
      ...(masterFromUrl ? { tgWebAppStartParam: masterFromUrl } : {}),
      tgWebAppData,
    },
  });
}
