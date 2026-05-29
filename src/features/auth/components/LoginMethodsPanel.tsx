import { EMPTY_NOT_LINKED } from '../../../shared/lib/emptyDisplayText';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { HiArrowPath, HiCheck } from 'react-icons/hi2';
import { Link, useSearchParams } from 'react-router-dom';
import { FORGOT_PASSWORD_PATH } from '../../../app/paths';
import {
  createGoogleLinkHandoff,
  fetchAuthIdentities,
  linkEmail,
  linkGoogle,
  linkTelegram,
  loginWithEmail,
  loginWithGoogle,
  loginWithTelegram,
  startGoogleOAuth,
  registerWithEmail,
  sendEmailVerification,
} from '../api/authApi';
import { messageForAuthErrorCode } from '../lib/authApiErrors';
import { usePublicAppConfig } from '../hooks/usePublicAppConfig';
import { useTelegramLoginUrl } from '../hooks/useTelegramLoginUrl';
import { readPublicAppOrigin } from '../../../shared/lib/masterBookingLink';
import { GOOGLE_LINK_PATH } from '../../../app/paths';
import { countAccountVerifications } from '../lib/accountVerification';
import type { AuthIdentityDto, AuthProvider, BackendProfile } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useTelegram } from '../../../shared/hooks/useTelegram';
import { openTelegramOrBrowserUrl } from '../../../shared/lib/telegramWebApp';
import { GoogleIcon } from '../../../shared/ui/GoogleIcon';
import { isConsentRequiredError } from '../../legal/consentBlock.types';
import {
  SignupConsentFields,
  allSignupConsentsChecked,
  buildSignupConsentPayload,
} from '../../legal/components/SignupConsentFields';
import { useAuth } from '../AuthProvider';
import {
  sheetFieldClass,
  sheetHintClass,
  sheetPrimaryBtnClass,
} from '../../../pages/admin/profile/adminProfileCabinetTheme';
import {
  AUTH_DIVIDER_LABEL,
  AUTH_DIVIDER_LINE,
  AUTH_DIVIDER_ROW,
  AUTH_FIELD_CLASS,
  AUTH_PRIMARY_BTN_CLASS,
  AUTH_SOCIAL_BTN_CLASS,
  AUTH_TAB_ROW,
  authTabClass,
} from './authFormTheme';

type Props = {
  /** settings = привязка способов входа; login = вход на сайте */
  mode?: 'settings' | 'login';
  /** page = /login; sheet = bottom sheet кабинета; okx = список строк в настройках клиента */
  appearance?: 'default' | 'page' | 'sheet' | 'okx';
  /** master-login = /master/login; master-register = /master/register */
  authIntent?: 'master-login' | 'master-register';
  /** Вызывается после успешного входа или привязки; для входа передаётся актуальный profile. */
  onLinked?: (profile?: BackendProfile) => void;
};

const socialOutlineBtn = AUTH_SOCIAL_BTN_CLASS;

const settingsActionBtn =
  'shrink-0 rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_6px_16px_rgba(255,95,122,0.28)] disabled:opacity-50';

const settingsPrimaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[16px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-4 text-[15px] font-bold text-white shadow-[0_8px_22px_rgba(255,95,122,0.32)] transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

const settingsOutlineBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[16px] border border-[#FDE8ED] bg-white px-4 text-[14px] font-semibold text-[#ff5f7a] transition hover:bg-[#FFF9FB] active:scale-[0.98] disabled:opacity-50';

function TelegramMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M5.43 11.47c3.66-1.6 6.1-2.65 7.32-3.15 3.48-1.45 4.2-1.7 4.67-1.7.1 0 .33.02.48.12.12.1.16.24.14.34-.02.1-.16.48-.32.94-.46 1.5-1.98 5.92-2.75 7.86-.34.74-.99 1.1-1.52 1.12-.52.02-1.35-.3-2.01-.55-.9-.33-1.62-.5-1.55-.95.03-.2.38-.4 1.05-.72Z"
      />
    </svg>
  );
}

function hasProvider(identities: AuthIdentityDto[], provider: AuthProvider): boolean {
  return identities.some((i) => i.provider === provider);
}

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const head = local.length <= 2 ? local[0] ?? '*' : `${local.slice(0, 2)}…`;
  return `${head}@${domain}`;
}

function ErrorBanner({ message, pageStyle }: { message: string; pageStyle: boolean }) {
  return (
    <p
      className={
        pageStyle
          ? 'rounded-2xl bg-[#FFF0F0] px-4 py-3 text-[13px] font-semibold text-[#9B2C2C]'
          : 'rounded-[18px] bg-[#FFF0F0] px-4 py-3 text-[13px] font-semibold text-[#9B2C2C]'
      }
    >
      {message}
    </p>
  );
}

type GoogleLoginPillProps = {
  busy: boolean;
  googleClientId: string | undefined;
  onCredential: (token: string) => void;
  onError: (msg: string) => void;
  label: string;
  pageStyle: boolean;
  isTelegramWebApp: boolean;
  oauthPurpose: 'link' | 'login';
  oauthReturnPath?: string;
  variant?: 'outline' | 'cabinet';
};

function GoogleLoginPill({
  busy,
  googleClientId,
  onCredential,
  onError,
  label,
  pageStyle,
  isTelegramWebApp,
  oauthPurpose,
  oauthReturnPath,
  variant = 'outline',
}: GoogleLoginPillProps) {
  if (!googleClientId) {
    return (
      <p className="text-[13px] font-medium text-neutral-500">
        {messageForAuthErrorCode('GOOGLE_NOT_CONFIGURED')}
      </p>
    );
  }

  const pillClass =
    variant === 'cabinet'
      ? `${sheetPrimaryBtnClass} w-full gap-2`
      : pageStyle
        ? AUTH_SOCIAL_BTN_CLASS
        : socialOutlineBtn;
  const overlayRound = pageStyle ? 'rounded-full' : variant === 'cabinet' ? 'rounded-[17px]' : 'rounded-full';

  const publicConfig = usePublicAppConfig();

  const openGoogleLinkInBrowser = async () => {
    const { handoffToken } = await createGoogleLinkHandoff();
    const url = `${readPublicAppOrigin()}${GOOGLE_LINK_PATH}?handoff=${encodeURIComponent(handoffToken)}`;
    openTelegramOrBrowserUrl(url);
  };

  const openGoogleOAuth = async () => {
    if (oauthPurpose === 'login' && isTelegramWebApp && publicConfig.googleOAuthConfigured === false) {
      onError(messageForAuthErrorCode('GOOGLE_OAUTH_NOT_CONFIGURED'));
      return;
    }

    if (oauthPurpose === 'link' && isTelegramWebApp && publicConfig.googleOAuthConfigured === false) {
      try {
        await openGoogleLinkInBrowser();
      } catch (e) {
        onError(e instanceof Error ? e.message : messageForAuthErrorCode('AUTH_REQUIRED'));
      }
      return;
    }

    try {
      const { authorizationUrl } = await startGoogleOAuth({
        purpose: oauthPurpose,
        returnPath: oauthReturnPath,
      });
      openTelegramOrBrowserUrl(authorizationUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : messageForAuthErrorCode('GOOGLE_OAUTH_EXCHANGE_FAILED');
      if (oauthPurpose === 'link' && isTelegramWebApp) {
        try {
          await openGoogleLinkInBrowser();
          return;
        } catch (fallbackErr) {
          onError(
            fallbackErr instanceof Error
              ? fallbackErr.message
              : messageForAuthErrorCode('GOOGLE_OAUTH_NOT_CONFIGURED'),
          );
          return;
        }
      }
      onError(msg);
    }
  };

  if (isTelegramWebApp || oauthPurpose === 'link') {
    return (
      <button type="button" disabled={busy} onClick={() => void openGoogleOAuth()} className={pillClass}>
        <GoogleIcon size={20} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className={`relative w-full ${pageStyle ? 'min-h-[52px]' : 'min-h-12'}`}>
      <div className={`${pillClass} pointer-events-none`}>
        <GoogleIcon size={20} />
        <span>{label}</span>
      </div>
      {!busy ? (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-[0.011] ${overlayRound}`}
        >
          <GoogleSignInButton
            buttonWidth="full"
            className="h-full w-full"
            onCredential={onCredential}
            onError={onError}
            text="signin_with"
          />
        </div>
      ) : null}
    </div>
  );
}

export function LoginMethodsPanel({
  mode = 'settings',
  appearance = 'default',
  authIntent,
  onLinked,
}: Props) {
  const [searchParams] = useSearchParams();
  const loginReturnPath = searchParams.get('from') ?? undefined;
  const { isAuthenticated, applySession, refreshProfile, openConsentBlock } = useAuth();
  const { initDataRaw, isTelegramWebApp } = useTelegram();
  const isMasterRegister = authIntent === 'master-register';
  const [identities, setIdentities] = useState<AuthIdentityDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailMode, setEmailMode] = useState<'login' | 'register' | 'link'>(
    isMasterRegister ? 'register' : 'login',
  );
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [consentChecked, setConsentChecked] = useState<Record<string, boolean>>({});
  const [consentRequiredHint, setConsentRequiredHint] = useState(false);

  const allConsentsChecked = useMemo(() => allSignupConsentsChecked(consentChecked), [consentChecked]);
  const signupConsents = useMemo(
    () => (allConsentsChecked ? buildSignupConsentPayload() : undefined),
    [allConsentsChecked],
  );

  const toggleConsent = useCallback((documentKey: string) => {
    setConsentChecked((prev) => ({ ...prev, [documentKey]: !prev[documentKey] }));
    setConsentRequiredHint(false);
  }, []);

  const openConsentFlow = useCallback(
    (state: Parameters<typeof openConsentBlock>[0]) => {
      setError(null);
      setConsentRequiredHint(true);
      openConsentBlock(state);
    },
    [openConsentBlock],
  );

  const isSettings = mode === 'settings' && isAuthenticated;
  const pageStyle = appearance === 'page';
  const sheetStyle = appearance === 'sheet';
  const okxStyle = appearance === 'okx';
  /** Кабинет: карточки с иконками и прогрессом (страница «Настройки» или bottom sheet). */
  const settingsCardsLayout = isSettings && (sheetStyle || pageStyle);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const telegramLoginUrl = useTelegramLoginUrl(loginReturnPath);
  const inTelegramApp = Boolean(initDataRaw && isTelegramWebApp);

  const reload = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAuthIdentities();
      setIdentities(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить способы входа');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isSettings) void reload();
  }, [isSettings, reload]);

  const emailIdentity = identities.find((i) => i.provider === 'email');

  const linked = useMemo(
    () => ({
      telegram: hasProvider(identities, 'telegram'),
      google: hasProvider(identities, 'google'),
      email: hasProvider(identities, 'email'),
      emailVerified: emailIdentity?.emailVerified ?? false,
    }),
    [identities, emailIdentity?.emailVerified],
  );

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setBusy(true);
      setError(null);
      try {
        if (isSettings) {
          const list = await linkGoogle(idToken);
          setIdentities(list);
          await refreshProfile();
          onLinked?.();
        } else {
          const session = await loginWithGoogle(idToken, { consents: signupConsents });
          applySession(session);
          onLinked?.(session.profile);
        }
      } catch (e) {
        if (isConsentRequiredError(e)) {
          openConsentFlow({
            action: { type: 'google', idToken },
            isNewUser: e.consentRequired?.isNewUser === true,
            onSuccess: () => {
              if (isSettings) {
                void reload();
              }
            },
          });
          return;
        }
        setError(e instanceof Error ? e.message : messageForAuthErrorCode('GOOGLE_TOKEN_INVALID'));
      } finally {
        setBusy(false);
      }
    },
    [applySession, isSettings, onLinked, openConsentFlow, refreshProfile, reload, signupConsents],
  );

  const handleLoginTelegram = useCallback(async () => {
    if (initDataRaw && isTelegramWebApp) {
      setBusy(true);
      setError(null);
      try {
        const session = await loginWithTelegram(initDataRaw, { consents: signupConsents });
        applySession(session);
        onLinked?.(session.profile);
      } catch (e) {
        if (isConsentRequiredError(e)) {
          openConsentFlow({
            action: { type: 'telegram', initDataRaw },
            isNewUser: e.consentRequired?.isNewUser === true,
          });
          return;
        }
        setError(e instanceof Error ? e.message : 'Ошибка Telegram');
      } finally {
        setBusy(false);
      }
      return;
    }

    setError(
      telegramLoginUrl
        ? null
        : 'Telegram-бот не настроен. Задайте TELEGRAM_BOT_TOKEN на сервере или VITE_TELEGRAM_BOT_USERNAME на фронте.',
    );
  }, [applySession, initDataRaw, isTelegramWebApp, onLinked, openConsentFlow, signupConsents, telegramLoginUrl]);

  const renderTelegramLoginControl = (className: string, label: string) => {
    const content = (
      <>
        <TelegramMark />
        <span>{label}</span>
      </>
    );
    if (inTelegramApp) {
      return (
        <button type="button" disabled={busy} onClick={() => void handleLoginTelegram()} className={className}>
          {content}
        </button>
      );
    }
    if (telegramLoginUrl) {
      return (
        <a href={telegramLoginUrl} className={`${className} no-underline`}>
          {content}
        </a>
      );
    }
    return (
      <button type="button" disabled={busy} onClick={() => void handleLoginTelegram()} className={className}>
        {content}
      </button>
    );
  };

  const handleLinkTelegram = useCallback(async () => {
    if (!initDataRaw || !isTelegramWebApp) {
      setError('Откройте SLOTTY в Telegram, чтобы подключить Telegram к аккаунту.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const list = await linkTelegram(initDataRaw);
      setIdentities(list);
      await refreshProfile();
      onLinked?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка Telegram');
    } finally {
      setBusy(false);
    }
  }, [initDataRaw, isTelegramWebApp, onLinked, refreshProfile]);

  const handleEmailSubmit = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (isSettings || emailMode === 'link') {
        const list = await linkEmail(email, password);
        setIdentities(list);
        setShowEmailForm(false);
        setEmail('');
        setPassword('');
        setEmailNotice('Письмо для подтверждения email отправлено.');
        await refreshProfile();
        onLinked?.();
      } else if (emailMode === 'register') {
        const session = await registerWithEmail(email, password, { consents: signupConsents });
        applySession(session);
        setEmailNotice(
          `Мы отправили письмо на ${email.trim()}. Подтвердите email по ссылке из письма (проверьте «Спам»).`,
        );
        onLinked?.(session.profile);
      } else {
        const session = await loginWithEmail(email, password, { consents: signupConsents });
        applySession(session);
        onLinked?.(session.profile);
      }
    } catch (e) {
      if (isConsentRequiredError(e)) {
        openConsentFlow({
          action:
            emailMode === 'register'
              ? { type: 'email_register', email, password }
              : { type: 'email_login', email, password },
          isNewUser: e.consentRequired?.isNewUser === true,
          onSuccess: () => {
            if (emailMode === 'register') {
              setEmailNotice(
                `Мы отправили письмо на ${email.trim()}. Подтвердите email по ссылке из письма (проверьте «Спам»).`,
              );
            }
          },
        });
        return;
      }
      setError(e instanceof Error ? e.message : 'Ошибка email');
    } finally {
      setBusy(false);
    }
  }, [applySession, email, emailMode, isSettings, onLinked, openConsentFlow, password, refreshProfile, signupConsents]);

  const handleResendVerification = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await sendEmailVerification(isAuthenticated ? undefined : email.trim() || undefined);
      setEmailNotice('Письмо с подтверждением отправлено повторно.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить письмо');
    } finally {
      setBusy(false);
    }
  }, [email, isAuthenticated]);

  const linkedEmailLabel = emailIdentity?.email ? maskEmail(emailIdentity.email) : null;

  /* ——— Пластина входа: /login, /master/login, /master/register (OKX + цвета SLOTTY) ——— */
  if (!isSettings && pageStyle) {
    const isMasterAuth = authIntent === 'master-login' || authIntent === 'master-register';
    const primaryLabel =
      emailMode === 'register'
        ? 'Зарегистрироваться'
        : isMasterAuth
          ? 'Войти'
          : 'Продолжить';

    const requiresConsents = emailMode === 'register' || consentRequiredHint;
    const canSubmit =
      !busy && email.trim().length > 0 && password.length >= 8 && (!requiresConsents || allConsentsChecked);

    return (
      <div className="space-y-6">
        {error ? <ErrorBanner message={error} pageStyle /> : null}
        {consentRequiredHint && !error ? (
          <p className="rounded-2xl bg-[#FFF7ED] px-4 py-3 text-[13px] leading-relaxed text-[#9A3412]">
            Отметьте все документы ниже, чтобы продолжить вход или регистрацию.
          </p>
        ) : null}
        {emailNotice ? (
          <p className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[13px] leading-relaxed text-[#166534]">
            {emailNotice}
          </p>
        ) : null}
        {busy ? <p className="text-[13px] text-[#6B7280]">Подождите…</p> : null}

        <div className="space-y-4">
          <div className={AUTH_TAB_ROW} role="tablist" aria-label="Вход или регистрация">
            <button
              type="button"
              role="tab"
              aria-selected={emailMode === 'login'}
              onClick={() => setEmailMode('login')}
              className={authTabClass(emailMode === 'login')}
            >
              Вход
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={emailMode === 'register'}
              onClick={() => setEmailMode('register')}
              className={authTabClass(emailMode === 'register')}
            >
              Регистрация
            </button>
          </div>

          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className={AUTH_FIELD_CLASS}
          />
          <input
            type="password"
            autoComplete={emailMode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль (мин. 8 символов)"
            className={AUTH_FIELD_CLASS}
          />

          {(emailMode === 'register' || consentRequiredHint) ? (
            <div className="rounded-2xl bg-[#F9FAFB] px-4 py-4">
              <p className="mb-3 text-[13px] font-semibold text-[#374151]">Документы сервиса</p>
              <SignupConsentFields
                checked={consentChecked}
                onToggle={toggleConsent}
                disabled={busy}
                compact
              />
            </div>
          ) : null}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleEmailSubmit()}
            className={AUTH_PRIMARY_BTN_CLASS}
          >
            {primaryLabel}
          </button>

          <p className="min-h-[22px] text-[14px] leading-snug text-[#6B7280]">
            {emailMode === 'login' ? (
              <Link
                to={FORGOT_PASSWORD_PATH}
                className="font-semibold text-[#111827] underline decoration-[#E29595] decoration-2 underline-offset-4 hover:text-[#E29595]"
              >
                Забыли пароль?
              </Link>
            ) : (
              <span className="invisible select-none" aria-hidden>
                Забыли пароль?
              </span>
            )}
          </p>
        </div>

        <div className={AUTH_DIVIDER_ROW}>
          <div className={AUTH_DIVIDER_LINE} />
          <span className={AUTH_DIVIDER_LABEL}>или продолжить с</span>
          <div className={AUTH_DIVIDER_LINE} />
        </div>

        <div className="space-y-3">
          <GoogleLoginPill
            busy={busy || (emailMode === 'register' && !allConsentsChecked)}
            googleClientId={googleClientId}
            label="Google"
            pageStyle
            isTelegramWebApp={inTelegramApp}
            oauthPurpose="login"
            oauthReturnPath={loginReturnPath}
            onCredential={(t) => void handleGoogleCredential(t)}
            onError={(m) => setError(m)}
          />

          {emailMode === 'register' && !allConsentsChecked ? (
            <p className="text-center text-[12px] leading-relaxed text-[#9CA3AF]">
              Сначала отметьте документы выше, затем войдите через Google или Telegram.
            </p>
          ) : null}

          {renderTelegramLoginControl(
            `${AUTH_SOCIAL_BTN_CLASS}${emailMode === 'register' && !allConsentsChecked ? ' pointer-events-none opacity-50' : ''}`,
            'Telegram',
          )}


        </div>
      </div>
    );
  }

  /* ——— Способы входа: OKX-стиль (клиентские настройки) ——— */
  if (isSettings && okxStyle) {
    const connectedCount = countAccountVerifications(identities);
    const okxBtn =
      'shrink-0 rounded-[10px] bg-[#F5F5F5] px-4 py-2 text-[14px] font-semibold text-[#111827] transition hover:bg-[#EBEBEB] disabled:opacity-50';

    return (
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[15px] font-bold text-[#F47C8C]">
            {loading ? '…' : `${connectedCount}/3`}
          </span>
          <div>
            <h2 className="text-[18px] font-bold text-[#111827]">Защита аккаунта</h2>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              {connectedCount >= 3
                ? 'Все способы входа подключены'
                : 'Подключите ещё способы — так не потеряете доступ'}
            </p>
          </div>
        </div>

        {error ? <ErrorBanner message={error} pageStyle={false} /> : null}
        {emailNotice ? (
          <p className="rounded-[12px] bg-[#F0FDF4] px-4 py-3 text-[13px] text-[#166534]">{emailNotice}</p>
        ) : null}

        <section>
          <h3 className="mb-3 text-[16px] font-bold text-[#111827]">Способы аутентификации</h3>
          <div className="overflow-hidden rounded-[16px] bg-white divide-y divide-[#EBEBEB]">
            <OkxAuthRow
              icon={<TelegramMark />}
              title="Telegram"
              subtitle={linked.telegram ? 'Подключён — вход через Mini App' : 'Откройте SLOTTY в Telegram'}
              action={
                linked.telegram ? (
                  <span className="text-[13px] font-semibold text-[#16A34A]">✓</span>
                ) : inTelegramApp ? (
                  <button type="button" disabled={busy} onClick={() => void handleLinkTelegram()} className={okxBtn}>
                    Настроить
                  </button>
                ) : telegramLoginUrl ? (
                  <a href={telegramLoginUrl} className={`${okxBtn} no-underline`}>
                    Открыть
                  </a>
                ) : null
              }
            />

            <OkxAuthRow
              icon={<GoogleIcon size={20} />}
              title="Google"
              subtitle={linked.google ? 'Почта Google подключена' : 'Вход с телефона и компьютера'}
              action={
                linked.google ? (
                  <span className="text-[13px] font-semibold text-[#16A34A]">✓</span>
                ) : googleClientId ? (
                  <GoogleLoginPill
                    busy={busy}
                    googleClientId={googleClientId}
                    label="Настроить"
                    pageStyle={false}
                    variant="cabinet"
                    isTelegramWebApp={inTelegramApp}
                    oauthPurpose="link"
                    onCredential={(t) => void handleGoogleCredential(t)}
                    onError={(m) => setError(m)}
                  />
                ) : (
                  <span className="text-[12px] text-[#9CA3AF]">{EMPTY_NOT_LINKED}</span>
                )
              }
            />

            <OkxAuthRow
              icon={<EmailMethodIcon />}
              title="Email"
              subtitle={
                linked.email
                  ? linked.emailVerified
                    ? (linkedEmailLabel ?? 'Почта подтверждена')
                    : 'Подтвердите почту по ссылке из письма'
                  : 'Резервный вход, если нет Telegram'
              }
              action={
                linked.email && linked.emailVerified ? (
                  <span className="text-[13px] font-semibold text-[#16A34A]">✓</span>
                ) : linked.email && !linked.emailVerified ? (
                  <button type="button" disabled={busy} onClick={() => void handleResendVerification()} className={okxBtn}>
                    Подтвердить
                  </button>
                ) : !showEmailForm ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setShowEmailForm(true);
                      setEmailMode('link');
                    }}
                    className={okxBtn}
                  >
                    Настроить
                  </button>
                ) : null
              }
            />
          </div>
        </section>

        {!linked.email && showEmailForm ? (
          <div className="space-y-3 rounded-[16px] bg-white p-5">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-[10px] bg-[#F5F5F5] px-4 py-3 text-[15px] outline-none"
            />
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мин. 8 символов)"
              className="w-full rounded-[10px] bg-[#F5F5F5] px-4 py-3 text-[15px] outline-none"
            />
            <button
              type="button"
              disabled={busy || !email.trim() || password.length < 8}
              onClick={() => void handleEmailSubmit()}
              className="w-full rounded-[10px] bg-[#111827] py-3 text-[14px] font-semibold text-white disabled:opacity-50"
            >
              Сохранить
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setShowEmailForm(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full text-[13px] font-semibold text-[#6B7280]"
            >
              Отмена
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  /* ——— Способы входа: кабинет (настройки / sheet) ——— */
  if (settingsCardsLayout) {
    const connectedCount = countAccountVerifications(identities);

    return (
      <div className="space-y-3">
        <LoginMethodsProgressCard
          connectedCount={connectedCount}
          loading={loading}
          busy={busy}
          onRefresh={() => void reload()}
        />

        {error ? <ErrorBanner message={error} pageStyle={false} /> : null}
        {emailNotice ? (
          <p className="rounded-[18px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[13px] leading-relaxed text-[#166534]">
            {emailNotice}
          </p>
        ) : null}

        <LoginMethodSheetCard
          icon={<TelegramMark />}
          title="Telegram"
          subtitle={linked.telegram ? 'Вход в Mini App' : 'Откройте SLOTTY в Telegram'}
          connected={linked.telegram}
        >
          {!linked.telegram ? (
            <div className="space-y-2">
              {inTelegramApp ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleLinkTelegram()}
                  className={settingsPrimaryBtn}
                >
                  Подключить Telegram
                </button>
              ) : (
                <>
                  <p className={sheetHintClass}>
                    В браузере сначала откройте бота — затем вернитесь сюда и подключите аккаунт.
                  </p>
                  {telegramLoginUrl ? (
                    <a href={telegramLoginUrl} className={`${settingsOutlineBtn} no-underline`}>
                      Открыть бота в Telegram
                    </a>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </LoginMethodSheetCard>

        <LoginMethodSheetCard
          icon={<GoogleIcon size={20} />}
          title="Google"
          subtitle={linked.google ? 'Почта Google' : 'Вход с телефона и компьютера'}
          connected={linked.google}
        >
          {!linked.google ? (
            <div className="space-y-2">
              {googleClientId ? (
                <GoogleLoginPill
                  busy={busy}
                  googleClientId={googleClientId}
                  label="Подключить Google"
                  pageStyle={false}
                  variant="cabinet"
                  isTelegramWebApp={inTelegramApp}
                  oauthPurpose="link"
                  onCredential={(t) => void handleGoogleCredential(t)}
                  onError={(m) => setError(m)}
                />
              ) : (
                <p className={sheetHintClass}>{messageForAuthErrorCode('GOOGLE_NOT_CONFIGURED')}</p>
              )}
              {inTelegramApp ? (
                <p className={sheetHintClass}>Откроется браузер для входа Google.</p>
              ) : null}
            </div>
          ) : null}
        </LoginMethodSheetCard>

        <LoginMethodSheetCard
          icon={<EmailMethodIcon />}
          title="Email"
          subtitle={
            linked.email
              ? linked.emailVerified
                ? (linkedEmailLabel ?? 'Почта подтверждена')
                : 'Подтвердите почту по ссылке из письма'
              : 'Резервный вход, если нет Telegram'
          }
          connected={Boolean(linked.email && linked.emailVerified)}
          pending={Boolean(linked.email && !linked.emailVerified)}
        >
          {linked.email && !linked.emailVerified ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleResendVerification()}
              className={settingsOutlineBtn}
            >
              Отправить письмо подтверждения снова
            </button>
          ) : null}

          {!linked.email && !showEmailForm ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setShowEmailForm(true);
                setEmailMode('link');
              }}
              className={settingsPrimaryBtn}
            >
              Добавить email
            </button>
          ) : null}

          {!linked.email && showEmailForm ? (
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-[#6B7280]">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={sheetFieldClass}
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6B7280]">Пароль</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  className={sheetFieldClass}
                />
              </div>
              <button
                type="button"
                disabled={busy || !email.trim() || password.length < 8}
                onClick={() => void handleEmailSubmit()}
                className={settingsPrimaryBtn}
              >
                Сохранить email
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowEmailForm(false);
                  setEmail('');
                  setPassword('');
                }}
                className="w-full text-center text-[13px] font-semibold text-[#6B7280]"
              >
                Отмена
              </button>
            </div>
          ) : null}
        </LoginMethodSheetCard>
      </div>
    );
  }

  /* ——— Способы входа (настройки, legacy) ——— */
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-relaxed text-neutral-600">
        Подключите несколько способов входа, чтобы не потерять доступ к кабинету.
      </p>

      {error ? <ErrorBanner message={error} pageStyle={false} /> : null}
      {emailNotice ? (
        <p className="rounded-[18px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[13px] text-[#166534]">
          {emailNotice}
        </p>
      ) : null}
      {loading ? <p className="text-[13px] text-neutral-500">Загрузка…</p> : null}

      <div className="rounded-[22px] bg-[#F1EFEF] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-neutral-950">Telegram</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              {linked.telegram ? 'Подключён' : 'Подключить'}
            </p>
          </div>
          {linked.telegram ? (
            <span className="text-[12px] font-semibold text-[#15803D]">✓</span>
          ) : null}
        </div>
        {!linked.telegram ? (
          <div className="mt-3 space-y-2">
            {!initDataRaw || !isTelegramWebApp ? (
              <p className="text-[12px] leading-relaxed text-neutral-500">
                Откройте SLOTTY в Telegram, чтобы подключить Telegram к аккаунту.
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {initDataRaw && isTelegramWebApp ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleLinkTelegram()}
                  className={settingsActionBtn}
                >
                  Подключить Telegram
                </button>
              ) : null}
              {telegramLoginUrl ? (
                <a
                  href={telegramLoginUrl}
                  className={`${settingsActionBtn} inline-flex items-center justify-center no-underline`}
                >
                  Открыть Telegram
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[22px] bg-[#F1EFEF] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-neutral-950">Google</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">{linked.google ? 'Подключён' : 'Подключить'}</p>
          </div>
          {linked.google ? <span className="shrink-0 text-[12px] font-semibold text-[#15803D]">✓</span> : null}
        </div>
        {!linked.google ? (
          <div className="mt-3">
            {googleClientId ? (
              <GoogleLoginPill
                busy={busy}
                googleClientId={googleClientId}
                label="Подключить Google"
                pageStyle={false}
                isTelegramWebApp={inTelegramApp}
                oauthPurpose="link"
                onCredential={(t) => void handleGoogleCredential(t)}
                onError={(m) => setError(m)}
              />
            ) : (
              <p className="text-[12px] text-neutral-500">{messageForAuthErrorCode('GOOGLE_NOT_CONFIGURED')}</p>
            )}
            {inTelegramApp ? (
              <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
                Откроется браузер для входа Google — это нормально в Telegram.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-[22px] bg-[#F1EFEF] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-neutral-950">Email</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              {linked.email
                ? linked.emailVerified
                  ? (linkedEmailLabel ?? 'Подключён')
                  : 'Ожидает подтверждения'
                : 'Добавить'}
            </p>
          </div>
          {linked.email && linked.emailVerified ? (
            <span className="text-[12px] font-semibold text-[#15803D]">✓</span>
          ) : !showEmailForm ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setShowEmailForm(true);
                setEmailMode('link');
              }}
              className={settingsActionBtn}
            >
              Добавить email
            </button>
          ) : null}
        </div>

        {linked.email && !linked.emailVerified ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleResendVerification()}
            className="w-full rounded-full border border-[#F47C8C]/30 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#F47C8C]"
          >
            Отправить письмо подтверждения снова
          </button>
        ) : null}

        {!linked.email && showEmailForm ? (
          <>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-[14px] border-0 bg-white px-4 py-3 text-[15px] shadow-sm outline-none ring-1 ring-neutral-200/80"
            />
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мин. 8 символов)"
              className="w-full rounded-[14px] border-0 bg-white px-4 py-3 text-[15px] shadow-sm outline-none ring-1 ring-neutral-200/80"
            />
            <button
              type="button"
              disabled={busy || !email.trim() || password.length < 8}
              onClick={() => void handleEmailSubmit()}
              className="w-full rounded-full bg-[#E29595] px-4 py-3 text-[14px] font-semibold text-white disabled:opacity-50"
            >
              Сохранить email
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setShowEmailForm(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full text-center text-[13px] font-semibold text-neutral-500"
            >
              Отмена
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function LoginMethodsProgressCard({
  connectedCount,
  loading,
  busy,
  onRefresh,
}: {
  connectedCount: number;
  loading: boolean;
  busy: boolean;
  onRefresh: () => void;
}) {
  const total = 3;
  const pct = Math.round((connectedCount / total) * 100);
  const complete = connectedCount >= total;

  return (
    <div className="rounded-[22px] border border-[#FDE8ED] bg-gradient-to-br from-[#FFF9FB] via-white to-[#f6f7fb] px-4 py-4 shadow-[0_6px_24px_rgba(255,95,122,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#ff5f7a]">
            Безопасность входа
          </p>
          <p className="mt-1 text-[15px] font-bold text-[#111827]">
            {loading ? 'Загрузка…' : `${connectedCount} из ${total} способов`}
          </p>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">
            {complete
              ? 'Отлично — все способы подключены'
              : 'Подключите ещё — так не потеряете доступ'}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-black tabular-nums ${
            complete
              ? 'bg-[#ECFDF5] text-[#16A34A] ring-1 ring-[#BBF7D0]'
              : 'bg-[#FFF1F4] text-[#ff5f7a] ring-1 ring-[#FDE8ED]'
          }`}
        >
          {loading ? '…' : `${pct}%`}
        </span>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-[#EAECEF]/80"
        role="progressbar"
        aria-valuenow={connectedCount}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Подключено ${connectedCount} из ${total}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] transition-all duration-500"
          style={{ width: `${loading ? 0 : pct}%` }}
        />
      </div>

      <button
        type="button"
        disabled={loading || busy}
        onClick={onRefresh}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-white py-2.5 text-[13px] font-semibold text-[#374151] ring-1 ring-[#EAECEF] transition hover:border-[#FDE8ED] hover:text-[#ff5f7a] active:scale-[0.98] disabled:opacity-50 sm:w-auto sm:px-4"
      >
        <HiArrowPath className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
        {loading ? 'Обновляем…' : 'Обновить статус'}
      </button>
    </div>
  );
}

function MethodIconWrap({
  connected,
  pending,
  children,
}: {
  connected?: boolean;
  pending?: boolean;
  children: ReactNode;
}) {
  const wrapClass = connected
    ? 'bg-[#ECFDF5] text-[#16A34A] ring-[#BBF7D0]'
    : pending
      ? 'bg-[#FFFBEB] text-[#D97706] ring-[#FDE68A]'
      : 'bg-[#FFF1F4] text-[#ff5f7a] ring-[#FDE8ED]';

  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ring-1 shadow-[0_4px_12px_rgba(17,24,39,0.04)] ${wrapClass}`}
    >
      {children}
    </span>
  );
}

function LoginMethodSheetCard({
  icon,
  title,
  subtitle,
  connected,
  pending,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  connected?: boolean;
  pending?: boolean;
  children?: React.ReactNode;
}) {
  const hasActions = Boolean(children);

  return (
    <div
      className={`rounded-[20px] bg-white p-4 shadow-[0_6px_22px_rgba(17,24,39,0.05)] ring-1 ${
        connected ? 'ring-[#BBF7D0]/80' : pending ? 'ring-[#FDE68A]/90' : 'ring-[#EAECEF]'
      }`}
    >
      <div className="flex items-start gap-3">
        <MethodIconWrap connected={connected} pending={pending}>
          {icon}
        </MethodIconWrap>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[16px] font-bold leading-tight text-[#111827]">{title}</p>
            {connected ? <MethodStatusBadge tone="ok">Подключён</MethodStatusBadge> : null}
            {pending && !connected ? (
              <MethodStatusBadge tone="pending">Ждёт подтверждение</MethodStatusBadge>
            ) : null}
            {!connected && !pending ? (
              <MethodStatusBadge tone="idle">Не подключён</MethodStatusBadge>
            ) : null}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">{subtitle}</p>
        </div>
        {connected ? (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_6px_16px_rgba(255,95,122,0.28)]"
            aria-hidden
          >
            <HiCheck className="h-5 w-5" strokeWidth={2.5} />
          </span>
        ) : null}
      </div>
      {hasActions ? <div className="mt-4 border-t border-[#F3F4F6] pt-4">{children}</div> : null}
    </div>
  );
}

function MethodStatusBadge({
  children,
  tone,
}: {
  children?: ReactNode;
  tone: 'ok' | 'pending' | 'idle';
}) {
  const cls =
    tone === 'ok'
      ? 'bg-[#ECFDF5] text-[#15803D] ring-[#BBF7D0]'
      : tone === 'pending'
        ? 'bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]'
        : 'bg-[#f6f7fb] text-[#6B7280] ring-[#EAECEF]';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${cls}`}>{children}</span>
  );
}

function OkxAuthRow({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[#111827]">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{subtitle}</p>
      </div>
      {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
    </div>
  );
}

function EmailMethodIcon() {
  return (
    <svg
      className="h-5 w-5"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16v12H4V6Zm0 0 8 6 8-6"
      />
    </svg>
  );
}
