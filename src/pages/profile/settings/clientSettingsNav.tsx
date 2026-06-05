import type { ReactNode } from 'react';
import {
  PROFILE_SETTINGS_DOCUMENTS_PATH,
  PROFILE_SETTINGS_LOGIN_METHODS_PATH,
  PROFILE_SETTINGS_PRIVACY_PATH,
  PROFILE_SETTINGS_SUPPORT_PATH,
  PROFILE_SETTINGS_SYSTEM_STATUS_PATH,
} from '../../../app/paths';

const stroke = { strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

function IconHelp({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  );
}

function IconStatus({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M8 12h8" />
    </svg>
  );
}

function IconDocs({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export type ClientSettingsNavItem = {
  id: string;
  to: string;
  label: string;
  icon: (p: { className?: string }) => ReactNode;
  matchPrefix?: boolean;
};

export type ClientSettingsNavGroup = {
  id: string;
  label: string;
  items: ClientSettingsNavItem[];
};

export const CLIENT_SETTINGS_NAV_GROUPS: ClientSettingsNavGroup[] = [
  {
    id: 'account',
    label: 'Аккаунт',
    items: [
      {
        id: 'security',
        to: PROFILE_SETTINGS_LOGIN_METHODS_PATH,
        label: 'Способы входа и безопасность',
        icon: IconShield,
      },
      {
        id: 'privacy',
        to: PROFILE_SETTINGS_PRIVACY_PATH,
        label: 'Данные и приватность',
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
        to: PROFILE_SETTINGS_SUPPORT_PATH,
        label: 'Поддержка',
        icon: IconHelp,
        matchPrefix: true,
      },
      {
        id: 'system-status',
        to: PROFILE_SETTINGS_SYSTEM_STATUS_PATH,
        label: 'Статус системы',
        icon: IconStatus,
      },
    ],
  },
  {
    id: 'legal',
    label: 'Документы',
    items: [
      {
        id: 'documents',
        to: PROFILE_SETTINGS_DOCUMENTS_PATH,
        label: 'Условия и согласия',
        icon: IconDocs,
      },
    ],
  },
];

export const CLIENT_SETTINGS_PAGE_META: Record<
  string,
  { title: string; description: string; breadcrumb: string }
> = {
  security: {
    title: 'Способы входа и безопасность',
    description: 'Управляйте способами входа, резервным доступом и активными сессиями.',
    breadcrumb: 'Способы входа и безопасность',
  },
  privacy: {
    title: 'Данные и приватность',
    description: 'Экспорт данных, согласия и удаление аккаунта.',
    breadcrumb: 'Данные и приватность',
  },
  support: {
    title: 'Поддержка',
    description: 'Свяжитесь с командой SLOTTY, если нужна помощь с записью или аккаунтом.',
    breadcrumb: 'Поддержка',
  },
  'system-status': {
    title: 'Статус системы',
    description: 'Доступность сервисов SLOTTY и текущие инциденты.',
    breadcrumb: 'Статус системы',
  },
  documents: {
    title: 'Документы',
    description: 'Условия пользования, политика конфиденциальности и согласия.',
    breadcrumb: 'Документы',
  },
};

export function resolveClientSettingsPageId(pathname: string): string {
  if (pathname.includes('/system-status')) return 'system-status';
  if (pathname.includes('/privacy')) return 'privacy';
  if (pathname.includes('/documents')) return 'documents';
  if (pathname.includes('/support')) return 'support';
  if (pathname.includes('/login-methods')) return 'security';
  return 'security';
}
