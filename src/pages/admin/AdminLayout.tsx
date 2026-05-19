import type { CSSProperties, ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_BILLING_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_SERVICES_PATH,
  HUB_PATH,
} from '../../app/paths';
import { AdminNotificationsProvider, useAdminNotifications } from './notifications/AdminNotificationsContext';
import { planBadgeLabel } from '../../features/billing/model/masterPlans';
import { useMasterPlanEntitlements } from '../../features/billing/useMasterPlanEntitlements';
import { AdminMasterCabinetProvider, useAdminMasterCabinet } from './AdminMasterCabinetContext';
import { ProfileSectionTabsBar, ProfileTabProvider, PROFILE_TAB_BAR_HEIGHT } from './profile/profileTabContext';
import { ADMIN_CABINET_SHELL_MAX, OVERVIEW_TAB_BAR_HEIGHT } from './overview/adminOverviewTheme';
import { SERVICES_PAGE_BG, SERVICES_TAB_BAR_HEIGHT } from './services/adminServicesTheme';
import { APPOINTMENTS_TAB_BAR_HEIGHT } from './appointments/adminAppointmentsTheme';
import { SCHEDULE_TAB_BAR_HEIGHT } from './schedule/adminScheduleTheme';
import { ClientSettingsSheet } from '../profile/components/ClientSettingsSheet';
import { AdminBottomSheet } from './shared/AdminBottomSheet';
import { AdminRouteTransitionOutlet } from './shared/AdminRouteTransitionOutlet';
import { LoadingVideo } from '../../shared/ui/LoadingVideo';
import { LOADING_VIDEO_SRC } from '../../shared/ui/loadingVideoSrc';

const iconStroke = { strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function IconNavProfile({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconNavOverview({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M3 3v18h18" />
      <path d="M7 16V11" />
      <path d="M12 16V8" />
      <path d="M17 16V13" />
    </svg>
  );
}

function IconNavServices({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function IconNavSchedule({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconNavAppointments({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 2v4M15 2v4M8 6h8" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function IconNavBilling({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" strokeLinecap="round" />
    </svg>
  );
}

function IconNavSupport({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconNavDocuments({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconNavNotifications({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

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

type MenuItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: (p: { className?: string }) => ReactNode;
};

const MAIN_MENU: MenuItem[] = [
  { to: ADMIN_PATH, label: 'Профиль мастера', end: true, icon: IconNavProfile },
  { to: ADMIN_OVERVIEW_PATH, label: 'Сводка', icon: IconNavOverview },
  { to: ADMIN_SERVICES_PATH, label: 'Услуги', icon: IconNavServices },
  { to: ADMIN_SCHEDULE_PATH, label: 'Окна', icon: IconNavSchedule },
  { to: ADMIN_APPOINTMENTS_PATH, label: 'Записи', icon: IconNavAppointments },
];

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
  const { cabinetLoading, cabinetError, useCabinetApi } = useAdminMasterCabinet();
  if (!useCabinetApi) return null;
  if (!cabinetLoading && !cabinetError) return null;
  return (
    <div className={`mx-auto w-full min-w-0 px-4 pb-2 pt-2 ${ADMIN_CABINET_SHELL_MAX}`}>
      {cabinetLoading ? (
        <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
          <LoadingVideo size="md" />
        </div>
      ) : null}
      {cabinetError ? (
        <p className="mt-2 rounded-2xl bg-[#FFF0F0] px-4 py-2 text-center text-[13px] font-semibold text-[#9B2C2C] shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
          {cabinetError}
        </p>
      ) : null}
    </div>
  );
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

  const shellPadBottom = isProfileHome
    ? 'pb-[calc(var(--slotty-profile-tab-bar-h)+env(safe-area-inset-bottom,0px)+1rem)]'
    : isOverview
      ? `pb-[calc(${OVERVIEW_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1rem)]`
      : isServices
        ? `pb-[calc(${SERVICES_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1.25rem)]`
        : isSchedule
          ? `pb-[calc(${SCHEDULE_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1.25rem)]`
          : isAppointments
            ? `pb-[calc(${APPOINTMENTS_TAB_BAR_HEIGHT}+env(safe-area-inset-bottom,0px)+1.25rem)]`
            : '';

  const pageShellBg =
    isOverview || isServices || isSchedule || isAppointments ? SERVICES_PAGE_BG : 'bg-white';

  return (
    <div
      className={`min-h-dvh pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-[#111827] ${pageShellBg}`}
    >
        <ProfileTabProvider>
          <div
            ref={stickyShellRef}
            className="sticky top-0 z-40 w-full min-w-0 bg-white"
            style={
              {
                '--slotty-admin-header-h': '5.25rem',
                '--slotty-profile-tab-bar-h': PROFILE_TAB_BAR_HEIGHT,
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
                <div className="flex shrink-0 items-center gap-2">
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
            <div className="w-full border-b-2 border-[#F47C8C]" aria-hidden />
          </div>

          {!isProfileHome ? <AdminCabinetStatusBanner /> : null}

          <div className={`mx-auto w-full min-w-0 ${ADMIN_CABINET_SHELL_MAX} ${shellPadBottom}`}>
            <div className="w-full min-w-0 px-4 pt-4">
              <AdminRouteTransitionOutlet />
            </div>
            <ProfileSectionTabsBar />
          </div>
        </ProfileTabProvider>

      <AdminBottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Разделы">
        <nav className="flex flex-col gap-2 pb-1" aria-label="Разделы кабинета">
          {MAIN_MENU.map((item) => (
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
  );
}
