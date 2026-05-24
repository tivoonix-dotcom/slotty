import { Navigate } from 'react-router-dom';
import { MASTER_LOGIN_PATH } from '../../../app/paths';
import { useAuth } from '../../../features/auth/AuthProvider';
import { LoginMethodsPanel } from '../../../features/auth/components/LoginMethodsPanel';
import { settingsPanel } from './adminSettingsTheme';

export function SettingsLoginMethodsSection() {
  const { isAuthenticated, backendConfigured, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Navigate to={MASTER_LOGIN_PATH} replace />;
  }

  return (
    <section className={settingsPanel}>
      {isAuthenticated && backendConfigured ? (
        <LoginMethodsPanel mode="settings" appearance="sheet" />
      ) : (
        <>
          <p className="text-[14px] leading-relaxed text-[#6B7280]">
            Войдите, чтобы привязать Telegram, Google и email к кабинету.
          </p>
          <LoginMethodsPanel mode="login" appearance="page" />
        </>
      )}
    </section>
  );
}
