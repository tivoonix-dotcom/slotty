import { env } from '../../config/env.js';

const TG_API_BASE = 'https://api.telegram.org';

function getBotToken(): string | undefined {
  const t = env.TELEGRAM_BOT_TOKEN?.trim();
  return t && t.length > 0 ? t : undefined;
}

function webAppUrl(): string | undefined {
  const w = env.WEB_APP_URL?.trim();
  if (w) return w;
  const c = env.CLIENT_URL?.trim();
  return c && c.startsWith('https://') ? c : undefined;
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
  const body = {
    chat_id: params.chatId,
    text: params.text,
    reply_markup: {
      keyboard: [[{ text: 'Открыть SLOTTY', web_app: { url: params.webAppUrl } }]],
      resize_keyboard: true,
    },
  };

  const r = await callSendMessage(body);
  if (r.ok) return true;

  const fallbackText = `${params.text}\n\nОткрыть приложение: ${params.webAppUrl}`;
  const r2 = await callSendMessage({
    chat_id: params.chatId,
    text: fallbackText,
  });
  return r2.ok;
}

const START_TEXT =
  'SLOTTY — онлайн-запись к мастерам: услуги, цены, свободные окна и удобный кабинет для мастеров.\n\n' +
  'Нажмите кнопку ниже, чтобы открыть приложение.';

const HELP_TEXT =
  'Команды:\n' +
  '• /start — кратко о SLOTTY и кнопка Web App\n' +
  '• Кнопка «Открыть SLOTTY» также доступна в меню рядом с полем ввода.';

export async function sendTelegramStartReply(chatId: number): Promise<void> {
  const token = getBotToken();
  if (!token) {
    console.error('[telegram webhook] /start: пропуск ответа — нет TELEGRAM_BOT_TOKEN в .env сервера.');
    return;
  }

  const url = webAppUrl();
  if (!url) {
    console.warn('[telegram webhook] WEB_APP_URL или https CLIENT_URL не заданы — отправляем текст без кнопки Web App.');
    await callSendMessage({
      chat_id: chatId,
      text: `${START_TEXT}\n\n(Администратору: задайте WEB_APP_URL — HTTPS URL фронта мини-приложения.)`,
    });
    return;
  }

  const ok = await sendMessageWithKeyboard({ chatId, text: START_TEXT, webAppUrl: url });
  if (!ok) {
    console.warn('[telegram webhook] /start: не удалось отправить ни клавиатуру, ни запасной текст.');
  }
}

export async function sendTelegramHelpReply(chatId: number): Promise<void> {
  const r = await callSendMessage({ chat_id: chatId, text: HELP_TEXT });
  if (!r.ok) {
    console.warn('[telegram webhook] /help: отправка не удалась.');
  }
}
