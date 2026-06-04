import type { ReactNode } from 'react';
import {
  MASTER_SETTINGS_ABOUT_PATH,
  MASTER_SETTINGS_BILLING_PATH,
  MASTER_SETTINGS_INTEGRATIONS_PATH,
  MASTER_SETTINGS_NOTIFICATIONS_PATH,
  MASTER_SETTINGS_PRIVACY_PATH,
  MASTER_SETTINGS_SECURITY_PATH,
  MASTER_SETTINGS_SUPPORT_PATH,
  MASTER_SETTINGS_TEAM_PATH,
} from '../../../../app/paths';

export type SettingsNavItem = {
  id: string;
  to: string;
  label: string;
  keywords: string[];
  badge?: string;
  disabled?: boolean;
  icon: (p: { className?: string }) => ReactNode;
};

const stroke = { strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconCard({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconPlug({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <path d="M12 22v-5M9 8V2M15 8V2M7 8h10v4a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V8z" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconLife({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function IconHelp({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  );
}

export type SettingsNavGroup = {
  id: string;
  label: string;
  items: SettingsNavItem[];
};

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    id: 'account',
    label: 'Аккаунт',
    items: [
      {
        id: 'security',
        to: MASTER_SETTINGS_SECURITY_PATH,
        label: 'Способы входа и безопасность',
        keywords: ['вход', 'telegram', 'google', 'email', 'сессии', 'безопасность'],
        icon: IconShield,
      },
      {
        id: 'notifications',
        to: MASTER_SETTINGS_NOTIFICATIONS_PATH,
        label: 'Уведомления',
        keywords: ['уведомления', 'telegram', 'email', 'запись'],
        icon: IconBell,
      },
    ],
  },
  {
    id: 'business',
    label: 'Бизнес',
    items: [
      {
        id: 'billing',
        to: MASTER_SETTINGS_BILLING_PATH,
        label: 'Биллинг и тариф',
        keywords: ['тариф', 'pro', 'оплата', 'подписка'],
        icon: IconCard,
      },
      {
        id: 'team',
        to: MASTER_SETTINGS_TEAM_PATH,
        label: 'Команда и доступ',
        keywords: ['команда', 'сотрудники', 'роли'],
        badge: 'В разработке',
        disabled: true,
        icon: IconUsers,
      },
      {
        id: 'integrations',
        to: MASTER_SETTINGS_INTEGRATIONS_PATH,
        label: 'Интеграции',
        keywords: ['telegram', 'google', 'календарь', 'карты'],
        icon: IconPlug,
      },
    ],
  },
  {
    id: 'data',
    label: 'Данные',
    items: [
      {
        id: 'privacy',
        to: MASTER_SETTINGS_PRIVACY_PATH,
        label: 'Данные и приватность',
        keywords: ['экспорт', 'удаление', 'приватность', 'согласия'],
        icon: IconLock,
      },
    ],
  },
  {
    id: 'support',
    label: 'Поддержка',
    items: [
      {
        id: 'support',
        to: MASTER_SETTINGS_SUPPORT_PATH,
        label: 'Поддержка',
        keywords: ['faq', 'помощь', 'проблема'],
        icon: IconHelp,
      },
      {
        id: 'about',
        to: MASTER_SETTINGS_ABOUT_PATH,
        label: 'О системе',
        keywords: ['версия', 'build', 'соглашение'],
        icon: IconLife,
      },
    ],
  },
];

export const SETTINGS_PAGE_META: Record<
  string,
  { title: string; description: string; breadcrumb: string }
> = {
  security: {
    title: 'Способы входа и безопасность',
    description: 'Управляйте способами входа, резервным доступом и активными сессиями.',
    breadcrumb: 'Способы входа и безопасность',
  },
  notifications: {
    title: 'Уведомления',
    description: 'Настройте, где и о каких событиях SLOTTY будет вас уведомлять.',
    breadcrumb: 'Уведомления',
  },
  billing: {
    title: 'Биллинг и тариф',
    description: 'Управляйте подпиской, оплатой и историей платежей.',
    breadcrumb: 'Биллинг и тариф',
  },
  team: {
    title: 'Команда и доступ',
    description: 'Скоро здесь можно будет приглашать сотрудников и управлять правами.',
    breadcrumb: 'Команда и доступ',
  },
  integrations: {
    title: 'Интеграции',
    description: 'Подключайте сервисы, которые помогают принимать записи и отправлять уведомления.',
    breadcrumb: 'Интеграции',
  },
  privacy: {
    title: 'Данные и приватность',
    description: 'Экспорт данных, видимость профиля и управление согласиями.',
    breadcrumb: 'Данные и приватность',
  },
  support: {
    title: 'Поддержка',
    description: 'FAQ, обращения в поддержку и статус сервиса.',
    breadcrumb: 'Поддержка',
  },
  about: {
    title: 'О системе',
    description: 'Версия приложения, окружение и юридические документы.',
    breadcrumb: 'О системе',
  },
};

export function resolveSettingsPageId(pathname: string): string {
  const seg = pathname.replace(/\/+$/, '').split('/').pop() ?? 'security';
  return SETTINGS_PAGE_META[seg] ? seg : 'security';
}

export function flattenSettingsNavItems(): SettingsNavItem[] {
  return SETTINGS_NAV_GROUPS.flatMap((g) => g.items);
}
