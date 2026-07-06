import { useCallback, useMemo } from 'react';
import { ANALYTICS_EVENTS, trackAnalyticsEvent } from '../../shared/analytics/analyticsEvents';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BECOME_MASTER_PATH, getMasterLoginPath, MASTER_START_PATH } from '../../app/paths';
import { useAuth } from '../../features/auth/AuthProvider';
import { LoginAccountHint } from '../../features/auth/components/LoginAccountHint';
import { LoginMethodsPanel } from '../../features/auth/components/LoginMethodsPanel';
import { hasMasterCabinetAccess } from '../../features/auth/lib/hasMasterCabinetAccess';
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

export function MasterRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, profile } = useAuth();

  const afterRegisterPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get('from');
    if (from && from.startsWith('/') && !from.startsWith('//')) {
      return from;
    }
    return getPostLoginPath(profile, location.search);
  }, [location.search, profile]);

  const onLinked = useCallback(
    (loggedInProfile?: BackendProfile) => {
      trackAnalyticsEvent(ANALYTICS_EVENTS.masterRegisterStart);
      navigate(getPostLoginPath(loggedInProfile, location.search), { replace: true });
    },
    [location.search, navigate],
  );

  if (isLoading) {
    return <LoadingScreen className="bg-white" />;
  }

  if (isAuthenticated) {
    if (!hasMasterCabinetAccess(profile)) {
      return <Navigate to={BECOME_MASTER_PATH} replace />;
    }
    return <Navigate to={afterRegisterPath} replace />;
  }

  return (
    <AuthSplitLayout>
      <Link to={MASTER_START_PATH} className={AUTH_BACK_LINK_CLASS}>
        ← Назад
      </Link>
      <h1 className={`mt-6 lg:mt-0 ${AUTH_TITLE_CLASS}`}>Регистрация мастера</h1>
      <p className={AUTH_SUBTITLE_CLASS}>
        Сначала создайте аккаунт — затем заполните анкету и откройте запись для клиентов.
      </p>

      <LoginAccountHint />

      <div className={`mt-8 min-h-[20rem] lg:min-h-[28rem] ${AUTH_FORM_PANEL_CLASS}`}>
        <LoginMethodsPanel mode="login" appearance="page" authIntent="master-register" oauthReturnPath={location.pathname + location.search} onLinked={onLinked} />
      </div>

      <p className="mt-8 text-center text-[14px] text-[#6B7280] lg:text-left">
        Уже есть аккаунт?{' '}
        <Link to={getMasterLoginPath(BECOME_MASTER_PATH)} className={AUTH_FOOTER_LINK_CLASS}>
          Войти
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
