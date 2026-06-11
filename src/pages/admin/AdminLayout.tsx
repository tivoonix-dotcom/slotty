import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_BILLING_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PROFILE_COMPLETION_PATH,
  ADMIN_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_SERVICES_PATH,
  MASTER_SETTINGS_PATH,
} from '../../app/paths';
import { AdminNotificationsProvider, useAdminNotifications } from './notifications/AdminNotificationsContext';
import { useMasterPlanEntitlements } from '../../features/billing/useMasterPlanEntitlements';
import { TrialProBanner } from '../../features/billing/TrialProBanner';
import { AdminMasterCabinetProvider, useAdminMasterCabinet } from './AdminMasterCabinetContext';
import { ProfileSectionTabsBar, ProfileTabProvider } from './profile/profileTabContext';
import { ADMIN_CABINET_SHELL_MAX } from './overview/adminOverviewTheme';
import {
  adminDesktopCabinetBody,
  adminDesktopCabinetShell,
  adminDesktopMainScroll,
  ADMIN_DESKTOP_CANVAS,
} from './adminCabinetLayout';
import { AdminDesktopSidebar } from './AdminDesktopSidebar';
import { AdminDesktopTopBar } from './AdminDesktopTopBar';
import { adminMobileTabBarScrollPadClass } from './shared/adminMobileTabBarTheme';
import { AdminCabinetBurgerMenu } from './shared/AdminCabinetBurgerMenu';
import { AdminRouteTransitionOutlet } from './shared/AdminRouteTransitionOutlet';
import { AccountAccessRestrictedBanner } from '../../features/auth/components/AccountAccessBanner';
import { AccountBlockedScreen } from '../../features/auth/components/AccountBlockedScreen';
import { MasterPlatformAccessProvider } from '../../features/auth/context/MasterPlatformAccessContext';
import { useAccountAccess } from '../../features/auth/hooks/useAccountAccess';
import { useAuth } from '../../features/auth/AuthProvider';
import { isPlatformAdmin } from '../../features/auth/lib/isPlatformAdmin';
import { AdminContentLoadingOverlay } from './shared/AdminContentLoadingOverlay';
import { AdminCabinetStatusBanner } from './AdminCabinetStatusBanner';
import { AdminMobileCabinetHeader } from './shared/AdminMobileCabinetHeader';
import { useServicesCatalogAttention } from './services/useServicesCatalogAttention';

function AdminCabinetLoadingGate() {
  const { cabinetLoading, useCabinetApi } = useAdminMasterCabinet();
  return <AdminContentLoadingOverlay show={Boolean(useCabinetApi && cabinetLoading)} />;
}

export function AdminLayout() {
  return (
    <MasterPlatformAccessProvider>
      <AdminMasterCabinetProvider>
        <AdminNotificationsProvider>
          <AdminLayoutInner />
        </AdminNotificationsProvider>
      </AdminMasterCabinetProvider>
    </MasterPlatformAccessProvider>
  );
}

function AdminLayoutInner() {
  const accountAccess = useAccountAccess();
  const { profile } = useAuth();
  const showPlatformAdmin = isPlatformAdmin(profile);
  const { planId, entitlements } = useMasterPlanEntitlements();
  const { hasUnread, unreadCount } = useAdminNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const stickyShellRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const isProfileHome = pathname === ADMIN_PATH;
  const isProfileCompletion = pathname === ADMIN_PROFILE_COMPLETION_PATH;
  const isOverview = pathname === ADMIN_OVERVIEW_PATH;
  const isServices = pathname === ADMIN_SERVICES_PATH;
  const isSchedule = pathname === ADMIN_SCHEDULE_PATH;
  const isAppointments = pathname === ADMIN_APPOINTMENTS_PATH;
  const isNotifications = pathname === ADMIN_NOTIFICATIONS_PATH;
  const isBilling = pathname === ADMIN_BILLING_PATH;
  const isSettings = pathname.startsWith(MASTER_SETTINGS_PATH);
  const servicesNeedAttention = useServicesCatalogAttention();

  useLayoutEffect(() => {
    const el = stickyShellRef.current;
    if (!el) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty('--slotty-admin-header-h', `${el.offsetHeight}px`);
    };

    syncHeaderHeight();
    const ro = new ResizeObserver(syncHeaderHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isProfileHome, isOverview]);

  const mobileTabBarPad = `${adminMobileTabBarScrollPadClass} lg:pb-0`;

  const shellPadBottom = isProfileHome || isProfileCompletion
    ? mobileTabBarPad
    : isOverview
      ? 'pb-6 lg:pb-0'
      : isSettings
        ? mobileTabBarPad
        : isServices || isSchedule || isAppointments
          ? mobileTabBarPad
          : 'lg:pb-8';

  /** Сводка / услуги / расписание / записи — серое полотно на мобиле до самого низа (включая отступ под таббар). */
  const mobileGrayCanvas =
    isOverview ||
    isServices ||
    isSchedule ||
    isAppointments ||
    isNotifications ||
    isProfileCompletion;

  const pageShellBg = mobileGrayCanvas ? 'bg-[#F5F5F5] lg:bg-white' : 'bg-white';

  const desktopCanvasBg =
    isProfileHome ||
    isOverview ||
    isProfileCompletion ||
    isServices ||
    isSchedule ||
    isAppointments ||
    isNotifications ||
    isSettings ||
    isBilling
      ? 'lg:bg-[#f6f7fb]'
      : 'lg:bg-[#f6f7fb]';

  const desktopMainCanvasBg =
    isProfileHome ||
    isOverview ||
    isProfileCompletion ||
    isServices ||
    isSchedule ||
    isAppointments ||
    isNotifications ||
    isSettings ||
    isBilling
      ? ADMIN_DESKTOP_CANVAS
      : ADMIN_DESKTOP_CANVAS;

  return (
    <div className={`${adminDesktopCabinetShell} text-[#111827] ${pageShellBg}`}>
      <AdminDesktopTopBar />

      <div className={`${adminDesktopCabinetBody} ${desktopCanvasBg}`}>
        <AdminDesktopSidebar />

        <div
          className={`${adminDesktopMainScroll} ${desktopMainCanvasBg} ${
            mobileGrayCanvas ? 'max-lg:bg-[#F5F5F5]' : ''
          }`}
        >
          <AdminCabinetLoadingGate />
          <ProfileTabProvider>
            <AdminMobileCabinetHeader
              shellRef={stickyShellRef}
              menuOpen={menuOpen}
              onMenuOpen={() => setMenuOpen(true)}
            />

          {!isProfileHome ? <AdminCabinetStatusBanner /> : null}
          {!isBilling ? <TrialProBanner entitlements={entitlements} className="mx-4 mb-3 lg:mx-0" /> : null}

          {accountAccess.showBlockedScreen || accountAccess.showDeletedScreen ? (
            <div className={`mx-auto w-full min-w-0 flex-1 ${ADMIN_CABINET_SHELL_MAX} px-4 py-6`}>
              <AccountBlockedScreen access={accountAccess} />
            </div>
          ) : (
          <div
            className={`mx-auto w-full min-w-0 flex-1 ${ADMIN_CABINET_SHELL_MAX} ${shellPadBottom} ${
              mobileGrayCanvas ? 'max-lg:bg-[#F5F5F5]' : ''
            }`}
          >
            {accountAccess.showRestrictedBanner ? (
              <div className="px-4 pt-3 lg:px-8 lg:pt-4">
                <AccountAccessRestrictedBanner access={accountAccess} variant="master" />
              </div>
            ) : null}
            <div
              className={`w-full min-w-0 px-4 pt-4 lg:pb-8 lg:pt-6 ${
                mobileGrayCanvas ? 'max-lg:bg-transparent' : ''
              } ${
                isOverview ||
                isProfileHome ||
                isProfileCompletion ||
                isServices ||
                isSchedule ||
                isAppointments ||
                isNotifications ||
                isSettings ||
                isBilling
                  ? 'lg:mx-auto lg:max-w-6xl lg:bg-transparent lg:px-8 lg:shadow-none lg:ring-0'
                  : 'lg:mx-auto lg:max-w-6xl lg:rounded-[24px] lg:bg-white lg:px-8 lg:shadow-[0_4px_24px_rgba(17,24,39,0.06)] lg:ring-1 lg:ring-[#EAECEF]'
              }`}
            >
              <AdminRouteTransitionOutlet />
            </div>
            <ProfileSectionTabsBar />
          </div>
          )}
        </ProfileTabProvider>

        <AdminCabinetBurgerMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          servicesNeedAttention={servicesNeedAttention}
          hasUnread={hasUnread}
          unreadCount={unreadCount}
          planId={planId}
          showPlatformAdmin={showPlatformAdmin}
        />

        </div>
      </div>
    </div>
  );
}
