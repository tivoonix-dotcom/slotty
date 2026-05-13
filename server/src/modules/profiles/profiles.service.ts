import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export interface ProfileDto {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

function toTelegramUserIdNumber(raw: string | null): number | null {
  if (raw == null || raw === '') return null;
  const n = BigInt(raw);
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  const min = BigInt(Number.MIN_SAFE_INTEGER);
  if (n > max || n < min) {
    throw ApiError.internal('Telegram user id out of safe integer range', 'TG_ID_RANGE');
  }
  return Number(n);
}

export async function getProfileById(profileId: string): Promise<ProfileDto> {
  const r = await query<{
    id: string;
    telegram_user_id: string | null;
    telegram_username: string | null;
    full_name: string;
    avatar_url: string | null;
    role: string;
  }>(
    `select id, telegram_user_id::text, telegram_username, full_name, avatar_url, role::text as role
     from public.profiles where id = $1`,
    [profileId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Profile not found');
  }
  return {
    id: row.id,
    telegram_user_id: toTelegramUserIdNumber(row.telegram_user_id),
    telegram_username: row.telegram_username,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    role: row.role,
  };
}

export async function updateProfile(
  profileId: string,
  patch: { full_name?: string; avatar_url?: string | null },
): Promise<ProfileDto> {
  const fields: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (patch.full_name !== undefined) {
    fields.push(`full_name = $${i++}`);
    vals.push(patch.full_name);
  }
  if (patch.avatar_url !== undefined) {
    fields.push(`avatar_url = $${i++}`);
    vals.push(patch.avatar_url);
  }
  if (!fields.length) {
    return getProfileById(profileId);
  }
  vals.push(profileId);
  await query(
    `update public.profiles set ${fields.join(', ')}, updated_at = now() where id = $${i}`,
    vals,
  );
  return getProfileById(profileId);
}
