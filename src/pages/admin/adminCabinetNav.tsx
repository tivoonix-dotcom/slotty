import type { ReactNode } from 'react';
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

const iconStroke = { strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function IconNavProfile({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconNavOverview({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M3 3v18h18" />
      <path d="M7 16V11" />
      <path d="M12 16V8" />
      <path d="M17 16V13" />
    </svg>
  );
}

export function IconNavServices({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

export function IconNavSchedule({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function IconNavAppointments({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 2v4M15 2v4M8 6h8" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

export function IconNavBilling({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconNavSupport({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function IconNavDocuments({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export function IconNavNotifications({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export type AdminNavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: (p: { className?: string }) => ReactNode;
};

export const ADMIN_MAIN_NAV: AdminNavItem[] = [
  { to: ADMIN_PATH, label: 'Профиль мастера', end: true, icon: IconNavProfile },
  { to: ADMIN_OVERVIEW_PATH, label: 'Сводка', icon: IconNavOverview },
  { to: ADMIN_SERVICES_PATH, label: 'Услуги', icon: IconNavServices },
  { to: ADMIN_SCHEDULE_PATH, label: 'Окна', icon: IconNavSchedule },
  { to: ADMIN_APPOINTMENTS_PATH, label: 'Записи', icon: IconNavAppointments },
];

export const ADMIN_NOTIFICATIONS_NAV = {
  to: ADMIN_NOTIFICATIONS_PATH,
  label: 'Уведомления',
  icon: IconNavNotifications,
};

export const ADMIN_BILLING_NAV = {
  to: ADMIN_BILLING_PATH,
  label: 'Мой тариф',
  icon: IconNavBilling,
};

export const ADMIN_LOGIN_METHODS_NAV = {
  to: ADMIN_LOGIN_METHODS_PATH,
  label: 'Способы входа',
  icon: IconNavProfile,
};

export const ADMIN_HUB_PATH = HUB_PATH;

export const ADMIN_PAGE_TITLES: Record<string, string> = {
  [ADMIN_PATH]: 'Профиль мастера',
  [ADMIN_PROFILE_COMPLETION_PATH]: 'Заполненность профиля',
  [ADMIN_OVERVIEW_PATH]: 'Сводка',
  [ADMIN_SERVICES_PATH]: 'Услуги',
  [ADMIN_SCHEDULE_PATH]: 'Окна записи',
  [ADMIN_APPOINTMENTS_PATH]: 'Записи',
  [ADMIN_BILLING_PATH]: 'Мой тариф',
  [ADMIN_NOTIFICATIONS_PATH]: 'Уведомления',
  [ADMIN_LOGIN_METHODS_PATH]: 'Способы входа',
};
