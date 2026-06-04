import { Navigate } from 'react-router-dom';
import { MASTER_LOGIN_PATH } from '../../../../../app/paths';
import { useAuth } from '../../../../../features/auth/AuthProvider';
import { LoginMethodsPanel } from '../../../../../features/auth/components/LoginMethodsPanel';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';

const meta = SETTINGS_PAGE_META.security;

export function SettingsSecurityPage() {
  const { isAuthenticated, backendConfigured, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Navigate to={MASTER_LOGIN_PATH} replace />;
  }

  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
      <div className="space-y-6">
        {isAuthenticated && backendConfigured ? (
          <LoginMethodsPanel mode="settings" appearance="okx" />
        ) : (
          <LoginMethodsPanel mode="login" appearance="page" />
        )}
      </div>
    </>
  );
}
