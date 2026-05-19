import { getBotToken, callBotMethod } from './telegram.botApi.js';
import { handleTelegramUpdate, type TelegramUpdate } from './telegram.updateHandler.js';

let pollingActive = false;
let offset = 0;

async function pollOnce(): Promise<void> {
  const token = getBotToken();
  if (!token) return;

  const params = new URLSearchParams({
    timeout: '25',
    allowed_updates: JSON.stringify(['message']),
  });
  if (offset > 0) params.set('offset', String(offset));

  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?${params}`);
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    result?: TelegramUpdate[];
    description?: string;
  };

  if (!data.ok) {
    console.warn('[telegram polling] getUpdates:', data.description ?? res.statusText);
    return;
  }

  for (const update of data.result ?? []) {
    try {
      await handleTelegramUpdate(update);
    } catch (e) {
      console.warn('[telegram polling] handle update:', e instanceof Error ? e.message : e);
    }
    if (typeof update.update_id === 'number') {
      offset = update.update_id + 1;
    }
  }
}

async function pollingLoop(): Promise<void> {
  while (pollingActive) {
    try {
      await pollOnce();
    } catch (e) {
      console.warn('[telegram polling] loop error:', e instanceof Error ? e.message : e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

/** Long polling для локальной разработки (когда нет публичного HTTPS вебхука). */
export async function startTelegramPolling(): Promise<void> {
  const token = getBotToken();
  if (!token || pollingActive) return;

  const deleted = await callBotMethod(token, 'deleteWebhook', { drop_pending_updates: true });
  if (!deleted.ok) {
    console.warn('[telegram polling] deleteWebhook:', deleted.error);
  }

  pollingActive = true;
  offset = 0;
  console.log('[telegram polling] запущен (режим dev — /start и /help работают без TELEGRAM_WEBHOOK_URL)');
  void pollingLoop();
}

export function stopTelegramPolling(): void {
  pollingActive = false;
}
