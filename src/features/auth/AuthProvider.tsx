import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearAdminCabinetSessionCache } from '../../pages/admin/adminCabinetSessionCache';
import { clearOverviewBundleCache } from '../../pages/admin/overview/adminOverviewSessionCache';
import { syncMasterFlagFromProfile } from '../profile/lib/demoMasterStorage';
import {
  preloadFavoriteMasterIds,
  syncLocalFavoritesToServer,
} from '../profile/lib/favoriteMastersResolve';
import { completeTelegramBrowserHandoffIfNeeded } from './lib/telegramBrowserHandoff';
import {
  completeGoogleLoginPending,
  loginWithEmail,
  loginWithGoogle,
  loginWithTelegram,
  registerWithEmail,
} from './api/authApi';
import { ConsentGateScreen } from '../legal/components/ConsentGateScreen';
import {
  acceptConsentsAuthenticated,
  readApiErrorWithConsent,
  type ConsentAcceptancePayload,
} from '../legal/api/legalApi';
import type { ConsentBlockState } from '../legal/consentBlock.types';
import { apiFetch, getApiBaseUrl, getStoredAuthToken, setStoredAuthToken } from '../../shared/api/backendClient';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { readTelegramUserIdFromInitDataRaw } from '../../shared/lib/telegramWebApp';
import type { AuthSessionResponse, BackendProfile } from './types';
import { normalizeBackendProfile, sessionRefreshToken } from './types';

const TELEGRAM_INIT_DATA_WAIT_MS = 12_000;

type AuthContextValue = {
  profile: BackendProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  backendConfigured: boolean;
  consentBlocked: boolean;
  refreshProfile: () => Promise<void>;
  applySession: (session: AuthSessionResponse) => void;
  logout: () => void;
  openConsentBlock: (state: ConsentBlockState) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isReady, initDataRaw, isTelegramWebApp } = useTelegram();
  const [profile, setProfile] = useState<BackendProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [sessionLoading, setSessionLoading] = useState(false);
  const [consentBlock, setConsentBlock] = useState<ConsentBlockState | null>(null);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  const isLoading = !isReady || sessionLoading;
  const backendConfigured = Boolean(getApiBaseUrl());
  const consentBlocked =
    Boolean(consentBlock) || Boolean(profile && profile.consent_status?.satisfied === false);

  const logout = useCallback(() => {
    clearAdminCabinetSessionCache();
    clearOverviewBundleCache();
    setStoredAuthToken(null);
    setToken(null);
    setProfile(null);
    setConsentBlock(null);
  }, []);

  const applySession = useCallback((session: AuthSessionResponse) => {
    clearAdminCabinetSessionCache();
    clearOverviewBundleCache();
    setStoredAuthToken(session.token);
    setToken(session.token);
    setProfile(session.profile);
    setConsentBlock(null);
    void syncLocalFavoritesToServer().then(() => preloadFavoriteMasterIds());
  }, []);

  const applyMePayload = useCallback((payload: BackendProfile) => {
    const refresh = sessionRefreshToken(payload);
    const nextProfile = normalizeBackendProfile(payload);
    if (refresh) {
      clearAdminCabinetSessionCache();
      clearOverviewBundleCache();
      setStoredAuthToken(refresh);
      setToken(refresh);
    }
    setProfile(nextProfile);
    if (nextProfile.consent_status?.satisfied === false && getStoredAuthToken()) {
      setConsentBlock((prev) =>
        prev ??
        ({
          action: { type: 'accept_only' },
          isNewUser: false,
        } satisfies ConsentBlockState),
      );
    }
  }, []);

  const openConsentBlock = useCallback((state: ConsentBlockState) => {
    setConsentError(null);
    setConsentBlock(state);
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
        if (res.status === 401 || res.status === 403) {
          logout();
        }
        return;
      }
      const next = (await res.json()) as BackendProfile;
      applyMePayload(next);
    } catch {
      /* keep previous profile if any */
    }
  }, [logout, applyMePayload]);

  const submitConsents = useCallback(
    async (consents: ConsentAcceptancePayload[]) => {
      if (!consentBlock) return;
      setConsentBusy(true);
      setConsentError(null);
      try {
        const { action, onSuccess } = consentBlock;
        if (action.type === 'accept_only') {
          await acceptConsentsAuthenticated(consents);
          await refreshProfile();
          setConsentBlock(null);
          onSuccess?.();
          return;
        }
        if (action.type === 'telegram') {
          const session = await loginWithTelegram(action.initDataRaw, { consents });
          applySession(session);
          await completeTelegramBrowserHandoffIfNeeded();
          onSuccess?.();
          return;
        }
        if (action.type === 'google') {
          const session = await loginWithGoogle(action.idToken, { consents });
          applySession(session);
          onSuccess?.();
          return;
        }
        if (action.type === 'google_pending') {
          const session = await completeGoogleLoginPending(action.pendingToken, consents);
          applySession(session);
          onSuccess?.();
          return;
        }
        if (action.type === 'email_login') {
          const session = await loginWithEmail(action.email, action.password, { consents });
          applySession(session);
          onSuccess?.();
          return;
        }
        if (action.type === 'email_register') {
          const session = await registerWithEmail(action.email, action.password, { consents });
          applySession(session);
          onSuccess?.();
        }
      } catch (e) {
        setConsentError(e instanceof Error ? e.message : 'Не удалось сохранить согласия');
      } finally {
        setConsentBusy(false);
      }
    },
    [consentBlock, applySession, refreshProfile],
  );

  useEffect(() => {
    if (!isReady) {
      return undefined;
    }

    let cancelled = false;

    async function bootstrap() {
      setSessionLoading(true);
      let awaitingTelegramInitData = false;
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
        const initDataTelegramUserId =
          initDataRaw && isTelegramWebApp ? readTelegramUserIdFromInitDataRaw(initDataRaw) : null;

        // В Mini App не доверяем JWT, пока не прочитан initData — иначе гонка с deep link из уведомления.
        if (isTelegramWebApp && !initDataRaw) {
          awaitingTelegramInitData = true;
          return;
        }

        if (existing) {
          const res = await apiFetch('/api/me');
          if (res.ok) {
            const me = (await res.json()) as BackendProfile;
            const profileTgId = me.telegram_user_id;
            const jwtMatchesTelegram =
              !isTelegramWebApp ||
              (initDataTelegramUserId != null &&
                profileTgId != null &&
                profileTgId === initDataTelegramUserId);

            if (jwtMatchesTelegram) {
              if (!cancelled) {
                applyMePayload(me);
              }
              void syncLocalFavoritesToServer().then(() => preloadFavoriteMasterIds());
              await completeTelegramBrowserHandoffIfNeeded();
              return;
            }
            setStoredAuthToken(null);
          } else {
            setStoredAuthToken(null);
          }
        }

        if (initDataRaw && isTelegramWebApp) {
          const res = await apiFetch('/api/auth/telegram', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ initDataRaw }),
          });
          if (!res.ok) {
            const parsed = await readApiErrorWithConsent(res);
            if (parsed.consentRequired) {
              if (!cancelled) {
                setStoredAuthToken(null);
                setToken(null);
                setProfile(null);
                openConsentBlock({
                  action: { type: 'telegram', initDataRaw },
                  isNewUser: parsed.consentRequired.isNewUser === true,
                });
              }
              return;
            }
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
            setConsentBlock(null);
          }
          void syncLocalFavoritesToServer().then(() => preloadFavoriteMasterIds());
          await completeTelegramBrowserHandoffIfNeeded();
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
        if (!cancelled && !awaitingTelegramInitData) {
          setSessionLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isReady, initDataRaw, isTelegramWebApp, applyMePayload, openConsentBlock]);

  // Не зависать на вечной загрузке, если initData в Mini App не пришёл.
  useEffect(() => {
    if (!isReady || !isTelegramWebApp || initDataRaw) return undefined;
    const t = window.setTimeout(() => {
      setSessionLoading(false);
    }, TELEGRAM_INIT_DATA_WAIT_MS);
    return () => window.clearTimeout(t);
  }, [isReady, isTelegramWebApp, initDataRaw]);

  // Handoff: если сессия уже есть, но URL ещё с tg_browser_pending.
  useEffect(() => {
    if (!isReady || !token) return;
    void completeTelegramBrowserHandoffIfNeeded();
  }, [isReady, token]);

  useEffect(() => {
    syncMasterFlagFromProfile(profile ?? undefined);
  }, [profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      token,
      isLoading,
      isAuthenticated: Boolean(profile) && !consentBlocked,
      backendConfigured,
      consentBlocked,
      refreshProfile,
      applySession,
      logout,
      openConsentBlock,
    }),
    [
      profile,
      token,
      isLoading,
      consentBlocked,
      backendConfigured,
      refreshProfile,
      applySession,
      logout,
      openConsentBlock,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {consentBlock ? (
        <ConsentGateScreen busy={consentBusy} error={consentError} onSubmit={submitConsents} />
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
