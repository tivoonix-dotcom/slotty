import { readViteTelegramBotUsername } from '../../../shared/lib/masterBookingLink';

/** Deep link: открыть бота с /start login → кнопка Web App на страницу входа. */
export function buildTelegramLoginUrlForBot(botUsername: string, returnPath?: string): string {
  const bot = botUsername.trim().replace(/^@+/, '');
  const shortName = import.meta.env.VITE_TELEGRAM_WEBAPP_SHORT_NAME?.trim().replace(/^\/+|\/+$/g, '');
  if (shortName) {
    return `https://t.me/${bot}/${shortName}?startapp=login`;
  }

  const start =
    returnPath && returnPath.startsWith('/') ? `login_${returnPath.slice(1).replace(/\//g, '_')}` : 'login';
  return `https://t.me/${bot}?start=${encodeURIComponent(start)}`;
}

export function buildTelegramLoginUrl(returnPath?: string): string | null {
  const bot = readViteTelegramBotUsername();
  if (!bot) return null;
  return buildTelegramLoginUrlForBot(bot, returnPath);
}

/** Переход в Telegram (на телефоне откроется приложение). */
export function openTelegramLogin(returnPath?: string): boolean {
  const url = buildTelegramLoginUrl(returnPath);
  if (!url) return false;
  window.location.assign(url);
  return true;
}
