import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { buildAppPath, getLoginPath, PLATFORM_ADMIN_PATH } from '../../app/paths';
import { useAuth } from '../../features/auth/AuthProvider';
import { isPlatformAdmin } from '../../features/auth/lib/isPlatformAdmin';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { PlatformAdminLayout } from './PlatformAdminLayout';
import { PlatformAdminForbidden } from './PlatformAdminForbidden';
import { PlatformAdminOverviewTab } from './tabs/PlatformAdminOverviewTab';
import { PlatformAdminRequestsHub } from './tabs/PlatformAdminRequestsHub';
import { PlatformAdminUsersTab } from './tabs/PlatformAdminUsersTab';
import { PlatformAdminMastersTab } from './tabs/PlatformAdminMastersTab';
import { PlatformAdminServicesTab } from './tabs/PlatformAdminServicesTab';
import { PlatformAdminBookingsTab } from './tabs/PlatformAdminBookingsTab';
import { PlatformAdminAuditTab } from './tabs/PlatformAdminAuditTab';
import { PlatformAdminBillingHub } from './tabs/PlatformAdminBillingHub';
import { PlatformAdminPaymentsTab } from './tabs/PlatformAdminPaymentsTab';
import { PlatformAdminNotificationsHub } from './tabs/PlatformAdminNotificationsHub';
import { PlatformAdminSupportTab } from './tabs/PlatformAdminSupportTab';
import { PlatformAdminSystemStatusTab } from './tabs/PlatformAdminSystemStatusTab';

export function PlatformAdminPage() {
  const location = useLocation();
  const returnPath = buildAppPath(location.pathname, location.search);
  const { profile, isLoading, isAuthenticated } = useAuth();
  const backendConfigured = Boolean(getApiBaseUrl());

  if (!backendConfigured) {
    return <PlatformAdminForbidden reason="role" />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f6f7fb]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff5f7a] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={getLoginPath(returnPath)} replace />;
  }

  if (!isPlatformAdmin(profile)) {
    return <PlatformAdminForbidden reason="role" />;
  }

  return (
    <Routes>
      <Route element={<PlatformAdminLayout />}>
        <Route index element={<PlatformAdminOverviewTab />} />
        <Route path="requests" element={<PlatformAdminRequestsHub />} />
        <Route path="support" element={<PlatformAdminSupportTab />} />
        <Route path="system-status" element={<PlatformAdminSystemStatusTab />} />
        <Route path="users" element={<PlatformAdminUsersTab />} />
        <Route path="masters" element={<PlatformAdminMastersTab />} />
        <Route path="services" element={<PlatformAdminServicesTab />} />
        <Route path="bookings" element={<PlatformAdminBookingsTab />} />
        <Route path="billing" element={<PlatformAdminBillingHub />} />
        <Route path="payments" element={<PlatformAdminPaymentsTab />} />
        <Route path="payments/:paymentId" element={<PlatformAdminPaymentsTab />} />
        <Route path="notifications/*" element={<PlatformAdminNotificationsHub />} />
        <Route path="audit" element={<PlatformAdminAuditTab />} />
        <Route path="*" element={<Navigate to={PLATFORM_ADMIN_PATH} replace />} />
      </Route>
    </Routes>
  );
}
