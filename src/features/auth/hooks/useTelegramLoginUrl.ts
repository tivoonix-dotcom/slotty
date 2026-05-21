import { useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import { readViteTelegramBotUsername } from '../../../shared/lib/masterBookingLink';
import { buildTelegramLoginUrlForBot } from '../lib/telegramLoginLink';

/** URL для входа через Telegram (Vite env или /api/public/config с бэкенда). */
export function useTelegramLoginUrl(returnPath?: string): string | null {
  const [botFromApi, setBotFromApi] = useState<string | undefined>();

  const bot = readViteTelegramBotUsername() ?? botFromApi;

  useEffect(() => {
    if (readViteTelegramBotUsername()) return;
    const base = getApiBaseUrl();
    if (!base) return;

    let cancelled = false;
    void fetch(`${base}/api/public/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { telegramBotUsername?: string } | null) => {
        const name = data?.telegramBotUsername?.trim().replace(/^@+/, '');
        if (!cancelled && name && /^[a-zA-Z0-9_]{3,64}$/.test(name)) {
          setBotFromApi(name);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => (bot ? buildTelegramLoginUrlForBot(bot, returnPath) : null), [bot, returnPath]);
}
