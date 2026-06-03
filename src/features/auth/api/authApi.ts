import { apiFetch } from '../../../shared/api/backendClient';
import { readAuthApiError } from '../lib/authApiErrors';
import type { AuthIdentityDto, AuthSessionResponse, AuthSessionRowDto } from '../types';
import type { ConsentAcceptancePayload } from '../../legal/api/legalApi';
import { readApiErrorWithConsent } from '../../legal/api/legalApi';

type LoginOptions = {
  consents?: ConsentAcceptancePayload[];
};

export async function loginWithTelegram(
  initDataRaw: string,
  options?: LoginOptions,
): Promise<AuthSessionResponse> {
  const res = await apiFetch('/api/auth/telegram', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ initDataRaw, ...(options?.consents ? { consents: options.consents } : {}) }),
  });
  if (!res.ok) {
    const parsed = await readApiErrorWithConsent(res);
    if (parsed.consentRequired) {
      const err = new Error(parsed.message) as Error & { consentRequired?: typeof parsed.consentRequired };
      err.consentRequired = parsed.consentRequired;
      throw err;
    }
    throw new Error(await readAuthApiError(res));
  }
  return (await res.json()) as AuthSessionResponse;
}

export async function loginWithGoogle(
  idToken: string,
  options?: LoginOptions,
): Promise<AuthSessionResponse> {
  const res = await apiFetch('/api/auth/google', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ idToken, ...(options?.consents ? { consents: options.consents } : {}) }),
  });
  if (!res.ok) {
    const parsed = await readApiErrorWithConsent(res);
    if (parsed.consentRequired) {
      const err = new Error(parsed.message) as Error & { consentRequired?: typeof parsed.consentRequired };
      err.consentRequired = parsed.consentRequired;
      throw err;
    }
    throw new Error(await readAuthApiError(res));
  }
  return (await res.json()) as AuthSessionResponse;
}

export async function completeGoogleLoginPending(
  pendingToken: string,
  consents: ConsentAcceptancePayload[],
): Promise<AuthSessionResponse> {
  const res = await apiFetch('/api/auth/google/complete-pending', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ pendingToken, consents }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as AuthSessionResponse;
}

export async function loginWithEmail(
  email: string,
  password: string,
  options?: LoginOptions,
): Promise<AuthSessionResponse> {
  const res = await apiFetch('/api/auth/email/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password, ...(options?.consents ? { consents: options.consents } : {}) }),
  });
  if (!res.ok) {
    const parsed = await readApiErrorWithConsent(res);
    if (parsed.consentRequired) {
      const err = new Error(parsed.message) as Error & { consentRequired?: typeof parsed.consentRequired };
      err.consentRequired = parsed.consentRequired;
      throw err;
    }
    throw new Error(await readAuthApiError(res));
  }
  return (await res.json()) as AuthSessionResponse;
}

export async function registerWithEmail(
  email: string,
  password: string,
  options?: LoginOptions,
): Promise<AuthSessionResponse> {
  const res = await apiFetch('/api/auth/email/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password, ...(options?.consents ? { consents: options.consents } : {}) }),
  });
  if (!res.ok) {
    const parsed = await readApiErrorWithConsent(res);
    if (parsed.consentRequired) {
      const err = new Error(parsed.message) as Error & { consentRequired?: typeof parsed.consentRequired };
      err.consentRequired = parsed.consentRequired;
      throw err;
    }
    throw new Error(await readAuthApiError(res));
  }
  return (await res.json()) as AuthSessionResponse;
}

export async function fetchAuthIdentities(): Promise<AuthIdentityDto[]> {
  const res = await apiFetch('/api/auth/identities');
  if (!res.ok) throw new Error(await readAuthApiError(res));
  const d = (await res.json()) as { identities?: AuthIdentityDto[] };
  return d.identities ?? [];
}

export async function fetchAuthSessions(): Promise<AuthSessionRowDto[]> {
  const res = await apiFetch('/api/auth/sessions');
  if (!res.ok) throw new Error(await readAuthApiError(res));
  const d = (await res.json()) as { sessions?: AuthSessionRowDto[] };
  return d.sessions ?? [];
}

export async function revokeAuthSession(
  sessionId: string,
): Promise<{ ok: boolean; revokedCurrent: boolean }> {
  const res = await apiFetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as { ok: boolean; revokedCurrent: boolean };
}

export async function revokeOtherAuthSessions(): Promise<{ ok: boolean; revokedCount: number }> {
  const res = await apiFetch('/api/auth/sessions/revoke-others', { method: 'POST' });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as { ok: boolean; revokedCount: number };
}

export async function linkTelegram(initDataRaw: string): Promise<AuthIdentityDto[]> {
  const res = await apiFetch('/api/auth/link/telegram', {
    method: 'POST',
    body: JSON.stringify({ initDataRaw }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  const d = (await res.json()) as { identities?: AuthIdentityDto[] };
  return d.identities ?? [];
}

export async function startGoogleOAuth(params: {
  purpose: 'link' | 'login';
  returnPath?: string;
}): Promise<{ authorizationUrl: string }> {
  const res = await apiFetch('/api/auth/google/oauth/start', {
    method: 'POST',
    skipAuth: params.purpose === 'login',
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as { authorizationUrl: string };
}

export async function createGoogleLinkHandoff(): Promise<{ handoffToken: string }> {
  const res = await apiFetch('/api/auth/google/link-handoff', { method: 'POST' });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as { handoffToken: string };
}

export async function linkGoogle(
  idToken: string,
  handoffToken?: string,
): Promise<AuthIdentityDto[]> {
  const res = await apiFetch('/api/auth/link/google', {
    method: 'POST',
    skipAuth: Boolean(handoffToken),
    body: JSON.stringify({
      idToken,
      ...(handoffToken ? { handoffToken } : {}),
    }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  const d = (await res.json()) as { identities?: AuthIdentityDto[] };
  return d.identities ?? [];
}

export async function linkEmail(email: string, password: string): Promise<AuthIdentityDto[]> {
  const res = await apiFetch('/api/auth/link/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  const d = (await res.json()) as { identities?: AuthIdentityDto[] };
  return d.identities ?? [];
}

export async function sendEmailVerification(email?: string): Promise<{ ok: boolean; sent: boolean }> {
  const res = await apiFetch('/api/auth/email/send-verification', {
    method: 'POST',
    body: JSON.stringify(email ? { email } : {}),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as { ok: boolean; sent: boolean };
}

export async function verifyEmailToken(token: string): Promise<{ ok: boolean; verified: boolean }> {
  const res = await apiFetch('/api/auth/email/verify', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as { ok: boolean; verified: boolean };
}

export async function requestForgotPassword(email: string): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch('/api/auth/email/forgot-password', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as { ok: boolean; message: string };
}

export async function resetPasswordWithToken(
  token: string,
  password: string,
): Promise<{ ok: boolean }> {
  const res = await apiFetch('/api/auth/email/reset-password', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as { ok: boolean };
}
