import { env } from '../../config/env.js';

const TG_API_BASE = 'https://api.telegram.org';

function getBotToken(): string | undefined {
  const raw = process.env.TELEGRAM_BOT_TOKEN;
  const t = typeof raw === 'string' ? raw.trim() : '';
  return t.length > 0 ? t : undefined;
}

function webAppUrl(): string | undefined {
  const w = env.WEB_APP_URL?.trim();
  if (w) return w;
  const c = env.CLIENT_URL?.trim();
  return c && c.startsWith('https://') ? c : undefined;
}

async function sendMessageWithKeyboard(params: {
  chatId: number;
  text: string;
  webAppUrl: string;
}): Promise<void> {
  const token = getBotToken();
  if (!token) return;

  const body = {
    chat_id: params.chatId,
    text: params.text,
    reply_markup: {
      keyboard: [[{ text: 'Открыть SLOTTY', web_app: { url: params.webAppUrl } }]],
      resize_keyboard: true,
    },
  };

  const res = await fetch(`${TG_API_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { description?: string };
    console.warn('[telegram webhook] sendMessage failed:', data.description ?? res.status);
  }
}

const START_TEXT =
  'SLOTTY — онлайн-запись к мастерам: услуги, цены, свободные окна и удобный кабинет для мастеров.\n\n' +
  'Нажмите кнопку ниже, чтобы открыть приложение.';

const HELP_TEXT =
  'Команды:\n' +
  '• /start — кратко о SLOTTY и кнопка Web App\n' +
  '• Кнопка «Открыть SLOTTY» также доступна в меню рядом с полем ввода.';

export async function sendTelegramStartReply(chatId: number): Promise<void> {
  const url = webAppUrl();
  if (!url) {
    console.warn('[telegram webhook] WEB_APP_URL / https CLIENT_URL not set — cannot attach Web App button');
    const token = getBotToken();
    if (!token) return;
    await fetch(`${TG_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `${START_TEXT}\n\n(Администратору: задайте WEB_APP_URL на бэкенде — HTTPS URL фронта.)`,
      }),
    });
    return;
  }

  await sendMessageWithKeyboard({ chatId, text: START_TEXT, webAppUrl: url });
}

export async function sendTelegramHelpReply(chatId: number): Promise<void> {
  const token = getBotToken();
  if (!token) return;

  await fetch(`${TG_API_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: HELP_TEXT }),
  });
}
