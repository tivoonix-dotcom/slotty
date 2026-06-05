import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_BILLING_PATH,
  MASTER_SETTINGS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PROFILE_COMPLETION_PATH,
  ADMIN_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_SERVICES_PATH,
  PLATFORM_ADMIN_PATH,
} from '../../app/paths';
import { AdminNotificationsProvider, useAdminNotifications } from './notifications/AdminNotificationsContext';
import { planBadgeLabel } from '../../features/billing/model/masterPlans';
import { useMasterPlanEntitlements } from '../../features/billing/useMasterPlanEntitlements';
import { TrialProBanner } from '../../features/billing/TrialProBanner';
import { AdminMasterCabinetProvider, useAdminMasterCabinet } from './AdminMasterCabinetContext';
import { ProfileSectionTabsBar, ProfileTabProvider } from './profile/profileTabContext';
import { ADMIN_CABINET_SHELL_MAX } from './overview/adminOverviewTheme';
import { ADMIN_DESKTOP_CANVAS } from './adminCabinetLayout';
import {
  ADMIN_MAIN_NAV,
  resolveAdminNavItemMeta,
  ADMIN_SECTION_META,
  ADMIN_SETTINGS_NAV,
  IconNavBilling,
  IconNavNotifications,
  AdminCabinetNavLink,
} from './adminCabinetNav';
import { AdminDesktopSidebar } from './AdminDesktopSidebar';
import { AdminDesktopTopBar } from './AdminDesktopTopBar';
import { ADMIN_MOBILE_TAB_BAR_HEIGHT } from './shared/adminMobileTabBarTheme';
import { SERVICES_TAB_BAR_HEIGHT } from './services/adminServicesTheme';
import { APPOINTMENTS_TAB_BAR_HEIGHT } from './appointments/adminAppointmentsTheme';
import { SCHEDULE_TAB_BAR_HEIGHT } from './schedule/adminScheduleTheme';
import { AdminBottomSheet } from './shared/AdminBottomSheet';
import { AdminRouteTransitionOutlet } from './shared/AdminRouteTransitionOutlet';
import { AccountAccessRestrictedBanner } from '../../features/auth/components/AccountAccessBanner';
import { AccountBlockedScreen } from '../../features/auth/components/AccountBlockedScreen';
import { MasterPlatformAccessProvider } from '../../features/auth/context/MasterPlatformAccessContext';
import { useAccountAccess } from '../../features/auth/hooks/useAccountAccess';
import { useAuth } from '../../features/auth/AuthProvider';
import { isPlatformAdmin } from '../../features/auth/lib/isPlatformAdmin';
import { AdminContentLoadingOverlay } from './shared/AdminContentLoadingOverlay';
import { LOADING_VIDEO_SRC } from '../../shared/ui/loadingVideoSrc';
import { AdminCabinetStatusBanner } from './AdminCabinetStatusBanner';
import { AdminMobileCabinetHeader } from './shared/AdminMobileCabinetHeader';

function UnreadBadge({ count, inverted }: { count: number; inverted?: boolean }) {
  const label = count > 9 ? '9+' : String(count);
  return (
    <span
      className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
        inverted ? 'bg-white/25 text-white' : 'bg-[#F47C8C] text-white'
      }`}
    >
      {label}
    </span>
  );
}

function navClass(active: boolean): string {
  return `flex min-h-12 w-full items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left transition active:scale-[0.99] ${
    active ? 'bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.25)]' : 'bg-[#F1EFEF] text-neutral-900'
  }`;
}

function MobileNavItemText({
  label,
  description,
  active,
}: {
  label: string;
  description?: string;
  active: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-[15px] font-semibold">{label}</span>
      {description ? (
        <span
          className={`line-clamp-2 text-[12px] font-normal leading-snug ${
            active ? 'text-white/85' : 'text-neutral-600'
          }`}
        >
          {description}
        </span>
      ) : null}
    </span>
  );
}

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

  useLayoutEffect(() => {
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.src = LOADING_VIDEO_SRC;
    v.load();
  }, []);

  const mobileTabBarPad = `pb-[calc(${ADMIN_MOBILE_TAB_BAR_HEIGHT}+1.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0`;

  const shellPadBottom = isProfileHome || isProfileCompletion
    ? mobileTabBarPad
    : isOverview
      ? 'pb-6 lg:pb-0'
      : isSettings
        ? mobileTabBarPad
        : isServices
          ? `pb-[calc(${SERVICES_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1.25rem)] lg:pb-0`
          : isSchedule
            ? `pb-[calc(${SCHEDULE_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1.25rem)] lg:pb-0`
            : isAppointments
              ? `pb-[calc(${APPOINTMENTS_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1.25rem)] lg:pb-0`
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
    <div className={`flex min-h-dvh text-[#111827] ${pageShellBg} ${desktopCanvasBg}`}>
      <AdminDesktopSidebar />

      <div
        className={`relative flex min-h-dvh min-w-0 flex-1 flex-col ${desktopMainCanvasBg} ${
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

          <AdminDesktopTopBar />

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

        <AdminBottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Разделы">
        <nav className="flex flex-col gap-2 pb-1" aria-label="Разделы кабинета">
          {ADMIN_MAIN_NAV.map((item) => (
            <AdminCabinetNavLink
              key={item.to}
              item={item}
              onClick={() => setMenuOpen(false)}
              className={(isActive) => navClass(isActive)}
            >
              {({ isActive }) => {
                const Icon = item.icon;
                const meta = resolveAdminNavItemMeta(item);
                return (
                  <>
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <Icon className="mt-0.5 shrink-0 opacity-95" />
                      <MobileNavItemText
                        label={item.label}
                        description={meta?.description}
                        active={isActive}
                      />
                    </span>
                    {isActive ? (
                      <span className="shrink-0 self-center text-[12px] font-medium text-white/90" aria-hidden>
                        ●
                      </span>
                    ) : (
                      <span className="w-3 shrink-0 self-center" aria-hidden />
                    )}
                  </>
                );
              }}
            </AdminCabinetNavLink>
          ))}

          <NavLink
            to={ADMIN_NOTIFICATIONS_PATH}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => navClass(isActive)}
          >
            {({ isActive }) => (
              <>
                <span className="flex min-w-0 flex-1 items-start gap-3">
                  <IconNavNotifications className="mt-0.5 shrink-0 opacity-95" />
                  <MobileNavItemText
                    label="Уведомления"
                    description={ADMIN_SECTION_META[ADMIN_NOTIFICATIONS_PATH]?.description}
                    active={isActive}
                  />
                </span>
                {isActive ? (
                  <span className="shrink-0 text-[12px] font-medium text-white/90" aria-hidden>
                    ●
                  </span>
                ) : hasUnread ? (
                  <UnreadBadge count={unreadCount} inverted={false} />
                ) : (
                  <span className="w-3 shrink-0" aria-hidden />
                )}
              </>
            )}
          </NavLink>

          <div className="mt-2 flex flex-col gap-2 border-t border-neutral-200/80 pt-3">
            <NavLink
              to={ADMIN_BILLING_PATH}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => navClass(isActive)}
            >
              {({ isActive }) => {
                const badge = planBadgeLabel(planId);
                return (
                  <>
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <IconNavBilling className="mt-0.5 shrink-0 opacity-95" />
                      <MobileNavItemText
                        label="Мой тариф"
                        description={ADMIN_SECTION_META[ADMIN_BILLING_PATH]?.description}
                        active={isActive}
                      />
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        isActive ? 'bg-white/25 text-white' : 'bg-white text-neutral-600 shadow-[0_2px_8px_rgba(17,17,17,0.06)]'
                      }`}
                    >
                      {badge}
                    </span>
                  </>
                );
              }}
            </NavLink>

            <NavLink
              to={ADMIN_SETTINGS_NAV.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => navClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  <span className="flex min-w-0 flex-1 items-start gap-3">
                    <ADMIN_SETTINGS_NAV.icon className="mt-0.5 shrink-0 opacity-95" />
                    <MobileNavItemText
                      label={ADMIN_SETTINGS_NAV.label}
                      description={ADMIN_SECTION_META[MASTER_SETTINGS_PATH]?.description}
                      active={isActive}
                    />
                  </span>
                  {isActive ? (
                    <span className="shrink-0 self-center text-[12px] font-medium text-white/90" aria-hidden>
                      ●
                    </span>
                  ) : (
                    <span className="w-3 shrink-0 self-center" aria-hidden />
                  )}
                </>
              )}
            </NavLink>

            {showPlatformAdmin ? (
              <NavLink
                to={PLATFORM_ADMIN_PATH}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => navClass(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[15px]" aria-hidden>
                        ✦
                      </span>
                      <MobileNavItemText
                        label="Админка SLOTTY"
                        description="Управление платформой: мастера, жалобы, промокоды"
                        active={isActive}
                      />
                    </span>
                    {isActive ? (
                      <span className="shrink-0 self-center text-[12px] font-medium text-white/90" aria-hidden>
                        ●
                      </span>
                    ) : (
                      <span className="w-3 shrink-0 self-center" aria-hidden />
                    )}
                  </>
                )}
              </NavLink>
            ) : null}
          </div>
        </nav>
      </AdminBottomSheet>

      </div>
    </div>
  );
}
