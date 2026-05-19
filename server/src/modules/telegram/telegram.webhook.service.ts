import { env } from '../../config/env.js';
import { getBotToken, callBotMethod } from './telegram.botApi.js';

const TG_API_BASE = 'https://api.telegram.org';

function webAppBaseUrl(): string | undefined {
  const w = env.WEB_APP_URL?.trim();
  if (w) return w.replace(/\/$/, '');
  const c = env.CLIENT_URL?.trim();
  return c && c.startsWith('https://') ? c.replace(/\/$/, '') : undefined;
}

/** Параметр после /start (deep link из t.me/bot?start=...). */
export function parseStartPayload(text: string): string | null {
  const m = text.trim().match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  const payload = m?.[1]?.trim();
  return payload && payload.length > 0 ? payload : null;
}

function webAppUrlForStart(startText?: string): string | undefined {
  const base = webAppBaseUrl();
  if (!base) return undefined;
  const payload = startText ? parseStartPayload(startText) : null;
  if (!payload) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}tgWebAppStartParam=${encodeURIComponent(payload)}`;
}

/** /start, /start@BotName, /start payload — без учёта регистра в префиксе. */
export function isTelegramStartCommand(text: string): boolean {
  const t = text.trim();
  return /^\/start(?:@\w+)?(\s|$)/i.test(t);
}

export function isTelegramHelpCommand(text: string): boolean {
  const t = text.trim();
  return /^\/help(?:@\w+)?(\s|$)/i.test(t);
}

async function callSendMessage(body: Record<string, unknown>): Promise<{ ok: boolean; description?: string }> {
  const token = getBotToken();
  if (!token) {
    console.error('[telegram webhook] TELEGRAM_BOT_TOKEN не задан — нельзя отправить ответ в чат.');
    return { ok: false, description: 'no_token' };
  }

  const res = await fetch(`${TG_API_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!res.ok || data.ok === false) {
    console.warn('[telegram webhook] sendMessage failed:', data.description ?? res.statusText, res.status);
    return { ok: false, description: data.description };
  }
  return { ok: true };
}

async function sendMessageWithKeyboard(params: {
  chatId: number;
  text: string;
  webAppUrl: string;
}): Promise<boolean> {
  const token = getBotToken();
  if (!token) return false;

  const inline = await callBotMethod(token, 'sendMessage', {
    chat_id: params.chatId,
    text: params.text,
    reply_markup: {
      inline_keyboard: [[{ text: 'Открыть SLOTTY', web_app: { url: params.webAppUrl } }]],
    },
  });
  if (inline.ok) return true;

  const reply = await callBotMethod(token, 'sendMessage', {
    chat_id: params.chatId,
    text: params.text,
    reply_markup: {
      keyboard: [[{ text: 'Открыть SLOTTY', web_app: { url: params.webAppUrl } }]],
      resize_keyboard: true,
    },
  });
  if (reply.ok) return true;

  const fallbackText = `${params.text}\n\nОткрыть приложение: ${params.webAppUrl}`;
  const plain = await callSendMessage({
    chat_id: params.chatId,
    text: fallbackText,
  });
  return plain.ok;
}

const START_TEXT =
  'SLOTTY — онлайн-запись к мастерам: услуги, цены, свободные окна и удобный кабинет для мастеров.\n\n' +
  'Нажмите кнопку ниже, чтобы открыть приложение.';

const HELP_TEXT =
  'Команды:\n' +
  '• /start — кратко о SLOTTY и кнопка Web App\n' +
  '• Кнопка «Открыть SLOTTY» также доступна в меню рядом с полем ввода.';

export async function sendTelegramStartReply(chatId: number, startText = '/start'): Promise<void> {
  if (!getBotToken()) {
    console.error('[telegram] /start: нет TELEGRAM_BOT_TOKEN в .env сервера.');
    return;
  }

  const payload = parseStartPayload(startText);
  let text = START_TEXT;
  if (payload?.startsWith('master_')) {
    text += '\n\nВы перешли по ссылке мастера — откройте приложение, чтобы записаться.';
  }

  const url = webAppUrlForStart(startText);
  if (!url) {
    console.warn('[telegram] WEB_APP_URL (https) не задан — отправляем текст без кнопки.');
    await callSendMessage({
      chat_id: chatId,
      text: `${text}\n\n(Администратору: задайте WEB_APP_URL — HTTPS URL фронта.)`,
    });
    return;
  }

  const ok = await sendMessageWithKeyboard({ chatId, text, webAppUrl: url });
  if (!ok) {
    console.warn('[telegram] /start: не удалось отправить сообщение в чат', chatId);
  }
}

export async function sendTelegramHelpReply(chatId: number): Promise<void> {
  const r = await callSendMessage({ chat_id: chatId, text: HELP_TEXT });
  if (!r.ok) {
    console.warn('[telegram webhook] /help: отправка не удалась.');
  }
}
