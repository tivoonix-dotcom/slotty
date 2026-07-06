import { useCallback } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LEGAL_PD_CONSENT_PATH, LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH } from '../../app/paths';
import { legalReturnState } from '../legal/useLegalPageBack';
import { useAuth } from '../../features/auth/AuthProvider';
import { LoginAccountHint } from '../../features/auth/components/LoginAccountHint';
import { LoginMethodsPanel } from '../../features/auth/components/LoginMethodsPanel';
import { TelegramBrowserHandoffSuccess } from '../../features/auth/components/TelegramBrowserHandoffSuccess';
import { TG_BROWSER_PENDING_PARAM } from '../../features/auth/lib/telegramBrowserHandoff';
import { getPostClientLoginPath } from '../../features/auth/lib/postLoginRedirect';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';
import { AuthSplitLayout } from './AuthSplitLayout';
import { AUTH_SUBTITLE_CLASS, AUTH_TITLE_CLASS } from './authPageLayout';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { isTelegramWebApp } = useTelegram();

  const afterLoginPath = getPostClientLoginPath(location.search);
  const browserHandoffPendingId = searchParams.get(TG_BROWSER_PENDING_PARAM)?.trim() ?? null;

  const onLinked = useCallback(() => {
    navigate(afterLoginPath, { replace: true });
  }, [navigate, afterLoginPath]);

  if (isLoading) {
    return <LoadingScreen className="bg-white" />;
  }

  if (isAuthenticated && isTelegramWebApp && browserHandoffPendingId) {
    return <TelegramBrowserHandoffSuccess pendingId={browserHandoffPendingId} />;
  }

  if (isAuthenticated) {
    return <Navigate to={afterLoginPath} replace />;
  }

  const legalReturn = legalReturnState(`${location.pathname}${location.search}`);

  return (
    <AuthSplitLayout>
      <h1 className={AUTH_TITLE_CLASS}>Войти</h1>
      <p className={AUTH_SUBTITLE_CLASS}>Email, Google или Telegram — как вам удобнее.</p>

      <LoginAccountHint />

      <div className="mt-8 min-h-[28rem]">
        <LoginMethodsPanel mode="login" appearance="page" onLinked={onLinked} />
      </div>

      <p className="mt-10 text-[12px] leading-relaxed text-[#9CA3AF]">
        Продолжая, вы соглашаетесь с{' '}
        <Link
          to={LEGAL_TERMS_PATH}
          state={legalReturn}
          className="font-semibold text-[#6B7280] underline-offset-2 hover:underline"
        >
          соглашением
        </Link>
        ,{' '}
        <Link
          to={LEGAL_PRIVACY_PATH}
          state={legalReturn}
          className="font-semibold text-[#6B7280] underline-offset-2 hover:underline"
        >
          политикой ПД
        </Link>{' '}
        и{' '}
        <Link
          to={LEGAL_PD_CONSENT_PATH}
          state={legalReturn}
          className="font-semibold text-[#6B7280] underline-offset-2 hover:underline"
        >
          согласием на обработку ПД
        </Link>
        .
      </p>
    </AuthSplitLayout>
  );
}
