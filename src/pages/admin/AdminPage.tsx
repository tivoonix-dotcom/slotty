import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { ADMIN_PATH, BECOME_MASTER_PATH, HUB_PATH } from '../../app/paths';
import { useAuth } from '../../features/auth/AuthProvider';
import { isDemoMaster } from '../../features/profile/lib/demoMasterStorage';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { AdminAppointmentsPage } from './appointments/AdminAppointmentsPage';
import { AdminBillingPage } from './billing/AdminBillingPage';
import { AdminHomePage } from './profile/AdminHomePage';
import { ProfileCompletionPage } from './profile/ProfileCompletionPage';
import { AdminLayout } from './AdminLayout';
import { AdminOverviewPage } from './overview/AdminOverviewPage';
import { AdminSchedulePage } from './schedule/AdminSchedulePage';
import { AdminServicesPage } from './services/AdminServicesPage';
import { AdminNotificationsPage } from './notifications/AdminNotificationsPage';
import { AdminSettingsLayout } from './settings/AdminSettingsLayout';
import { AdminLoginMethodsPage } from './settings/AdminLoginMethodsPage';
import { SettingsHelpSection } from './settings/SettingsHelpSection';
import { SettingsLoginMethodsSection } from './settings/SettingsLoginMethodsSection';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';

export function AdminPage() {
  const { profile, isLoading } = useAuth();
  const apiMaster = Boolean(getApiBaseUrl() && profile?.role === 'master');
  const allowed = isDemoMaster() || apiMaster;

  if (isLoading) {
    return <LoadingScreen className="bg-[#F1EFEF]" />;
  }

  if (!allowed) {
    return (
      <div className="min-h-dvh bg-white pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg px-4">
          <Link
            to={HUB_PATH}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 shadow-[0_8px_24px_rgba(17,17,17,0.06)] transition active:scale-[0.99]"
          >
            На главную
          </Link>
          <div className="mt-8 rounded-[36px] bg-[#F1EFEF] px-6 py-12 text-center shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
            <h1 className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950">Кабинет мастера</h1>
            <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-neutral-600">
              Сначала создайте профиль мастера, чтобы принимать записи.
            </p>
            <Link
              to={BECOME_MASTER_PATH}
              className="mt-8 inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-[#E29595] px-6 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
            >
              Стать мастером
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminHomePage />} />
        <Route path="overview" element={<AdminOverviewPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="schedule" element={<AdminSchedulePage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        <Route path="billing" element={<AdminBillingPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsLayout />}>
          <Route index element={<Navigate to="login-methods" replace />} />
          <Route path="login-methods" element={<SettingsLoginMethodsSection />} />
          <Route path="support" element={<SettingsHelpSection />} />
          <Route path="documents" element={<Navigate to="../support" replace />} />
        </Route>
        <Route path="login-methods" element={<AdminLoginMethodsPage />} />
        <Route path="profile/completion" element={<ProfileCompletionPage />} />
        <Route path="profile" element={<Navigate to={ADMIN_PATH} replace />} />
      </Route>
      <Route path="*" element={<Navigate to={ADMIN_PATH} replace />} />
    </Routes>
  );
}
