import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { resolvePublicApiBaseUrl } from '../telegram/telegram.webhookConfig.js';
import { ApiError } from '../../utils/ApiError.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export type GoogleOAuthPurpose = 'link' | 'login';

export type GoogleOAuthState = {
  purpose: GoogleOAuthPurpose;
  profileId?: string;
  returnPath?: string;
};

export type GoogleOAuthDiagnostics = {
  configured: boolean;
  missing: Array<'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'PUBLIC_API_URL'>;
  redirectUri?: string;
};

function trimUrl(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t && t.length > 0 ? t.replace(/\/$/, '') : undefined;
}

/** Явный callback из env (приоритет). */
function redirectUriFromEnv(): string | undefined {
  const explicit = trimUrl(process.env.GOOGLE_OAUTH_REDIRECT_URI);
  if (explicit) return explicit;
  const base = resolvePublicApiBaseUrl();
  return base ? `${base}/api/auth/google/oauth/callback` : undefined;
}

/** Callback с хоста запроса (Railway / reverse proxy). */
function redirectUriFromRequest(req?: Request): string | undefined {
  if (!req) return undefined;
  const proto = (req.get('x-forwarded-proto') ?? req.protocol ?? 'https').split(',')[0]?.trim();
  const host = (req.get('x-forwarded-host') ?? req.get('host'))?.split(',')[0]?.trim();
  if (!proto || !host) return undefined;
  return `${proto}://${host}/api/auth/google/oauth/callback`;
}

export function getGoogleOAuthDiagnostics(req?: Request): GoogleOAuthDiagnostics {
  const missing: GoogleOAuthDiagnostics['missing'] = [];
  if (!env.GOOGLE_CLIENT_ID?.trim()) missing.push('GOOGLE_CLIENT_ID');
  if (!env.GOOGLE_CLIENT_SECRET?.trim()) missing.push('GOOGLE_CLIENT_SECRET');

  const redirectUri = redirectUriFromEnv() ?? redirectUriFromRequest(req);
  if (!redirectUri) missing.push('PUBLIC_API_URL');

  return {
    configured: missing.length === 0,
    missing,
    redirectUri,
  };
}

function ensureGoogleOAuthConfigured(req?: Request): { clientId: string; clientSecret: string; redirectUri: string } {
  const diag = getGoogleOAuthDiagnostics(req);
  if (!env.GOOGLE_CLIENT_ID?.trim()) {
    throw ApiError.serviceUnavailable('Google Sign-In не настроен (GOOGLE_CLIENT_ID)', 'GOOGLE_NOT_CONFIGURED');
  }
  if (!env.GOOGLE_CLIENT_SECRET?.trim()) {
    throw ApiError.serviceUnavailable(
      'Привязка Google из Telegram: добавьте GOOGLE_CLIENT_SECRET на сервере API (Google Cloud → OAuth client → Client secret)',
      'GOOGLE_OAUTH_NOT_CONFIGURED',
    );
  }
  if (!diag.redirectUri) {
    throw ApiError.serviceUnavailable(
      'Не задан публичный URL API (PUBLIC_API_URL, RAILWAY_PUBLIC_DOMAIN или GOOGLE_OAUTH_REDIRECT_URI)',
      'API_PUBLIC_URL_MISSING',
    );
  }
  return {
    clientId: env.GOOGLE_CLIENT_ID.trim(),
    clientSecret: env.GOOGLE_CLIENT_SECRET.trim(),
    redirectUri: diag.redirectUri,
  };
}

export function signGoogleOAuthState(state: GoogleOAuthState): string {
  return jwt.sign(state, env.JWT_SECRET, { expiresIn: '15m' });
}

export function signGoogleLinkHandoff(profileId: string, jti: string): string {
  return jwt.sign(
    { purpose: 'google_link_handoff', profileId: profileId.trim(), jti: jti.trim() },
    env.JWT_SECRET,
    { expiresIn: '15m' },
  );
}

export function verifyGoogleLinkHandoff(token: string): { profileId: string; jti: string } {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      purpose?: string;
      profileId?: string;
      jti?: string;
    };
    if (
      payload.purpose !== 'google_link_handoff' ||
      !payload.profileId?.trim() ||
      !payload.jti?.trim()
    ) {
      throw new Error('invalid handoff');
    }
    return { profileId: payload.profileId.trim(), jti: payload.jti.trim() };
  } catch {
    throw ApiError.badRequest('Ссылка для привязки Google устарела. Откройте снова из Telegram.', 'GOOGLE_LINK_HANDOFF_INVALID');
  }
}

export function verifyGoogleOAuthState(token: string): GoogleOAuthState {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as GoogleOAuthState;
    if (payload.purpose !== 'link' && payload.purpose !== 'login') {
      throw new Error('invalid purpose');
    }
    if (payload.purpose === 'link' && !payload.profileId?.trim()) {
      throw new Error('missing profileId');
    }
    return payload;
  } catch {
    throw ApiError.badRequest('Invalid or expired Google OAuth state', 'GOOGLE_OAUTH_STATE_INVALID');
  }
}

export function buildGoogleAuthorizationUrl(stateToken: string, req?: Request): string {
  const { clientId, redirectUri } = ensureGoogleOAuthConfigured(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: stateToken,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthorizationCode(code: string, req?: Request): Promise<string> {
  const { clientId, clientSecret, redirectUri } = ensureGoogleOAuthConfigured(req);

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: code.trim(),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  const idToken = data.id_token?.trim();
  if (!res.ok || !idToken) {
    const detail = data.error_description?.trim() || data.error?.trim() || `HTTP ${res.status}`;
    throw ApiError.unauthorized(`Google OAuth failed: ${detail}`, 'GOOGLE_OAUTH_EXCHANGE_FAILED');
  }
  return idToken;
}

export function buildClientOAuthDoneUrl(params: {
  purpose: GoogleOAuthPurpose;
  token?: string;
  error?: string;
  returnPath?: string;
  pendingToken?: string;
  isNewUser?: string;
}): string {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  const url = new URL(`${base}/auth/google/done`);
  if (params.error) url.searchParams.set('error', params.error);
  if (params.purpose === 'link') url.searchParams.set('status', 'linked');
  if (params.returnPath?.startsWith('/')) url.searchParams.set('from', params.returnPath);
  if (params.pendingToken) url.searchParams.set('pending', params.pendingToken);
  if (params.isNewUser) url.searchParams.set('isNewUser', params.isNewUser);
  const hash = params.token ? `#token=${encodeURIComponent(params.token)}` : '';
  return `${url.toString()}${hash}`;
}
