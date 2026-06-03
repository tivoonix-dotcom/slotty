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
import { syncMasterAccountVerified } from './accountVerification.js';
import { sendVerificationEmailForProfile } from './email/emailAuth.service.js';
import type { AuthConsentGateOptions } from './authConsent.service.js';
import type { ConsentAcceptanceInput } from '../legal/legal.types.js';
import { consumePendingGoogleLogin } from './googleLoginPending.store.js';
import type { IssueSessionContext } from './authSessions.service.js';

async function syncVerifiedAfterIdentityChange(profileId: string) {
  await syncMasterAccountVerified(profileId).catch((e) => {
    console.error('[SLOTTY] sync master is_verified failed:', e);
  });
}

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
export async function loginWithTelegram(
  initDataRaw: string,
  consentGate?: AuthConsentGateOptions,
  sessionCtx?: IssueSessionContext,
) {
  const verified = verifyTelegramInitDataOrThrow(initDataRaw);
  const fullName = displayNameFromTelegram(
    verified.user.first_name,
    verified.user.last_name,
    verified.user.username,
  );
  try {
    return await loginOrRegisterWithTelegram(verified.user, fullName, consentGate, sessionCtx);
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
  await syncVerifiedAfterIdentityChange(profileId);
  return { identities };
}

export async function loginWithGoogle(
  idToken: string,
  consentGate?: AuthConsentGateOptions,
  sessionCtx?: IssueSessionContext,
) {
  const payload = await verifyGoogleIdToken(idToken);
  return loginOrRegisterWithGoogle(payload, consentGate, sessionCtx);
}

export async function completeGoogleLoginWithPending(
  pendingToken: string,
  consents: ConsentAcceptanceInput[] | undefined,
  consentGate: AuthConsentGateOptions,
  sessionCtx?: IssueSessionContext,
) {
  const idToken = consumePendingGoogleLogin(pendingToken);
  return loginWithGoogle(idToken, { consents, meta: consentGate.meta }, sessionCtx);
}

export async function linkGoogle(idToken: string, profileId: string) {
  const payload = await verifyGoogleIdToken(idToken);
  const identities = await linkGoogleToProfile(profileId, payload);
  await syncVerifiedAfterIdentityChange(profileId);
  return { identities };
}

export async function loginWithEmail(
  email: string,
  password: string,
  consentGate?: AuthConsentGateOptions,
  sessionCtx?: IssueSessionContext,
) {
  return loginWithEmailIdentity(email, password, consentGate, sessionCtx);
}

export async function registerWithEmail(
  email: string,
  password: string,
  consentGate?: AuthConsentGateOptions,
  sessionCtx?: IssueSessionContext,
) {
  const { session, isNewRegistration } = await registerWithEmailIdentity(
    email,
    password,
    consentGate,
    sessionCtx,
  );
  if (isNewRegistration) {
    scheduleVerificationEmail(session.profile.id);
  }
  return session;
}

export { buildConsentGateFromRequest, consentSourceFromRequest } from './authConsentRequest.js';

export async function linkEmail(email: string, password: string, profileId: string) {
  const identities = await linkEmailToProfile(profileId, email, password);
  scheduleVerificationEmail(profileId);
  await syncVerifiedAfterIdentityChange(profileId);
  return { identities };
}
