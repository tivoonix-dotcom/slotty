import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { verifyTelegramInitData } from './telegram.js';
import {
  linkEmailToProfile,
  linkGoogleToProfile,
  linkTelegramToProfile,
  loginWithEmailIdentity,
  registerWithEmailIdentity,
  loginOrRegisterWithGoogle,
  loginOrRegisterWithTelegram,
} from './authIdentities.service.js';
import { verifyGoogleIdToken } from './googleAuth.js';
import { sendVerificationEmailForProfile } from './email/emailAuth.service.js';

function scheduleVerificationEmail(profileId: string) {
  void sendVerificationEmailForProfile(profileId).catch((e) => {
    console.error('[SLOTTY] send verification email failed:', e);
  });
}

function displayNameFromTelegram(first?: string, last?: string, username?: string): string {
  const n = [first?.trim(), last?.trim()].filter(Boolean).join(' ').trim();
  if (n) return n;
  if (username?.trim()) return `@${username.trim()}`;
  return 'Telegram user';
}

function verifyTelegramInitDataOrThrow(initDataRaw: string) {
  if (!env.TELEGRAM_BOT_TOKEN?.trim()) {
    throw ApiError.internal('Telegram bot token is not configured', 'NO_TELEGRAM_BOT_TOKEN');
  }
  try {
    return verifyTelegramInitData(initDataRaw.trim(), env.TELEGRAM_BOT_TOKEN.trim());
  } catch {
    throw ApiError.unauthorized('Invalid Telegram initData', 'TELEGRAM_INITDATA_INVALID');
  }
}

/**
 * Login or register via Telegram Web App initData.
 * Uses auth_identities; keeps profiles.telegram_user_id in sync.
 */
export async function loginWithTelegram(initDataRaw: string) {
  const verified = verifyTelegramInitDataOrThrow(initDataRaw);
  const fullName = displayNameFromTelegram(
    verified.user.first_name,
    verified.user.last_name,
    verified.user.username,
  );
  try {
    return await loginOrRegisterWithTelegram(verified.user, fullName);
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

export async function linkTelegram(initDataRaw: string, profileId: string) {
  const verified = verifyTelegramInitDataOrThrow(initDataRaw);
  const fullName = displayNameFromTelegram(
    verified.user.first_name,
    verified.user.last_name,
    verified.user.username,
  );
  const identities = await linkTelegramToProfile(profileId, verified.user, fullName);
  return { identities };
}

export async function loginWithGoogle(idToken: string) {
  const payload = await verifyGoogleIdToken(idToken);
  return loginOrRegisterWithGoogle(payload);
}

export async function linkGoogle(idToken: string, profileId: string) {
  const payload = await verifyGoogleIdToken(idToken);
  const identities = await linkGoogleToProfile(profileId, payload);
  return { identities };
}

export async function loginWithEmail(email: string, password: string) {
  return loginWithEmailIdentity(email, password);
}

export async function registerWithEmail(email: string, password: string) {
  const { session, isNewRegistration } = await registerWithEmailIdentity(email, password);
  if (isNewRegistration) {
    scheduleVerificationEmail(session.profile.id);
  }
  return session;
}

export async function linkEmail(email: string, password: string, profileId: string) {
  const identities = await linkEmailToProfile(profileId, email, password);
  scheduleVerificationEmail(profileId);
  return { identities };
}
