const AUTH_TOKEN_KEY = 'slotty_auth_token';

export function getApiBaseUrl(): string | undefined {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, '');
}

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export type ApiFetchOptions = RequestInit & {
  /** Do not send Authorization header (e.g. Telegram login). */
  skipAuth?: boolean;
};

/**
 * JSON API to SLOTTY backend. Base URL: `VITE_API_URL` (no trailing slash).
 * Paths must start with `/api/...`.
 */
export async function apiFetch(path: string, init: ApiFetchOptions = {}): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    return Promise.reject(new Error('NO_API_URL'));
  }
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const { skipAuth, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (!skipAuth) {
    const token = getStoredAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  if (rest.body && !(rest.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...rest, headers });
}
