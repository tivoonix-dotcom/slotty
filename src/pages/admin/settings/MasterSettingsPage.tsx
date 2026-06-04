import { Link, Navigate, Route, Routes } from 'react-router-dom';
import {
  BECOME_MASTER_PATH,
  getMasterLoginPath,
  MASTER_SETTINGS_PATH,
  MASTER_START_PATH,
  PLATFORM_ADMIN_PATH,
} from '../../../app/paths';
import { useAuth } from '../../../features/auth/AuthProvider';
import { hasMasterCabinetAccess } from '../../../features/auth/lib/hasMasterCabinetAccess';
import { isDemoMaster } from '../../../features/profile/lib/demoMasterStorage';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import { LoadingScreen } from '../../../shared/ui/LoadingVideo';
import { AdminNotificationsProvider } from '../notifications/AdminNotificationsContext';
import { AdminMasterCabinetProvider } from '../AdminMasterCabinetContext';
import { MasterPlatformAccessProvider } from '../../../features/auth/context/MasterPlatformAccessContext';
import { SettingsLayout } from './workspace/SettingsLayout';
import { SettingsSecurityPage } from './workspace/pages/SettingsSecurityPage';
import { SettingsNotificationsPage } from './workspace/pages/SettingsNotificationsPage';
import { SettingsBillingPage } from './workspace/pages/SettingsBillingPage';
import { SettingsTeamPage } from './workspace/pages/SettingsTeamPage';
import { SettingsIntegrationsPage } from './workspace/pages/SettingsIntegrationsPage';
import { SettingsPrivacyPage } from './workspace/pages/SettingsPrivacyPage';
import { SettingsSupportPage } from './workspace/pages/SettingsSupportPage';
import { SettingsAboutPage } from './workspace/pages/SettingsAboutPage';

export function MasterSettingsPage() {
  const { profile, isLoading, isAuthenticated } = useAuth();
  const hasApi = Boolean(getApiBaseUrl());
  const cabinetAccess = hasMasterCabinetAccess(profile);
  const apiMaster = hasApi && cabinetAccess;
  const allowed = apiMaster || (!hasApi && isDemoMaster());

  if (isLoading) {
    return <LoadingScreen className="bg-[#f6f7fb]" />;
  }

  if (!allowed) {
    if (hasApi && !isAuthenticated) {
      return <Navigate to={getMasterLoginPath(MASTER_SETTINGS_PATH)} replace />;
    }

    const isPlatformAdminWithoutCabinet =
      hasApi && profile?.role === 'platform_admin' && !profile.hasMasterProfile;

    if (isPlatformAdminWithoutCabinet) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] p-6">
          <div className="max-w-md rounded-[20px] bg-white p-8 text-center shadow-lg">
            <h1 className="text-xl font-bold">Кабинет мастера недоступен</h1>
            <Link to={PLATFORM_ADMIN_PATH} className="mt-6 inline-block text-[#ff5f7a] font-semibold">
              Платформенная админка
            </Link>
          </div>
        </div>
      );
    }

    if (hasApi && isAuthenticated && !cabinetAccess) {
      return <Navigate to={BECOME_MASTER_PATH} replace />;
    }

    if (!hasApi && !isDemoMaster()) {
      return <Navigate to={MASTER_START_PATH} replace />;
    }
  }

  return (
    <MasterPlatformAccessProvider>
      <AdminMasterCabinetProvider>
        <AdminNotificationsProvider>
          <Routes>
            <Route element={<SettingsLayout />}>
              <Route index element={<Navigate to="security" replace />} />
              <Route path="security" element={<SettingsSecurityPage />} />
              <Route path="notifications" element={<SettingsNotificationsPage />} />
              <Route path="billing" element={<SettingsBillingPage />} />
              <Route path="team" element={<SettingsTeamPage />} />
              <Route path="integrations" element={<SettingsIntegrationsPage />} />
              <Route path="privacy" element={<SettingsPrivacyPage />} />
              <Route path="support" element={<SettingsSupportPage />} />
              <Route path="about" element={<SettingsAboutPage />} />
            </Route>
            <Route path="*" element={<Navigate to={`${MASTER_SETTINGS_PATH}/security`} replace />} />
          </Routes>
        </AdminNotificationsProvider>
      </AdminMasterCabinetProvider>
    </MasterPlatformAccessProvider>
  );
}
