import type { Request } from 'express';
import { env } from '../../config/env.js';
import { getGoogleOAuthDiagnostics } from '../auth/googleOAuth.service.js';
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

export async function getPublicAppConfig(req?: Request): Promise<{
  telegramBotUsername?: string;
  googleOAuthConfigured: boolean;
  googleOAuthMissing?: string[];
  emailDeliveryConfigured: boolean;
  telegramBotConfigured: boolean;
}> {
  const telegramBotUsername = await resolveTelegramBotUsername();
  const google = getGoogleOAuthDiagnostics(req);
  const telegramBotConfigured = Boolean(getBotToken());
  const emailDeliveryConfigured = Boolean(env.RESEND_API_KEY?.trim());
  return {
    ...(telegramBotUsername ? { telegramBotUsername } : {}),
    googleOAuthConfigured: google.configured,
    ...(google.missing.length > 0 ? { googleOAuthMissing: google.missing } : {}),
    emailDeliveryConfigured,
    telegramBotConfigured,
  };
}
