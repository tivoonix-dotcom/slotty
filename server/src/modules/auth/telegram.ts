import crypto from 'node:crypto';

export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface VerifiedInitData {
  user: TelegramWebAppUser;
  authDate: number;
  rawParams: Record<string, string>;
}

/**
 * Verifies Telegram Web App initData string per
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(initDataRaw: string, botToken: string): VerifiedInitData {
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get('hash');
  if (!hash) {
    throw new Error('MISSING_HASH');
  }

  const pairs: [string, string][] = [];
  for (const [key, value] of params.entries()) {
    if (key === 'hash') continue;
    pairs.push([key, value]);
  }
  pairs.sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computed !== hash) {
    throw new Error('BAD_HASH');
  }

  const authDateRaw = params.get('auth_date');
  if (!authDateRaw) {
    throw new Error('MISSING_AUTH_DATE');
  }
  const authDate = Number.parseInt(authDateRaw, 10);
  if (!Number.isFinite(authDate)) {
    throw new Error('BAD_AUTH_DATE');
  }
  const maxAgeSec = 24 * 60 * 60;
  if (Math.floor(Date.now() / 1000) - authDate > maxAgeSec) {
    throw new Error('AUTH_DATE_EXPIRED');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('MISSING_USER');
  }
  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    throw new Error('BAD_USER_JSON');
  }
  if (!user?.id || !Number.isFinite(user.id)) {
    throw new Error('BAD_USER_ID');
  }

  const rawParams: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    if (k !== 'hash') rawParams[k] = v;
  }

  return { user, authDate, rawParams };
}
