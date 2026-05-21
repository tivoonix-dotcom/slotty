import { env } from '../../config/env.js';
import { getBotToken, getBotUsername } from '../telegram/telegram.botApi.js';

let cachedTelegramBotUsername: string | null | undefined;

export async function resolveTelegramBotUsername(): Promise<string | undefined> {
  const fromEnv = env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@+/, '');
  if (fromEnv && /^[a-zA-Z0-9_]{3,64}$/.test(fromEnv)) {
    return fromEnv;
  }

  if (cachedTelegramBotUsername !== undefined) {
    return cachedTelegramBotUsername ?? undefined;
  }

  const token = getBotToken();
  if (!token) {
    cachedTelegramBotUsername = null;
    return undefined;
  }

  const username = await getBotUsername(token);
  cachedTelegramBotUsername = username ?? null;
  return username;
}

export async function getPublicAppConfig(): Promise<{ telegramBotUsername?: string }> {
  const telegramBotUsername = await resolveTelegramBotUsername();
  return telegramBotUsername ? { telegramBotUsername } : {};
}
