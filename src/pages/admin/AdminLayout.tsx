import type { CSSProperties } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_BILLING_PATH,
  ADMIN_LOGIN_METHODS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PROFILE_COMPLETION_PATH,
  ADMIN_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_SERVICES_PATH,
  HUB_PATH,
} from '../../app/paths';
import { AdminNotificationsProvider, useAdminNotifications } from './notifications/AdminNotificationsContext';
import { planBadgeLabel } from '../../features/billing/model/masterPlans';
import { useMasterPlanEntitlements } from '../../features/billing/useMasterPlanEntitlements';
import { AdminMasterCabinetProvider, useAdminMasterCabinet } from './AdminMasterCabinetContext';
import { ProfileSectionTabsBar, ProfileTabProvider } from './profile/profileTabContext';
import { ADMIN_CABINET_SHELL_MAX } from './overview/adminOverviewTheme';
import { ADMIN_DESKTOP_CANVAS } from './adminCabinetLayout';
import {
  ADMIN_LOGIN_METHODS_NAV,
  ADMIN_MAIN_NAV,
  IconNavBilling,
  IconNavNotifications,
  IconNavSupport,
  IconNavDocuments,
} from './adminCabinetNav';
import { AdminDesktopSidebar } from './AdminDesktopSidebar';
import { AdminDesktopTopBar } from './AdminDesktopTopBar';
import { ProfileCompletionHeaderCard } from './profile/ProfileCompletionHeaderCard';
import { SERVICES_PAGE_BG, SERVICES_TAB_BAR_HEIGHT } from './services/adminServicesTheme';
import { APPOINTMENTS_TAB_BAR_HEIGHT } from './appointments/adminAppointmentsTheme';
import { SCHEDULE_TAB_BAR_HEIGHT } from './schedule/adminScheduleTheme';
import { ClientSettingsSheet } from '../profile/components/ClientSettingsSheet';
import { AdminBottomSheet } from './shared/AdminBottomSheet';
import { AdminRouteTransitionOutlet } from './shared/AdminRouteTransitionOutlet';
import { AdminContentLoadingOverlay } from './shared/AdminContentLoadingOverlay';
import { LOADING_VIDEO_SRC } from '../../shared/ui/loadingVideoSrc';

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

function IconBurger({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function navClass(active: boolean): string {
  return `flex min-h-12 w-full items-center justify-between gap-3 rounded-full px-4 text-left text-[15px] font-semibold transition active:scale-[0.99] ${
    active ? 'bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.25)]' : 'bg-[#F1EFEF] text-neutral-900'
  }`;
}

export function AdminCabinetStatusBanner() {
  const { cabinetError, useCabinetApi } = useAdminMasterCabinet();
  if (!useCabinetApi || !cabinetError) return null;
  return (
    <div className={`mx-auto w-full min-w-0 px-4 pb-2 pt-2 lg:max-w-none lg:px-8 ${ADMIN_CABINET_SHELL_MAX}`}>
      <p className="rounded-2xl bg-[#FFF0F0] px-4 py-2 text-center text-[13px] font-semibold text-[#9B2C2C] shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
        {cabinetError}
      </p>
    </div>
  );
}

function AdminCabinetLoadingGate() {
  const { cabinetLoading, useCabinetApi } = useAdminMasterCabinet();
  return <AdminContentLoadingOverlay show={Boolean(useCabinetApi && cabinetLoading)} />;
}

type SettingsSheetView = 'support' | 'documents' | null;

export function AdminLayout() {
  return (
    <AdminMasterCabinetProvider>
      <AdminNotificationsProvider>
        <AdminLayoutInner />
      </AdminNotificationsProvider>
    </AdminMasterCabinetProvider>
  );
}

function AdminLayoutInner() {
  const { planId } = useMasterPlanEntitlements();
  const { hasUnread, unreadCount } = useAdminNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsSheet, setSettingsSheet] = useState<SettingsSheetView>(null);
  const stickyShellRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const isProfileHome = pathname === ADMIN_PATH;
  const isProfileCompletion = pathname === ADMIN_PROFILE_COMPLETION_PATH;
  const isOverview = pathname === ADMIN_OVERVIEW_PATH;
  const isServices = pathname === ADMIN_SERVICES_PATH;
  const isSchedule = pathname === ADMIN_SCHEDULE_PATH;
  const isAppointments = pathname === ADMIN_APPOINTMENTS_PATH;
  const isNotifications = pathname === ADMIN_NOTIFICATIONS_PATH;

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

  const shellPadBottom = isProfileHome || isOverview || isProfileCompletion
    ? 'pb-6 lg:pb-0'
    : isServices
        ? `pb-[calc(${SERVICES_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1.25rem)] lg:pb-0`
        : isSchedule
          ? `pb-[calc(${SCHEDULE_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1.25rem)] lg:pb-0`
          : isAppointments
            ? `pb-[calc(${APPOINTMENTS_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1.25rem)] lg:pb-0`
            : 'lg:pb-8';

  const pageShellBg =
    isOverview || isServices || isSchedule || isAppointments || isProfileCompletion
      ? SERVICES_PAGE_BG
      : 'bg-white';

  const desktopCanvasBg =
    isProfileHome
      ? 'lg:bg-[#f6f7fb]'
      : isOverview || isServices || isSchedule || isAppointments || isProfileCompletion
        ? 'lg:bg-white'
        : 'lg:bg-[#f6f7fb]';

  return (
    <div className={`flex min-h-dvh text-[#111827] ${pageShellBg} ${desktopCanvasBg}`}>
      <AdminDesktopSidebar
        onSupport={() => setSettingsSheet('support')}
        onDocuments={() => setSettingsSheet('documents')}
      />

      <div className={`relative flex min-h-dvh min-w-0 flex-1 flex-col ${ADMIN_DESKTOP_CANVAS}`}>
        <AdminCabinetLoadingGate />
        <ProfileTabProvider>
          <div
            ref={stickyShellRef}
            className="sticky top-0 z-40 w-full min-w-0 bg-white lg:hidden"
            style={
              {
                '--slotty-admin-header-h': '5.25rem',
              } as CSSProperties
            }
          >
            <div
              className={`mx-auto flex w-full min-w-0 ${ADMIN_CABINET_SHELL_MAX} items-center justify-between gap-3 px-4 pb-1 pt-[calc(0.25rem+env(safe-area-inset-top,0px))]`}
            >
                <Link
                  to={HUB_PATH}
                  aria-label="SLOTTY — на главную"
                  className="inline-flex h-20 min-h-20 shrink-0 items-center overflow-hidden outline-none ring-0 transition hover:opacity-60 active:scale-[0.99] sm:h-[5.5rem] sm:min-h-[5.5rem]"
                >
                  <img
                    src={HEADER_LOGO_SRC}
                    alt=""
                    decoding="async"
                    fetchPriority="low"
                    className="h-20 w-auto max-w-[min(20rem,70vw)] object-contain object-left sm:h-[5.5rem] sm:max-w-[22rem]"
                  />
                </Link>
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <ProfileCompletionHeaderCard variant="header" className="hidden min-[380px]:flex" />
                  <Link
                    to={ADMIN_NOTIFICATIONS_PATH}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition active:scale-[0.97] ${
                      isNotifications
                        ? 'bg-[#FFF1F4] text-[#F47C8C]'
                        : 'bg-[#F3F4F6] text-[#111827] hover:bg-[#E4E7EC]'
                    }`}
                    aria-label={
                      hasUnread ? `Уведомления, ${unreadCount} новых` : 'Уведомления'
                    }
                  >
                    <IconNavNotifications />
                    {hasUnread ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F47C8C] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
                        aria-hidden
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3F4F6] text-[#111827] transition hover:bg-[#E4E7EC] active:scale-[0.97]"
                    aria-label="Меню разделов"
                    aria-expanded={menuOpen}
                  >
                    <IconBurger className="text-neutral-800" />
                  </button>
                </div>
              </div>
            <div className={`mx-auto w-full min-w-0 px-4 pb-2 min-[380px]:hidden ${ADMIN_CABINET_SHELL_MAX}`}>
              <ProfileCompletionHeaderCard variant="header" className="max-w-none w-full" />
            </div>
            <div className="w-full border-b-2 border-[#F47C8C]" aria-hidden />
          </div>

          <AdminDesktopTopBar />

          {!isProfileHome ? <AdminCabinetStatusBanner /> : null}

          <div className={`mx-auto w-full min-w-0 flex-1 ${ADMIN_CABINET_SHELL_MAX} ${shellPadBottom}`}>
            <div
              className={`w-full min-w-0 px-4 pt-4 lg:mx-auto lg:max-w-6xl lg:px-8 lg:pb-8 lg:pt-6 ${
                isProfileHome || isOverview || isProfileCompletion
                  ? 'lg:bg-transparent lg:shadow-none lg:ring-0'
                  : 'lg:rounded-[24px] lg:bg-white lg:shadow-[0_4px_24px_rgba(17,24,39,0.06)] lg:ring-1 lg:ring-[#EAECEF]'
              }`}
            >
              <AdminRouteTransitionOutlet />
            </div>
            <ProfileSectionTabsBar />
          </div>
        </ProfileTabProvider>

        <AdminBottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Разделы">
        <nav className="flex flex-col gap-2 pb-1" aria-label="Разделы кабинета">
          {ADMIN_MAIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => navClass(isActive)}
            >
              {({ isActive }) => {
                const Icon = item.icon;
                return (
                  <>
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <Icon className="shrink-0 opacity-95" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {isActive ? (
                      <span className="shrink-0 text-[12px] font-medium text-white/90" aria-hidden>
                        ●
                      </span>
                    ) : (
                      <span className="w-3 shrink-0" aria-hidden />
                    )}
                  </>
                );
              }}
            </NavLink>
          ))}

          <NavLink
            to={ADMIN_NOTIFICATIONS_PATH}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => navClass(isActive)}
          >
            {({ isActive }) => (
              <>
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <IconNavNotifications className="shrink-0 opacity-95" />
                  <span className="truncate">Уведомления</span>
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
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <IconNavBilling className="shrink-0 opacity-95" />
                      <span className="truncate">Мой тариф</span>
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
              to={ADMIN_LOGIN_METHODS_PATH}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => navClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <ADMIN_LOGIN_METHODS_NAV.icon className="shrink-0 opacity-95" />
                    <span className="truncate">Способы входа</span>
                  </span>
                  {isActive ? (
                    <span className="shrink-0 text-[12px] font-medium text-white/90" aria-hidden>
                      ●
                    </span>
                  ) : (
                    <span className="w-3 shrink-0" aria-hidden />
                  )}
                </>
              )}
            </NavLink>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setSettingsSheet('support');
              }}
              className={navClass(false)}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <IconNavSupport className="shrink-0 opacity-95" />
                <span className="truncate">Поддержка</span>
              </span>
              <span className="w-3 shrink-0" aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setSettingsSheet('documents');
              }}
              className={navClass(false)}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <IconNavDocuments className="shrink-0 opacity-95" />
                <span className="truncate">Все документы</span>
              </span>
              <span className="w-3 shrink-0" aria-hidden />
            </button>
          </div>
        </nav>
      </AdminBottomSheet>

        <ClientSettingsSheet
          open={settingsSheet !== null}
          initialView={settingsSheet ?? 'menu'}
          directEntry
          onClose={() => setSettingsSheet(null)}
        />
      </div>
    </div>
  );
}
