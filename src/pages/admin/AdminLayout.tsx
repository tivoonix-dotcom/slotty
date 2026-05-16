import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_BILLING_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_SERVICES_PATH,
  HUB_PATH,
} from '../../app/paths';
import { getCurrentMasterPlan, planBadgeLabel } from '../../features/billing/model/masterPlans';
import { AdminMasterCabinetProvider, useAdminMasterCabinet } from './AdminMasterCabinetContext';
import { AdminBottomSheet } from './shared/AdminBottomSheet';

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

function AdminCabinetStatusBanner() {
  const { cabinetLoading, cabinetError, useCabinetApi } = useAdminMasterCabinet();
  if (!useCabinetApi) return null;
  if (!cabinetLoading && !cabinetError) return null;
  return (
    <div className="px-4 pb-2">
      {cabinetLoading ? (
        <p className="rounded-2xl bg-white px-4 py-2 text-center text-[13px] font-medium text-neutral-500 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
          Загрузка данных мастера…
        </p>
      ) : null}
      {cabinetError ? (
        <p className="mt-2 rounded-2xl bg-[#FFF0F0] px-4 py-2 text-center text-[13px] font-semibold text-[#9B2C2C] shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
          {cabinetError}
        </p>
      ) : null}
    </div>
  );
}

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-white pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-[#111827]">
      <AdminMasterCabinetProvider>
        <div className="mx-auto max-w-lg">
          <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white/95 px-4 pb-3 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] backdrop-blur-md">
            <Link
              to={HUB_PATH}
              aria-label="SLOTTY — на главную"
              className="inline-flex h-9 min-h-11 shrink-0 items-center overflow-visible py-1 outline-none ring-0 transition hover:opacity-60 active:scale-[0.99] sm:h-10"
            >
              <img
                src={HEADER_LOGO_SRC}
                alt=""
                decoding="async"
                fetchPriority="low"
                className="h-9 w-auto origin-center object-contain [transform:translateY(0.25rem)_scale(1.56)] sm:h-10 sm:[transform:translateY(0.35rem)_scale(1.5)]"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7F7F8] text-[#111827] transition hover:bg-[#F3F4F6] active:scale-[0.97]"
              aria-label="Меню разделов"
              aria-expanded={menuOpen}
            >
              <IconBurger className="text-neutral-800" />
            </button>
          </div>

          <AdminCabinetStatusBanner />
          <Outlet />
        </div>
      </AdminMasterCabinetProvider>

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

          <div className="mt-2 border-t border-neutral-200/80 pt-3">
            <NavLink
              to={ADMIN_BILLING_PATH}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => navClass(isActive)}
            >
              {({ isActive }) => {
                const plan = getCurrentMasterPlan();
                const badge = planBadgeLabel(plan.plan);
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
          </div>
        </nav>
      </AdminBottomSheet>
    </div>
  );
}
