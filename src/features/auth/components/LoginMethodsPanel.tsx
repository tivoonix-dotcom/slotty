import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import type { AuthIdentityDto, AuthProvider, BackendProfile } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';
import { LoginMethodsHint } from './LoginMethodsHint';
import { useTelegram } from '../../../shared/hooks/useTelegram';
import { openTelegramOrBrowserUrl } from '../../../shared/lib/telegramWebApp';
import { GoogleIcon } from '../../../shared/ui/GoogleIcon';
import { useAuth } from '../AuthProvider';
import {
  cabinetCard,
  cabinetCardPad,
  cabinetIconCircle,
  sheetFieldClass,
  sheetHintClass,
  sheetPrimaryBtnClass,
  sheetOutlineBtnClass,
} from '../../../pages/admin/profile/adminProfileCabinetTheme';

type Props = {
  /** settings = привязка способов входа; login = вход на сайте */
  mode?: 'settings' | 'login';
  /** page = /login; sheet = bottom sheet кабинета */
  appearance?: 'default' | 'page' | 'sheet';
  /** Вызывается после успешного входа или привязки; для входа передаётся актуальный profile. */
  onLinked?: (profile?: BackendProfile) => void;
};

const pageFieldClass =
  'w-full rounded-2xl border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3.5 text-[15px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#111827] focus:bg-white';

const pagePrimaryBtn =
  'w-full rounded-2xl bg-[#111827] px-4 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#1F2937] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]';

const pageSocialBtn =
  'relative flex w-full min-h-[52px] items-center justify-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-5 text-[15px] font-semibold text-[#111827] transition hover:bg-[#FAFAFA] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

const socialOutlineBtn =
  'flex w-full min-h-12 items-center justify-center gap-3 rounded-full border border-[#E5E7EB] bg-white px-5 text-[15px] font-semibold text-[#111827] transition hover:bg-[#FAFAFA] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

const settingsActionBtn =
  'shrink-0 rounded-full bg-[#E29595] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50';

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
        ? pageSocialBtn
        : socialOutlineBtn;
  const overlayRound = pageStyle ? 'rounded-2xl' : variant === 'cabinet' ? 'rounded-[17px]' : 'rounded-full';

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

export function LoginMethodsPanel({ mode = 'settings', appearance = 'default', onLinked }: Props) {
  const [searchParams] = useSearchParams();
  const loginReturnPath = searchParams.get('from') ?? undefined;
  const { isAuthenticated, applySession, refreshProfile } = useAuth();
  const { initDataRaw, isTelegramWebApp } = useTelegram();
  const [identities, setIdentities] = useState<AuthIdentityDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailMode, setEmailMode] = useState<'login' | 'register' | 'link'>('login');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showLoginEmail, setShowLoginEmail] = useState(appearance === 'page');
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSettings = mode === 'settings' && isAuthenticated;
  const pageStyle = appearance === 'page';
  const sheetStyle = appearance === 'sheet';
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
          const session = await loginWithGoogle(idToken);
          applySession(session);
          onLinked?.(session.profile);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : messageForAuthErrorCode('GOOGLE_TOKEN_INVALID'));
      } finally {
        setBusy(false);
      }
    },
    [applySession, isSettings, onLinked, refreshProfile],
  );

  const handleLoginTelegram = useCallback(async () => {
    if (initDataRaw && isTelegramWebApp) {
      setBusy(true);
      setError(null);
      try {
        const session = await loginWithTelegram(initDataRaw);
        applySession(session);
        onLinked?.(session.profile);
      } catch (e) {
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
  }, [applySession, initDataRaw, isTelegramWebApp, onLinked, telegramLoginUrl]);

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
        const session = await registerWithEmail(email, password);
        applySession(session);
        setEmailNotice(
          `Мы отправили письмо на ${email.trim()}. Подтвердите email по ссылке из письма (проверьте «Спам»).`,
        );
        onLinked?.(session.profile);
      } else {
        const session = await loginWithEmail(email, password);
        applySession(session);
        onLinked?.(session.profile);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка email');
    } finally {
      setBusy(false);
    }
  }, [applySession, email, emailMode, isSettings, onLinked, password, refreshProfile]);

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

  /* ——— Вход: /login (как в референсе — email, затем «или продолжить с») ——— */
  if (!isSettings && pageStyle) {
    return (
      <div className="space-y-6">
        {error ? <ErrorBanner message={error} pageStyle /> : null}
        {emailNotice ? (
          <p className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[13px] leading-relaxed text-[#166534]">
            {emailNotice}
          </p>
        ) : null}
        {busy ? <p className="text-[13px] text-[#6B7280]">Подождите…</p> : null}

        <div className="space-y-4">
          <div className="flex gap-8 border-b border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setEmailMode('login')}
              className={`min-w-[4.5rem] border-b-2 pb-3 text-[15px] font-semibold transition ${
                emailMode === 'login'
                  ? 'border-[#111827] text-[#111827]'
                  : 'border-transparent text-[#9CA3AF] hover:text-[#6B7280]'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setEmailMode('register')}
              className={`min-w-[6.5rem] border-b-2 pb-3 text-[15px] font-semibold transition ${
                emailMode === 'register'
                  ? 'border-[#111827] text-[#111827]'
                  : 'border-transparent text-[#9CA3AF] hover:text-[#6B7280]'
              }`}
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
            className={pageFieldClass}
          />
          <input
            type="password"
            autoComplete={emailMode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль (мин. 8 символов)"
            className={pageFieldClass}
          />
          <button
            type="button"
            disabled={busy || !email.trim() || password.length < 8}
            onClick={() => void handleEmailSubmit()}
            className={`${pagePrimaryBtn} min-h-[52px]`}
          >
            {emailMode === 'register' ? 'Зарегистрироваться' : 'Продолжить'}
          </button>

          <p className="min-h-[22px] text-[14px] leading-snug text-[#6B7280]">
            {emailMode === 'login' ? (
              <Link to={FORGOT_PASSWORD_PATH} className="font-semibold text-[#111827] underline-offset-2 hover:underline">
                Забыли пароль?
              </Link>
            ) : (
              <span className="invisible select-none" aria-hidden>
                Забыли пароль?
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E5E7EB]" />
          <span className="text-[13px] font-medium text-[#9CA3AF]">или продолжить с</span>
          <div className="h-px flex-1 bg-[#E5E7EB]" />
        </div>

        <div className="space-y-3">
          <GoogleLoginPill
            busy={busy}
            googleClientId={googleClientId}
            label="Google"
            pageStyle
            isTelegramWebApp={inTelegramApp}
            oauthPurpose="login"
            oauthReturnPath={loginReturnPath}
            onCredential={(t) => void handleGoogleCredential(t)}
            onError={(m) => setError(m)}
          />

          {renderTelegramLoginControl(pageSocialBtn, 'Telegram')}

          {!initDataRaw || !isTelegramWebApp ? (
            <p className="text-center text-[12px] leading-relaxed text-[#9CA3AF]">
              Откроется Telegram → бот SLOTTY → кнопка «Открыть SLOTTY» для входа.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  /* ——— Вход: /master/login ——— */
  if (!isSettings) {
    return (
      <div className="space-y-4">
        {error ? <ErrorBanner message={error} pageStyle={false} /> : null}
        {emailNotice ? (
          <p className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[13px] leading-relaxed text-[#166534]">
            {emailNotice}
          </p>
        ) : null}
        {busy ? <p className="text-[13px] text-neutral-500">Подождите…</p> : null}

        <div className="space-y-3">
          <GoogleLoginPill
            busy={busy}
            googleClientId={googleClientId}
            label="Войти через Google"
            pageStyle={false}
            isTelegramWebApp={inTelegramApp}
            oauthPurpose="login"
            onCredential={(t) => void handleGoogleCredential(t)}
            onError={(m) => setError(m)}
          />

          {renderTelegramLoginControl(socialOutlineBtn, 'Войти через Telegram')}

          {!initDataRaw || !isTelegramWebApp ? (
            <p className="text-[12px] leading-relaxed text-neutral-500">
              Нажмите «Войти через Telegram» — откроется приложение Telegram и бот SLOTTY.
            </p>
          ) : null}

          {!showLoginEmail ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowLoginEmail(true)}
              className="flex w-full min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F1EFEF] px-5 text-[14px] font-semibold text-neutral-900"
            >
              Войти по email
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmailMode('login')}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    emailMode === 'login' ? 'bg-white text-neutral-950' : 'text-neutral-600'
                  }`}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => setEmailMode('register')}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    emailMode === 'register' ? 'bg-white text-neutral-950' : 'text-neutral-600'
                  }`}
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
                className="w-full rounded-[14px] border-0 bg-white px-4 py-3 text-[15px] shadow-sm outline-none ring-1 ring-neutral-200/80"
              />
              <input
                type="password"
                autoComplete={emailMode === 'register' ? 'new-password' : 'current-password'}
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
                {emailMode === 'register' ? 'Зарегистрироваться' : 'Продолжить'}
              </button>
              <Link
                to={FORGOT_PASSWORD_PATH}
                className="block text-center text-[13px] font-semibold text-[#F47C8C] no-underline hover:underline"
              >
                Забыли пароль?
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ——— Способы входа: bottom sheet (кабинет) ——— */
  if (sheetStyle && isSettings) {
    const connectedCount = [
      linked.telegram,
      linked.google,
      linked.email && linked.emailVerified,
    ].filter(Boolean).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-[16px] bg-[#F7F7F8] px-4 py-3">
          <p className="text-[13px] font-medium text-[#6B7280]">Статус</p>
          <p className="text-[14px] font-semibold text-[#111827]">
            {loading ? '…' : `Подключено ${connectedCount} из 3`}
          </p>
        </div>

        <LoginMethodsHint />

        {error ? <ErrorBanner message={error} pageStyle={false} /> : null}
        {emailNotice ? (
          <p className="rounded-[18px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[13px] leading-relaxed text-[#166534]">
            {emailNotice}
          </p>
        ) : null}

        <LoginMethodSheetCard
          icon={<TelegramMark />}
          title="Telegram"
          subtitle={
            linked.telegram
              ? 'Основной способ входа в Mini App'
              : 'Откройте SLOTTY в приложении Telegram'
          }
          connected={linked.telegram}
        >
          {!linked.telegram ? (
            <div className="space-y-2">
              {inTelegramApp ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleLinkTelegram()}
                  className={sheetPrimaryBtnClass}
                >
                  Подключить Telegram
                </button>
              ) : (
                <>
                  <p className={sheetHintClass}>
                    В браузере сначала откройте бота — затем вернитесь сюда и подключите аккаунт.
                  </p>
                  {telegramLoginUrl ? (
                    <a href={telegramLoginUrl} className={`${sheetOutlineBtnClass} no-underline`}>
                      Открыть бота в Telegram
                    </a>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <p className={sheetHintClass}>Можно входить через кнопку «Открыть SLOTTY» в боте.</p>
          )}
        </LoginMethodSheetCard>

        <LoginMethodSheetCard
          icon={<GoogleIcon size={20} />}
          title="Google"
          subtitle={linked.google ? 'Вход с почтой Google' : 'Удобно с телефона и компьютера'}
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
                <p className={sheetHintClass}>Откроется браузер — так Google разрешает вход из Telegram.</p>
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
              className={sheetOutlineBtnClass}
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
              className={sheetPrimaryBtnClass}
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
                className={sheetPrimaryBtnClass}
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

      <LoginMethodsHint />

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
  return (
    <div className={`${cabinetCard} ${cabinetCardPad}`}>
      <div className="flex items-start gap-3">
        <div className={cabinetIconCircle}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[16px] font-semibold text-[#111827]">{title}</p>
            {connected ? <MethodStatusBadge tone="ok">Подключён</MethodStatusBadge> : null}
            {pending ? <MethodStatusBadge tone="pending">Ждёт письмо</MethodStatusBadge> : null}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">{subtitle}</p>
        </div>
      </div>
      {children ? <div className="mt-4 border-t border-[#F3F4F6] pt-4">{children}</div> : null}
    </div>
  );
}

function MethodStatusBadge({
  children,
  tone,
}: {
  children?: ReactNode;
  tone: 'ok' | 'pending';
}) {
  const cls =
    tone === 'ok'
      ? 'bg-[#ECFDF5] text-[#15803D] ring-[#BBF7D0]'
      : 'bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>{children}</span>
  );
}

function EmailMethodIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16v12H4V6Zm0 0 8 6 8-6"
      />
    </svg>
  );
}
