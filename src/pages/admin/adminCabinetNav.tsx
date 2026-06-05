import type { ReactNode } from 'react';
import type { Location } from 'react-router-dom';
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
  getMasterAdminAppointmentsPath,
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

export function IconNavClients({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconNavReviews({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

export function IconNavSponsor({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <path d="M12 3l1.4 4.3H18l-3.6 2.6 1.4 4.3L12 11.6 8.2 14.2l1.4-4.3L6 7.3h4.6L12 3z" />
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

export type AdminSectionMeta = {
  title: string;
  description: string;
};

export const ADMIN_SECTION_META: Record<string, AdminSectionMeta> = {
  [ADMIN_PATH]: {
    title: 'Профиль',
    description:
      'Витрина мастера: имя, фото, портфолио, адрес и правила — то, что клиенты видят в каталоге.',
  },
  [ADMIN_PROFILE_COMPLETION_PATH]: {
    title: 'Заполненность профиля',
    description: 'Чек-лист: что ещё добавить, чтобы профиль был заметнее в каталоге и принимал записи.',
  },
  [ADMIN_SERVICES_PATH]: {
    title: 'Услуги',
    description:
      'Каталог услуг, цены, наборы и акции. Без услуг клиент не сможет выбрать, на что записаться.',
  },
  [ADMIN_SCHEDULE_PATH]: {
    title: 'Расписание',
    description:
      'Создайте окна для записи: когда вы свободны, клиенты смогут выбрать время в каталоге.',
  },
  [ADMIN_OVERVIEW_PATH]: {
    title: 'Сегодня',
    description:
      'Рабочий день: заявки, записи на сегодня, свободные окна и быстрые действия.',
  },
  [ADMIN_APPOINTMENTS_PATH]: {
    title: 'Записи',
    description:
      'Заявки от клиентов, предстоящие визиты и история. Подтверждайте заявки, чтобы они попали в календарь.',
  },
  [`${ADMIN_OVERVIEW_PATH}?tab=clients`]: {
    title: 'Клиенты',
    description: 'Кто записывался, как часто возвращается и сколько приносит выручки.',
  },
  [`${ADMIN_OVERVIEW_PATH}?tab=reputation`]: {
    title: 'Отзывы',
    description: 'Отзывы клиентов и ваши ответы — влияют на доверие в каталоге.',
  },
  [ADMIN_BILLING_PATH]: {
    title: 'Мой тариф',
    description: 'Тариф Free или Pro, лимиты кабинета и оплата подписки.',
  },
  [ADMIN_NOTIFICATIONS_PATH]: {
    title: 'Уведомления',
    description: 'Новые заявки, изменения записей и важные события по вашему кабинету.',
  },
  [MASTER_SETTINGS_PATH]: {
    title: 'Настройки',
    description: 'Безопасность, уведомления, тариф и оплата, интеграции и поддержка.',
  },
};

export function resolveAdminSectionMeta(pathname: string): AdminSectionMeta | null {
  if (pathname.startsWith(MASTER_SETTINGS_PATH)) {
    return ADMIN_SECTION_META[MASTER_SETTINGS_PATH];
  }
  if (ADMIN_SECTION_META[pathname]) return ADMIN_SECTION_META[pathname];
  return null;
}

function overviewNavTabFromTo(to: string): 'summary' | 'clients' | 'reputation' | null {
  const [pathname, search = ''] = to.split('?');
  if (pathname !== ADMIN_OVERVIEW_PATH) return null;
  const tab = new URLSearchParams(search).get('tab');
  if (tab === 'clients' || tab === 'reputation') return tab;
  return 'summary';
}

function pathnameMatchesNavItem(item: AdminNavItem, pathname: string): boolean {
  const pathOnly = item.to.split('?')[0] ?? item.to;
  if (item.end) return pathname === pathOnly;
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

/** NavLink active state: overview sidebar items share one pathname and differ by ?tab=. */
export function isAdminNavItemActive(item: AdminNavItem, location: Location): boolean {
  const overviewTab = overviewNavTabFromTo(item.to);
  if (overviewTab !== null) {
    if (location.pathname !== ADMIN_OVERVIEW_PATH) return false;
    const currentTab = new URLSearchParams(location.search).get('tab') ?? 'summary';
    return currentTab === overviewTab;
  }
  return pathnameMatchesNavItem(item, location.pathname);
}

type AdminCabinetNavLinkProps = {
  item: AdminNavItem;
  className: (active: boolean) => string;
  children: (props: { isActive: boolean }) => ReactNode;
  onClick?: () => void;
  title?: string;
};

export function AdminCabinetNavLink({ item, className, children, onClick, title }: AdminCabinetNavLinkProps) {
  const location = useLocation();
  const isActive = isAdminNavItemActive(item, location);

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      title={title}
      className={className(isActive)}
      aria-current={isActive ? 'page' : undefined}
    >
      {children({ isActive })}
    </NavLink>
  );
}

export function resolveAdminNavItemMeta(item: AdminNavItem): AdminSectionMeta | null {
  if (ADMIN_SECTION_META[item.to]) return ADMIN_SECTION_META[item.to];

  const pathname = item.to.split('?')[0] ?? item.to;
  if (pathname === ADMIN_APPOINTMENTS_PATH) {
    return ADMIN_SECTION_META[ADMIN_APPOINTMENTS_PATH];
  }

  return ADMIN_SECTION_META[pathname] ?? null;
}

export const ADMIN_MAIN_NAV: AdminNavItem[] = [
  {
    to: getMasterAdminAppointmentsPath({ tab: 'requests' }),
    label: 'Заявки',
    icon: IconNavAppointments,
  },
  { to: ADMIN_SCHEDULE_PATH, label: 'Расписание', icon: IconNavSchedule },
  { to: ADMIN_SERVICES_PATH, label: 'Услуги', icon: IconNavServices },
  { to: ADMIN_PATH, label: 'Профиль', end: true, icon: IconNavProfile },
  { to: `${ADMIN_OVERVIEW_PATH}?tab=clients`, label: 'Клиенты', icon: IconNavClients },
  { to: `${ADMIN_OVERVIEW_PATH}?tab=reputation`, label: 'Отзывы', icon: IconNavReviews },
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

export function IconNavSettings({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...iconStroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export const ADMIN_SETTINGS_NAV = {
  to: MASTER_SETTINGS_PATH,
  label: 'Настройки',
  icon: IconNavSettings,
};

export const ADMIN_HUB_PATH = HUB_PATH;

export const ADMIN_PAGE_TITLES: Record<string, string> = {
  [ADMIN_PATH]: ADMIN_SECTION_META[ADMIN_PATH].title,
  [ADMIN_PROFILE_COMPLETION_PATH]: ADMIN_SECTION_META[ADMIN_PROFILE_COMPLETION_PATH].title,
  [ADMIN_OVERVIEW_PATH]: ADMIN_SECTION_META[ADMIN_OVERVIEW_PATH].title,
  [ADMIN_SERVICES_PATH]: ADMIN_SECTION_META[ADMIN_SERVICES_PATH].title,
  [ADMIN_SCHEDULE_PATH]: ADMIN_SECTION_META[ADMIN_SCHEDULE_PATH].title,
  [ADMIN_APPOINTMENTS_PATH]: ADMIN_SECTION_META[ADMIN_APPOINTMENTS_PATH].title,
  [ADMIN_BILLING_PATH]: ADMIN_SECTION_META[ADMIN_BILLING_PATH].title,
  [ADMIN_NOTIFICATIONS_PATH]: ADMIN_SECTION_META[ADMIN_NOTIFICATIONS_PATH].title,
  [MASTER_SETTINGS_PATH]: ADMIN_SECTION_META[MASTER_SETTINGS_PATH].title,
};
