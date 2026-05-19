import { env } from '../../config/env.js';

function trimUrl(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t && t.length > 0 ? t.replace(/\/$/, '') : undefined;
}

/** Базовый публичный URL API (без /api). */
export function resolvePublicApiBaseUrl(): string | undefined {
  const explicit =
    trimUrl(process.env.PUBLIC_API_URL) ??
    trimUrl(process.env.API_PUBLIC_URL) ??
    trimUrl(env.TELEGRAM_WEBHOOK_URL?.replace(/\/api\/telegram\/webhook\/?$/i, ''));

  if (explicit) return explicit;

  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) {
    return `https://${railway.replace(/^https?:\/\//i, '')}`;
  }

  return undefined;
}

/** Полный URL вебхука для setWebhook. */
export function resolveTelegramWebhookUrl(): string | undefined {
  const direct = trimUrl(env.TELEGRAM_WEBHOOK_URL);
  if (direct) return direct.endsWith('/api/telegram/webhook') ? direct : `${direct}/api/telegram/webhook`;

  const base = resolvePublicApiBaseUrl();
  if (base) return `${base}/api/telegram/webhook`;

  return undefined;
}

export function shouldUseTelegramPolling(): boolean {
  if (process.env.TELEGRAM_USE_POLLING === 'true') return true;
  if (process.env.TELEGRAM_USE_POLLING === 'false') return false;
  return env.NODE_ENV === 'development' && !resolveTelegramWebhookUrl();
}
