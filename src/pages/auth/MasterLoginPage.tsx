import { useCallback, useMemo } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MASTER_START_PATH } from '../../app/paths';
import { useAuth } from '../../features/auth/AuthProvider';
import { LoginAccountHint } from '../../features/auth/components/LoginAccountHint';
import { LoginMethodsPanel } from '../../features/auth/components/LoginMethodsPanel';
import { getPostLoginPath } from '../../features/auth/lib/postLoginRedirect';
import type { BackendProfile } from '../../features/auth/types';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';
import { AuthSplitLayout } from './AuthSplitLayout';
import {
  AUTH_BACK_LINK_CLASS,
  AUTH_FOOTER_LINK_CLASS,
  AUTH_FORM_PANEL_CLASS,
  AUTH_SUBTITLE_CLASS,
  AUTH_TITLE_CLASS,
} from './authPageLayout';

export function MasterLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, profile } = useAuth();

  const afterLoginPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get('from');
    if (from && from.startsWith('/') && !from.startsWith('//')) {
      return from;
    }
    return getPostLoginPath(profile, location.search);
  }, [location.search, profile]);

  const onLinked = useCallback(
    (loggedInProfile?: BackendProfile) => {
      navigate(getPostLoginPath(loggedInProfile, location.search), { replace: true });
    },
    [location.search, navigate],
  );

  if (isLoading) {
    return <LoadingScreen className="bg-white" />;
  }

  if (isAuthenticated) {
    return <Navigate to={afterLoginPath} replace />;
  }

  return (
    <AuthSplitLayout>
      <Link to={MASTER_START_PATH} className={AUTH_BACK_LINK_CLASS}>
        ← Назад
      </Link>
      <h1 className={`mt-6 lg:mt-0 ${AUTH_TITLE_CLASS}`}>Войдите в кабинет мастера</h1>
      <p className={AUTH_SUBTITLE_CLASS}>Google, Telegram или email — выберите удобный способ.</p>

      <LoginAccountHint />

      <div className={`mt-8 min-h-[20rem] lg:min-h-[28rem] ${AUTH_FORM_PANEL_CLASS}`}>
        <LoginMethodsPanel mode="login" appearance="page" authIntent="master-login" onLinked={onLinked} />
      </div>

      <p className="mt-8 text-center text-[14px] text-[#6B7280] lg:text-left">
        Нет аккаунта?{' '}
        <Link to={MASTER_START_PATH} className={AUTH_FOOTER_LINK_CLASS}>
          Зарегистрироваться
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
