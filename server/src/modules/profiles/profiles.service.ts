import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export interface ProfileDto {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  full_name: string;
  avatar_url: string | null;
  /** Аватар для шапки: фото из кабинета мастера или загруженное в профиле клиента, не OAuth. */
  header_avatar_url: string | null;
  role: string;
  phone: string | null;
  address: string | null;
  /** Email из привязки email или Google (для отображения в кабинете). */
  account_email: string | null;
  privacy_consent_accepted_at: string | null;
  terms_accepted_at: string | null;
}

function isOAuthProviderAvatarUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes('googleusercontent.com') || u.includes('ggpht.com');
}

async function fetchMasterCabinetPhotoUrl(profileId: string): Promise<string | null> {
  const r = await query<{ photo_url: string | null }>(
    `select photo_url from public.master_profiles where master_id = $1 limit 1`,
    [profileId],
  );
  const photo = r.rows[0]?.photo_url?.trim();
  return photo || null;
}

export async function resolveAccountEmail(profileId: string): Promise<string | null> {
  const r = await query<{ email: string }>(
    `select email from public.auth_identities
      where profile_id = $1
        and email is not null
        and trim(email) <> ''
      order by case provider::text when 'email' then 0 when 'google' then 1 else 2 end,
               created_at asc
      limit 1`,
    [profileId],
  );
  const email = r.rows[0]?.email?.trim();
  return email || null;
}

export async function resolveHeaderAvatarUrl(
  profileId: string,
  role: string,
  avatarUrl: string | null,
): Promise<string | null> {
  if (role === 'master' || role === 'platform_admin') {
    const masterPhoto = await fetchMasterCabinetPhotoUrl(profileId);
    if (masterPhoto) return masterPhoto;
  }
  const av = avatarUrl?.trim();
  if (!av || isOAuthProviderAvatarUrl(av)) return null;
  return av;
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

type MasterCabinetPersonalFields = {
  phone: string | null;
  fullName: string | null;
  address: string | null;
};

async function fetchMasterCabinetPersonalFields(profileId: string): Promise<MasterCabinetPersonalFields | null> {
  const r = await query<{
    phone: string | null;
    display_name: string | null;
    public_address: string | null;
  }>(
    `select mp.phone, mp.display_name, ml.public_address
     from public.master_profiles mp
     left join public.master_locations ml
       on ml.master_id = mp.master_id and ml.is_primary = true
     where mp.master_id = $1
     limit 1`,
    [profileId],
  );
  const row = r.rows[0];
  if (!row) return null;
  return {
    phone: row.phone?.trim() || null,
    fullName: row.display_name?.trim() || null,
    address: row.public_address?.trim() || null,
  };
}

function mergeMasterCabinetPersonalFields(
  row: { role: string; full_name: string; phone: string | null; address: string | null },
  master: MasterCabinetPersonalFields | null,
): { full_name: string; phone: string | null; address: string | null } {
  if (!master || (row.role !== 'master' && row.role !== 'platform_admin')) {
    return { full_name: row.full_name, phone: row.phone, address: row.address };
  }

  return {
    full_name: row.full_name?.trim() ? row.full_name : master.fullName ?? row.full_name,
    phone: row.phone?.trim() ? row.phone : master.phone,
    address: row.address?.trim() ? row.address : master.address,
  };
}

/** Копирует телефон / имя / адрес из кабинета мастера в profiles (для клиентского профиля). */
export async function syncUserProfileFromMasterCabinet(
  profileId: string,
  patch: {
    full_name?: string | null;
    phone?: string | null;
    address?: string | null;
  },
): Promise<void> {
  const userPatch: {
    full_name?: string;
    phone?: string | null;
    address?: string | null;
  } = {};

  if (patch.full_name !== undefined) {
    const name = patch.full_name?.trim();
    if (name) userPatch.full_name = name;
  }
  if (patch.phone !== undefined) {
    userPatch.phone = patch.phone?.trim() ? patch.phone.trim() : null;
  }
  if (patch.address !== undefined) {
    userPatch.address = patch.address?.trim() ? patch.address.trim() : null;
  }

  if (Object.keys(userPatch).length > 0) {
    await updateProfile(profileId, userPatch);
  }
}

/** Обратная синхронизация: правки в клиентском профиле → кабинет мастера. */
export async function syncMasterCabinetFromUserProfile(
  profileId: string,
  patch: {
    full_name?: string;
    phone?: string | null;
    address?: string | null;
  },
): Promise<void> {
  const exists = await query(`select 1 from public.master_profiles where master_id = $1 limit 1`, [profileId]);
  if (!exists.rowCount) return;

  const fields: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  if (patch.full_name !== undefined) {
    fields.push(`display_name = $${i++}`);
    vals.push(patch.full_name);
  }
  if (patch.phone !== undefined) {
    fields.push(`phone = $${i++}`);
    vals.push(patch.phone);
  }

  if (fields.length) {
    vals.push(profileId);
    await query(
      `update public.master_profiles set ${fields.join(', ')}, updated_at = now() where master_id = $${i}`,
      vals,
    );
  }

  if (patch.address !== undefined) {
    await query(
      `update public.master_locations
       set public_address = $1, updated_at = now()
       where master_id = $2 and is_primary = true`,
      [patch.address?.trim() || '', profileId],
    );
  }
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
  const [header_avatar_url, account_email, masterPersonal] = await Promise.all([
    resolveHeaderAvatarUrl(profileId, row.role, row.avatar_url),
    resolveAccountEmail(profileId),
    row.role === 'master' || row.role === 'platform_admin'
      ? fetchMasterCabinetPersonalFields(profileId)
      : Promise.resolve(null),
  ]);
  const personal = mergeMasterCabinetPersonalFields(row, masterPersonal);

  if (
    masterPersonal &&
    (row.role === 'master' || row.role === 'platform_admin')
  ) {
    const backfill: {
      full_name?: string | null;
      phone?: string | null;
      address?: string | null;
    } = {};
    if (!row.full_name?.trim() && personal.full_name?.trim()) {
      backfill.full_name = personal.full_name;
    }
    if (!row.phone?.trim() && personal.phone) {
      backfill.phone = personal.phone;
    }
    if (!row.address?.trim() && personal.address) {
      backfill.address = personal.address;
    }
    if (Object.keys(backfill).length > 0) {
      void syncUserProfileFromMasterCabinet(profileId, backfill);
    }
  }

  return {
    id: row.id,
    telegram_user_id: toTelegramUserIdNumber(row.telegram_user_id),
    telegram_username: row.telegram_username,
    full_name: personal.full_name,
    avatar_url: row.avatar_url,
    header_avatar_url,
    role: row.role,
    phone: personal.phone,
    address: personal.address,
    account_email,
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
