import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import type { TelegramWebAppUser } from './telegram.js';
import type { AuthIdentityPublic, AuthProvider } from './authIdentities.types.js';
import type { GoogleIdTokenPayload } from './googleAuth.js';

const EMAIL_PROVIDER_USER_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAuthEmail(raw: string): string {
  const e = raw.trim().toLowerCase();
  if (!EMAIL_PROVIDER_USER_RE.test(e)) {
    throw ApiError.badRequest('Введите корректный email', 'EMAIL_INVALID');
  }
  return e;
}

export async function findProfileIdByIdentity(
  provider: AuthProvider,
  providerUserId: string,
): Promise<string | null> {
  const r = await query<{ profile_id: string }>(
    `select profile_id from public.auth_identities
      where provider = $1::public.auth_provider and provider_user_id = $2`,
    [provider, providerUserId],
  );
  return r.rows[0]?.profile_id ?? null;
}

export async function listAuthIdentitiesForProfile(profileId: string): Promise<AuthIdentityPublic[]> {
  const r = await query<{
    provider: AuthProvider;
    email: string | null;
    created_at: Date | string;
    email_verified_at: Date | string | null;
  }>(
    `select provider::text as provider, email, created_at, email_verified_at
       from public.auth_identities
      where profile_id = $1
      order by created_at asc`,
    [profileId],
  );
  return r.rows.map((row) => ({
    provider: row.provider,
    email: row.email,
    linkedAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    ...(row.provider === 'email'
      ? { emailVerified: Boolean(row.email_verified_at) }
      : {}),
  }));
}

async function assertIdentityNotLinkedToOtherProfile(
  client: PoolClient,
  provider: AuthProvider,
  providerUserId: string,
  currentProfileId: string,
): Promise<void> {
  const r = await client.query<{ profile_id: string }>(
    `select profile_id from public.auth_identities
      where provider = $1::public.auth_provider and provider_user_id = $2`,
    [provider, providerUserId],
  );
  const existing = r.rows[0]?.profile_id;
  if (existing && existing !== currentProfileId) {
    const msg =
      provider === 'google'
        ? 'Этот Google уже привязан к другому аккаунту'
        : provider === 'telegram'
          ? 'Этот Telegram уже привязан к другому аккаунту'
          : 'Этот email уже привязан к другому аккаунту';
    const code =
      provider === 'google'
        ? 'GOOGLE_ALREADY_LINKED'
        : provider === 'telegram'
          ? 'TELEGRAM_ALREADY_LINKED'
          : 'EMAIL_ALREADY_LINKED';
    throw ApiError.conflict(msg, code);
  }
}

async function upsertIdentity(
  client: PoolClient,
  params: {
    profileId: string;
    provider: AuthProvider;
    providerUserId: string;
    email?: string | null;
    credentialHash?: string | null;
  },
): Promise<void> {
  await client.query(
    `insert into public.auth_identities (
       profile_id, provider, provider_user_id, email, credential_hash
     ) values ($1, $2::public.auth_provider, $3, $4, $5)
     on conflict (provider, provider_user_id) do update set
       profile_id = excluded.profile_id,
       email = coalesce(excluded.email, public.auth_identities.email),
       credential_hash = coalesce(excluded.credential_hash, public.auth_identities.credential_hash),
       updated_at = now()`,
    [
      params.profileId,
      params.provider,
      params.providerUserId,
      params.email ?? null,
      params.credentialHash ?? null,
    ],
  );
}

async function createProfileRow(
  client: PoolClient,
  params: {
    fullName: string;
    avatarUrl?: string | null;
    telegramUserId?: number | string | null;
    telegramUsername?: string | null;
  },
): Promise<string> {
  const r = await client.query<{ id: string }>(
    `insert into public.profiles (full_name, avatar_url, telegram_user_id, telegram_username, role)
     values ($1, $2, $3, $4, 'client')
     returning id`,
    [
      params.fullName,
      params.avatarUrl ?? null,
      params.telegramUserId ?? null,
      params.telegramUsername ?? null,
    ],
  );
  const id = r.rows[0]?.id;
  if (!id) throw ApiError.internal('Failed to create profile', 'PROFILE_CREATE_FAILED');
  return id;
}

async function syncTelegramProfileColumns(
  client: PoolClient,
  profileId: string,
  user: TelegramWebAppUser,
  fullName: string,
): Promise<void> {
  const tgUsername = user.username?.trim() || null;
  const avatarUrl = user.photo_url?.trim() || null;
  await client.query(
    `update public.profiles set
       telegram_user_id = $2,
       telegram_username = $3,
       full_name = coalesce(nullif(trim(full_name), ''), $4),
       avatar_url = coalesce(nullif(trim(avatar_url), ''), $5),
       updated_at = now()
     where id = $1`,
    [profileId, user.id, tgUsername, fullName, avatarUrl],
  );
}

export async function issueSessionForProfile(profileId: string) {
  const { getProfileById } = await import('../profiles/profiles.service.js');
  const { signAccessToken } = await import('./authTokens.js');
  const profile = await getProfileById(profileId);
  const role = profile.role as 'client' | 'master' | 'platform_admin';
  if (role !== 'client' && role !== 'master' && role !== 'platform_admin') {
    throw ApiError.internal('Invalid profile role', 'BAD_ROLE');
  }
  const token = signAccessToken(profileId, role);
  return { token, profile };
}

/** Login or register via Telegram initData (standalone, not linking). */
export async function loginOrRegisterWithTelegram(user: TelegramWebAppUser, fullName: string) {
  const providerUserId = String(user.id);
  const existingProfileId = await findProfileIdByIdentity('telegram', providerUserId);

  if (existingProfileId) {
    await withTransaction(async (client) => {
      await syncTelegramProfileColumns(client, existingProfileId, user, fullName);
    });
    return issueSessionForProfile(existingProfileId);
  }

  const profileId = await withTransaction(async (client) => {
    const id = await createProfileRow(client, {
      fullName,
      avatarUrl: user.photo_url?.trim() || null,
      telegramUserId: user.id,
      telegramUsername: user.username?.trim() || null,
    });
    await upsertIdentity(client, {
      profileId: id,
      provider: 'telegram',
      providerUserId,
      email: null,
    });
    return id;
  });

  return issueSessionForProfile(profileId);
}

/** Link Telegram to an already authenticated profile. */
export async function linkTelegramToProfile(profileId: string, user: TelegramWebAppUser, fullName: string) {
  const providerUserId = String(user.id);
  const existingProfileId = await findProfileIdByIdentity('telegram', providerUserId);
  if (existingProfileId === profileId) {
    await withTransaction(async (client) => {
      await syncTelegramProfileColumns(client, profileId, user, fullName);
    });
    return listAuthIdentitiesForProfile(profileId);
  }

  await withTransaction(async (client) => {
    await assertIdentityNotLinkedToOtherProfile(client, 'telegram', providerUserId, profileId);
    await upsertIdentity(client, {
      profileId,
      provider: 'telegram',
      providerUserId,
      email: null,
    });
    await syncTelegramProfileColumns(client, profileId, user, fullName);
  });
  return listAuthIdentitiesForProfile(profileId);
}

export async function loginOrRegisterWithGoogle(payload: GoogleIdTokenPayload) {
  const providerUserId = payload.sub;
  const existingProfileId = await findProfileIdByIdentity('google', providerUserId);

  if (existingProfileId) {
    if (payload.name || payload.picture) {
      await query(
        `update public.profiles set
           full_name = coalesce(nullif(trim($2), ''), full_name),
           avatar_url = coalesce(nullif(trim(avatar_url), ''), $3),
           updated_at = now()
         where id = $1`,
        [existingProfileId, payload.name ?? null, payload.picture ?? null],
      );
    }
    return issueSessionForProfile(existingProfileId);
  }

  const displayName = payload.name?.trim() || payload.email?.split('@')[0] || 'Google user';
  const profileId = await withTransaction(async (client) => {
    const id = await createProfileRow(client, {
      fullName: displayName,
      avatarUrl: payload.picture ?? null,
    });
    await upsertIdentity(client, {
      profileId: id,
      provider: 'google',
      providerUserId,
      email: payload.email ?? null,
    });
    return id;
  });

  return issueSessionForProfile(profileId);
}

export async function linkGoogleToProfile(profileId: string, payload: GoogleIdTokenPayload) {
  const existingProfileId = await findProfileIdByIdentity('google', payload.sub);
  if (existingProfileId === profileId) {
    return listAuthIdentitiesForProfile(profileId);
  }

  await withTransaction(async (client) => {
    await assertIdentityNotLinkedToOtherProfile(client, 'google', payload.sub, profileId);
    await upsertIdentity(client, {
      profileId,
      provider: 'google',
      providerUserId: payload.sub,
      email: payload.email ?? null,
    });
    if (payload.name) {
      await client.query(
        `update public.profiles set
           full_name = coalesce(nullif(trim($2), ''), full_name),
           updated_at = now()
         where id = $1`,
        [profileId, payload.name ?? null],
      );
    }
  });
  return listAuthIdentitiesForProfile(profileId);
}

export async function hashEmailPassword(password: string): Promise<string> {
  if (password.length < 8) {
    throw ApiError.badRequest('Пароль минимум 8 символов', 'PASSWORD_TOO_SHORT');
  }
  return bcrypt.hash(password, 10);
}

export async function verifyEmailPassword(password: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/** All profiles tied to this email (email provider id or identity.email column). */
async function findProfileIdsMatchingEmail(email: string): Promise<string[]> {
  const r = await query<{ profile_id: string }>(
    `select distinct profile_id from public.auth_identities
      where (provider = 'email'::public.auth_provider and provider_user_id = $1)
         or (lower(trim(coalesce(email, ''))) = $1)`,
    [email],
  );
  return r.rows.map((row) => row.profile_id);
}

/** Prefer Google-linked master profile when the same email exists on several accounts. */
async function pickPreferredProfileIdForEmail(profileIds: string[]): Promise<string | null> {
  if (profileIds.length === 0) return null;
  if (profileIds.length === 1) return profileIds[0];

  const r = await query<{ id: string }>(
    `select p.id
       from public.profiles p
      where p.id = any($1::uuid[])
      order by
        (exists (
          select 1 from public.auth_identities ai
           where ai.profile_id = p.id and ai.provider = 'google'::public.auth_provider
        )) desc,
        case p.role when 'master' then 0 when 'client' then 1 else 2 end,
        p.created_at asc
      limit 1`,
    [profileIds],
  );
  return r.rows[0]?.id ?? profileIds[0];
}

async function getEmailCredentialHash(profileId: string): Promise<string | null> {
  const r = await query<{ credential_hash: string | null }>(
    `select credential_hash from public.auth_identities
      where profile_id = $1 and provider = 'email'::public.auth_provider`,
    [profileId],
  );
  return r.rows[0]?.credential_hash ?? null;
}

async function assignEmailIdentityToProfile(
  client: PoolClient,
  profileId: string,
  email: string,
  credentialHash: string,
) {
  await upsertIdentity(client, {
    profileId,
    provider: 'email',
    providerUserId: email,
    email,
    credentialHash,
  });
}

/** Login only: verify password and open the preferred (Google/master) account when email is shared. */
export async function loginWithEmailIdentity(emailRaw: string, password: string) {
  const email = normalizeAuthEmail(emailRaw);
  const matchingProfileIds = await findProfileIdsMatchingEmail(email);
  const preferredProfileId = await pickPreferredProfileIdForEmail(matchingProfileIds);

  let hadEmailPassword = false;
  for (const profileId of matchingProfileIds) {
    const credentialHash = await getEmailCredentialHash(profileId);
    if (!credentialHash) continue;
    hadEmailPassword = true;
    if (!(await verifyEmailPassword(password, credentialHash))) continue;

    const targetProfileId = preferredProfileId ?? profileId;
    if (profileId !== targetProfileId) {
      await withTransaction(async (client) => {
        await assignEmailIdentityToProfile(client, targetProfileId, email, credentialHash);
      });
    }
    return issueSessionForProfile(targetProfileId);
  }

  if (hadEmailPassword) {
    throw ApiError.unauthorized('Неверный email или пароль', 'EMAIL_LOGIN_FAILED');
  }

  if (matchingProfileIds.length > 0) {
    throw ApiError.unauthorized(
      'Для этого email войдите через Google или задайте пароль в кабинете в разделе «Способы входа»',
      'EMAIL_PASSWORD_NOT_SET',
    );
  }

  throw ApiError.unauthorized('Неверный email или пароль', 'EMAIL_LOGIN_FAILED');
}

/** Register only: attach email+password to an existing Google/master profile or create a new one. */
export async function registerWithEmailIdentity(emailRaw: string, password: string) {
  const email = normalizeAuthEmail(emailRaw);
  const matchingProfileIds = await findProfileIdsMatchingEmail(email);
  const preferredProfileId = await pickPreferredProfileIdForEmail(matchingProfileIds);

  if (preferredProfileId) {
    const existingHash = await getEmailCredentialHash(preferredProfileId);
    if (existingHash) {
      throw ApiError.conflict('Этот email уже зарегистрирован. Войдите или восстановите пароль.', 'EMAIL_ALREADY_REGISTERED');
    }

    const hash = await hashEmailPassword(password);
    await withTransaction(async (client) => {
      await assignEmailIdentityToProfile(client, preferredProfileId, email, hash);
    });
    const session = await issueSessionForProfile(preferredProfileId);
    return { session, isNewRegistration: true as const };
  }

  const existingEmailProfileId = await findProfileIdByIdentity('email', email);
  if (existingEmailProfileId) {
    throw ApiError.conflict('Этот email уже зарегистрирован. Войдите или восстановите пароль.', 'EMAIL_ALREADY_REGISTERED');
  }

  const hash = await hashEmailPassword(password);
  const displayName = email.split('@')[0] || 'User';
  const profileId = await withTransaction(async (client) => {
    const id = await createProfileRow(client, { fullName: displayName });
    await assignEmailIdentityToProfile(client, id, email, hash);
    return id;
  });

  const session = await issueSessionForProfile(profileId);
  return { session, isNewRegistration: true as const };
}

export async function linkEmailToProfile(profileId: string, emailRaw: string, password: string) {
  const email = normalizeAuthEmail(emailRaw);
  const hash = await hashEmailPassword(password);
  await withTransaction(async (client) => {
    await assignEmailIdentityToProfile(client, profileId, email, hash);
  });
  return listAuthIdentitiesForProfile(profileId);
}

/** Resolve Telegram chat id for notifications (auth_identities first, then profiles cache). */
export async function getTelegramUserIdForProfile(profileId: string): Promise<string | null> {
  const fromIdentity = await query<{ tid: string }>(
    `select provider_user_id as tid from public.auth_identities
      where profile_id = $1 and provider = 'telegram'::public.auth_provider
      limit 1`,
    [profileId],
  );
  if (fromIdentity.rows[0]?.tid) return fromIdentity.rows[0].tid;

  const fromProfile = await query<{ tid: string | null }>(
    `select telegram_user_id::text as tid from public.profiles where id = $1`,
    [profileId],
  );
  return fromProfile.rows[0]?.tid?.trim() || null;
}
