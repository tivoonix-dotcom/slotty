import jwt from 'jsonwebtoken';
import type { JwtUserRole } from '../../middlewares/auth.js';
import { env } from '../../config/env.js';
import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { verifyTelegramInitData } from './telegram.js';
import { getProfileById } from '../profiles/profiles.service.js';

function displayNameFromTelegram(first?: string, last?: string, username?: string): string {
  const n = [first?.trim(), last?.trim()].filter(Boolean).join(' ').trim();
  if (n) return n;
  if (username?.trim()) return `@${username.trim()}`;
  return 'Telegram user';
}

function isJwtRole(r: string): r is JwtUserRole {
  return r === 'client' || r === 'master' || r === 'platform_admin';
}

export function signAccessToken(profileId: string, role: JwtUserRole): string {
  return jwt.sign({ sub: profileId, role }, env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Upsert `public.profiles` by `telegram_user_id` (unique).
 * Does not use Supabase Auth / `auth.users`.
 */
export async function loginWithTelegram(initDataRaw: string) {
  if (!env.TELEGRAM_BOT_TOKEN?.trim()) {
    throw ApiError.internal('Telegram bot token is not configured', 'NO_TELEGRAM_BOT_TOKEN');
  }

  let verified;
  try {
    verified = verifyTelegramInitData(initDataRaw.trim(), env.TELEGRAM_BOT_TOKEN.trim());
  } catch {
    throw ApiError.unauthorized('Invalid Telegram initData', 'TELEGRAM_INITDATA_INVALID');
  }

  const tgId = verified.user.id;
  const fullName = displayNameFromTelegram(
    verified.user.first_name,
    verified.user.last_name,
    verified.user.username,
  );
  const tgUsername = verified.user.username?.trim() || null;
  const avatarUrl = verified.user.photo_url?.trim() || null;

  try {
    const upsert = await query<{ id: string; role: string }>(
      `insert into public.profiles (id, telegram_user_id, telegram_username, full_name, avatar_url, role)
       values (gen_random_uuid(), $1, $2, $3, $4, 'client')
       on conflict (telegram_user_id) do update set
         telegram_username = excluded.telegram_username,
         full_name = excluded.full_name,
         avatar_url = excluded.avatar_url,
         updated_at = now()
       returning id, role::text as role`,
      [tgId, tgUsername, fullName, avatarUrl],
    );
    const row = upsert.rows[0];
    if (!row || !isJwtRole(row.role)) {
      throw ApiError.internal('Invalid profile role after upsert', 'BAD_ROLE');
    }
    const token = signAccessToken(row.id, row.role);
    const profile = await getProfileById(row.id);
    return { token, profile };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === '23503') {
      throw ApiError.internal(
        'Cannot save profile: database still links profiles.id to auth.users. Drop that FK or align schema for standalone Telegram auth.',
        'PROFILE_FK_AUTH_USERS',
      );
    }
    throw e;
  }
}
