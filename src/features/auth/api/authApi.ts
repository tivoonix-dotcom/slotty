import { apiFetch } from '../../../shared/api/backendClient';
import { readAuthApiError } from '../lib/authApiErrors';
import type { AuthIdentityDto, AuthSessionResponse } from '../types';

export async function loginWithTelegram(initDataRaw: string): Promise<AuthSessionResponse> {
  const res = await apiFetch('/api/auth/telegram', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ initDataRaw }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as AuthSessionResponse;
}

export async function loginWithGoogle(idToken: string): Promise<AuthSessionResponse> {
  const res = await apiFetch('/api/auth/google', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as AuthSessionResponse;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthSessionResponse> {
  const res = await apiFetch('/api/auth/email/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as AuthSessionResponse;
}

export async function registerWithEmail(email: string, password: string): Promise<AuthSessionResponse> {
  const res = await apiFetch('/api/auth/email/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readAuthApiError(res));
  return (await res.json()) as AuthSessionResponse;
}

export async function fetchAuthIdentities(): Promise<AuthIdentityDto[]> {
  const res = await apiFetch('/api/auth/identities');
  if (!res.ok) throw new Error(await readAuthApiError(res));
  const d = (await res.json()) as { identities?: AuthIdentityDto[] };
  return d.identities ?? [];
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
