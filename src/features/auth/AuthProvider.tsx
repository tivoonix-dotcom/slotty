import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { syncMasterFlagFromProfile } from '../profile/lib/demoMasterStorage';
import {
  preloadFavoriteMasterIds,
  syncLocalFavoritesToServer,
} from '../profile/lib/favoriteMastersResolve';
import { apiFetch, getApiBaseUrl, getStoredAuthToken, setStoredAuthToken } from '../../shared/api/backendClient';
import { useTelegram } from '../../shared/hooks/useTelegram';
import type { AuthSessionResponse, BackendProfile } from './types';

type AuthContextValue = {
  profile: BackendProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  backendConfigured: boolean;
  refreshProfile: () => Promise<void>;
  applySession: (session: AuthSessionResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isReady, initDataRaw, isTelegramWebApp } = useTelegram();
  const [profile, setProfile] = useState<BackendProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [sessionLoading, setSessionLoading] = useState(false);

  const isLoading = !isReady || sessionLoading;
  const backendConfigured = Boolean(getApiBaseUrl());

  const logout = useCallback(() => {
    setStoredAuthToken(null);
    setToken(null);
    setProfile(null);
  }, []);

  const applySession = useCallback((session: AuthSessionResponse) => {
    setStoredAuthToken(session.token);
    setToken(session.token);
    setProfile(session.profile);
    void syncLocalFavoritesToServer().then(() => preloadFavoriteMasterIds());
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    const t = getStoredAuthToken();
    if (!t) {
      setProfile(null);
      setToken(null);
      return;
    }
    try {
      const res = await apiFetch('/api/me');
      if (!res.ok) {
        if (res.status === 401) {
          logout();
        }
        return;
      }
      const next = (await res.json()) as BackendProfile;
      setProfile(next);
      setToken(getStoredAuthToken());
    } catch {
      /* keep previous profile if any */
    }
  }, [logout]);

  useEffect(() => {
    if (!isReady) {
      return undefined;
    }

    let cancelled = false;

    async function bootstrap() {
      setSessionLoading(true);
      try {
        const base = getApiBaseUrl();
        if (!base) {
          if (!cancelled) {
            setProfile(null);
            setToken(getStoredAuthToken());
          }
          return;
        }

        const existing = getStoredAuthToken();
        if (existing) {
          const res = await apiFetch('/api/me');
          if (res.ok) {
            const me = (await res.json()) as BackendProfile;
            if (!cancelled) {
              setToken(existing);
              setProfile(me);
            }
            await syncLocalFavoritesToServer();
            preloadFavoriteMasterIds();
            return;
          }
          setStoredAuthToken(null);
        }

        // Автовход только в Telegram Web App и только без сохранённого JWT.
        if (initDataRaw && isTelegramWebApp) {
          const res = await apiFetch('/api/auth/telegram', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ initDataRaw }),
          });
          if (!res.ok) {
            if (!cancelled) {
              setStoredAuthToken(null);
              setToken(null);
              setProfile(null);
            }
            return;
          }
          const data = (await res.json()) as AuthSessionResponse;
          setStoredAuthToken(data.token);
          if (!cancelled) {
            setToken(data.token);
            setProfile(data.profile);
          }
          await syncLocalFavoritesToServer();
          preloadFavoriteMasterIds();
          return;
        }

        if (!cancelled) {
          setProfile(null);
          setToken(getStoredAuthToken());
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isReady, initDataRaw, isTelegramWebApp]);

  useEffect(() => {
    syncMasterFlagFromProfile(profile?.role);
  }, [profile?.role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      token,
      isLoading,
      isAuthenticated: Boolean(profile),
      backendConfigured,
      refreshProfile,
      applySession,
      logout,
    }),
    [profile, token, isLoading, backendConfigured, refreshProfile, applySession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
