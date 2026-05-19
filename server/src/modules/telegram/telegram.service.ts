import { env } from '../../config/env.js';
import { callBotMethod, getBotToken, getWebhookInfo } from './telegram.botApi.js';
import { startTelegramPolling } from './telegram.polling.js';
import { resolveTelegramWebhookUrl, shouldUseTelegramPolling } from './telegram.webhookConfig.js';

const TG_API_BASE = 'https://api.telegram.org';

function logTelegramFailure(operation: string, message: string): void {
  console.warn(`[telegram] ${operation} failed:`, message);
}

export type SendTelegramMessageResult =
  | { status: 'skipped' }
  | { status: 'ok' }
  | { status: 'error'; message: string };

/** Экранирование для Telegram parse_mode HTML. */
export function escapeTelegramHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendTelegramMessage(params: {
  telegramUserId: number | string;
  text: string;
}): Promise<SendTelegramMessageResult> {
  const token = getBotToken();
  if (!token) {
    return { status: 'skipped' };
  }

  const chatId = String(params.telegramUserId);

  try {
    const res = await fetch(`${TG_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: params.text,
        parse_mode: 'HTML',
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };

    if (!res.ok || data.ok === false) {
      const msg = data.description?.trim() || `HTTP ${res.status}`;
      logTelegramFailure('sendMessage', msg);
      return { status: 'error', message: msg };
    }

    return { status: 'ok' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'network_error';
    logTelegramFailure('sendMessage', msg);
    return { status: 'error', message: msg };
  }
}

export type StepResult = { ok: true } | { ok: false; error: string };

export type SetupTelegramBotReport = {
  commands: StepResult;
  menuButton: StepResult;
  shortDescription: StepResult;
  description: StepResult;
  webhook?: StepResult;
};

export async function setupTelegramBot(params: {
  webAppUrl: string;
  webhookUrl?: string;
  webhookSecret?: string;
}): Promise<SetupTelegramBotReport> {
  const token = getBotToken();
  if (!token) {
    const err = { ok: false as const, error: 'TELEGRAM_BOT_TOKEN is not set' };
    return { commands: err, menuButton: err, shortDescription: err, description: err };
  }

  const commands = await callBotMethod(token, 'setMyCommands', {
    commands: [
      { command: 'start', description: 'Открыть SLOTTY' },
      { command: 'help', description: 'Помощь' },
    ],
  });

  const menuButton = await callBotMethod(token, 'setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Открыть SLOTTY',
      web_app: { url: params.webAppUrl },
    },
  });

  const shortDescription = await callBotMethod(token, 'setMyShortDescription', {
    short_description: 'SLOTTY — сервис для онлайн-записи к мастерам услуг.',
  });

  const description = await callBotMethod(token, 'setMyDescription', {
    description:
      'SLOTTY помогает быстро найти мастера, выбрать свободное время и записаться на услугу прямо в Telegram. Клиенты видят услуги, цены, адрес и свободные окна, а мастера получают удобный кабинет для управления записями, расписанием и профилем.',
  });

  const wurl = params.webhookUrl?.trim();
  const wsec = params.webhookSecret?.trim();
  let webhook: StepResult | undefined;
  if (wurl) {
    const body: Record<string, unknown> = {
      url: wurl,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    };
    if (wsec) {
      body.secret_token = wsec;
    }
    webhook = await callBotMethod(token, 'setWebhook', body);
  }

  return { commands, menuButton, shortDescription, description, webhook };
}

/**
 * При старте: вебхук (прод) или long polling (локально без HTTPS).
 */
export async function initTelegramBotTransport(): Promise<void> {
  const token = getBotToken();
  if (!token) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN не задан — /start и уведомления не работают.');
    return;
  }

  if (shouldUseTelegramPolling()) {
    await startTelegramPolling();
    return;
  }

  const url = resolveTelegramWebhookUrl();
  if (!url) {
    console.warn(
      '[telegram] Не задан TELEGRAM_WEBHOOK_URL (или PUBLIC_API_URL / RAILWAY_PUBLIC_DOMAIN) — ' +
        'команда /start не будет обрабатываться. Задайте TELEGRAM_WEBHOOK_URL=https://ВАШ_API/api/telegram/webhook',
    );
    return;
  }

  const wsec = env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const body: Record<string, unknown> = {
    url,
    allowed_updates: ['message'],
    drop_pending_updates: false,
  };
  if (wsec) {
    body.secret_token = wsec;
  }

  const r = await callBotMethod(token, 'setWebhook', body);
  if (r.ok) {
    console.log('[telegram] setWebhook OK →', url);
    const info = await getWebhookInfo(token);
    if (info?.last_error_message) {
      console.warn('[telegram] webhook last error:', info.last_error_message);
    }
  } else {
    console.warn('[telegram] setWebhook failed:', r.error);
  }
}

/** @deprecated используйте initTelegramBotTransport */
export async function ensureTelegramWebhookFromEnv(): Promise<void> {
  await initTelegramBotTransport();
}
