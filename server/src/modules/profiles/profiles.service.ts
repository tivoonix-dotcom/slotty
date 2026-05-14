import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export interface ProfileDto {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  full_name: string;
  avatar_url: string | null;
  role: string;
  phone: string | null;
  address: string | null;
  privacy_consent_accepted_at: string | null;
  terms_accepted_at: string | null;
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
    phone: string | null;
    address: string | null;
    privacy_consent_accepted_at: Date | string | null;
    terms_accepted_at: Date | string | null;
  }>(
    `select id, telegram_user_id::text, telegram_username, full_name, avatar_url, role::text as role,
            phone, address,
            privacy_consent_accepted_at::text, terms_accepted_at::text
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
    phone: row.phone,
    address: row.address,
    privacy_consent_accepted_at:
      row.privacy_consent_accepted_at == null ? null : String(row.privacy_consent_accepted_at),
    terms_accepted_at: row.terms_accepted_at == null ? null : String(row.terms_accepted_at),
  };
}

export async function updateProfile(
  profileId: string,
  patch: {
    full_name?: string;
    avatar_url?: string | null;
    phone?: string | null;
    address?: string | null;
    privacy_consent_accepted_at?: string | null;
    terms_accepted_at?: string | null;
  },
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
  if (patch.phone !== undefined) {
    fields.push(`phone = $${i++}`);
    vals.push(patch.phone);
  }
  if (patch.address !== undefined) {
    fields.push(`address = $${i++}`);
    vals.push(patch.address);
  }
  if (patch.privacy_consent_accepted_at !== undefined) {
    fields.push(`privacy_consent_accepted_at = $${i++}`);
    vals.push(patch.privacy_consent_accepted_at);
  }
  if (patch.terms_accepted_at !== undefined) {
    fields.push(`terms_accepted_at = $${i++}`);
    vals.push(patch.terms_accepted_at);
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
