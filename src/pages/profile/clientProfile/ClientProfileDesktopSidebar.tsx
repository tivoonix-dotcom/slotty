import type { ChangeEvent, RefObject } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  HiBell,
  HiCalendarDays,
  HiCog6Tooth,
  HiHeart,
  HiSparkles,
  HiUser,
} from 'react-icons/hi2';
import {
  BECOME_MASTER_PATH,
  getProfilePath,
  PROFILE_NOTIFICATIONS_PATH,
  PROFILE_PATH,
  PROFILE_SETTINGS_PATH,
} from '../../../app/paths';
import { ClientProfileAvatar } from './ClientProfileAvatar';
import {
  adminDesktopNavItemClass,
  adminDesktopSidebarShell,
  adminSidebarFooterCard,
} from '../../admin/adminCabinetLayout';
import type { ClientProfileMainTab } from './clientCabinetMobileTabs';

export type { ClientProfileMainTab } from './clientCabinetMobileTabs';

const MAIN_TABS: {
  id: ClientProfileMainTab;
  label: string;
  icon: typeof HiCalendarDays;
}[] = [
  { id: 'appointments', label: 'Мои записи', icon: HiCalendarDays },
  { id: 'favorites', label: 'Избранное', icon: HiHeart },
  { id: 'profile', label: 'Профиль', icon: HiUser },
];

function resolveClientProfileTabFromLocation(pathname: string, search: string): ClientProfileMainTab | null {
  if (pathname !== PROFILE_PATH) return null;
  const tab = new URLSearchParams(search).get('tab');
  if (tab === 'favorites') return 'favorites';
  if (tab === 'profile') return 'profile';
  return 'appointments';
}

function SidebarUnreadBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5f7a] px-1.5 text-[10px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

type Props = {
  displayName: string;
  roleSubtitle: string;
  profileInitials: string;
  authLoading: boolean;
  isAuthenticated: boolean;
  avatarPreviewUrl: string | null;
  profileAvatarUrl: string | null;
  telegramPhotoUrl: string | null;
  avatarBusy: boolean;
  avatarErr: string | null;
  avatarFileInputRef: RefObject<HTMLInputElement>;
  onAvatarFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  telegramUserPhotoUrl: string | null;
  onApplyTelegramAvatar: () => void;
  hasNewNotifications: boolean;
  mainTab: ClientProfileMainTab | null;
  onSelectTab: (tab: ClientProfileMainTab) => void;
  isMasterCabinet: boolean;
  clientShell: boolean;
  upcomingCount: number;
  favoritesCount: number;
};

export function ClientProfileDesktopSidebar({
  displayName,
  profileInitials,
  authLoading,
  isAuthenticated,
  avatarPreviewUrl,
  profileAvatarUrl,
  telegramPhotoUrl,
  avatarBusy,
  avatarErr,
  avatarFileInputRef,
  onAvatarFileChange,
  telegramUserPhotoUrl,
  onApplyTelegramAvatar,
  hasNewNotifications,
  mainTab,
  onSelectTab: _onSelectTab,
  isMasterCabinet,
  upcomingCount,
  favoritesCount,
}: Props) {
  const { pathname, search } = useLocation();
  const isNotifications = pathname === PROFILE_NOTIFICATIONS_PATH;
  const isSettings = pathname.startsWith(PROFILE_SETTINGS_PATH);
  const activeTab = resolveClientProfileTabFromLocation(pathname, search) ?? mainTab;

  return (
    <aside className={adminDesktopSidebarShell}>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-3 py-4" aria-label="Кабинет клиента">
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Меню</p>

        {MAIN_TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count =
            tab.id === 'appointments' ? upcomingCount : tab.id === 'favorites' ? favoritesCount : null;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              to={getProfilePath(tab.id)}
              className={adminDesktopNavItemClass(active)}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-[#ff5f7a]' : ''}`} aria-hidden />
              <span className="truncate">{tab.label}</span>
              {count != null && count > 0 ? (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                    active ? 'bg-[#ff5f7a]/15 text-[#ff5f7a]' : 'bg-[#FFF1F4] text-[#ff5f7a]'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}

        <NavLink to={PROFILE_NOTIFICATIONS_PATH} className={adminDesktopNavItemClass(isNotifications)}>
          <HiBell className={`h-5 w-5 shrink-0 ${isNotifications ? 'text-[#ff5f7a]' : ''}`} aria-hidden />
          <span className="truncate">Уведомления</span>
          {hasNewNotifications ? <SidebarUnreadBadge count={1} /> : null}
        </NavLink>

        <NavLink to={PROFILE_SETTINGS_PATH} className={adminDesktopNavItemClass(isSettings)}>
          <HiCog6Tooth className={`h-5 w-5 shrink-0 ${isSettings ? 'text-[#ff5f7a]' : ''}`} aria-hidden />
          <span className="truncate">Настройки</span>
        </NavLink>
      </nav>

      <div className="shrink-0 space-y-2 border-t border-[#EEEEEE] p-3">
        {!isMasterCabinet ? (
          <Link to={BECOME_MASTER_PATH} className={adminSidebarFooterCard}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#ff5f7a]">
              <HiSparkles className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[14px] font-semibold tracking-[-0.02em] text-[#111827]">Стать мастером</p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#6B7280]">Принимайте клиентов в SLOTTY</p>
            </div>
          </Link>
        ) : null}

        <Link to={getProfilePath('profile')} className={adminSidebarFooterCard}>
          <ClientProfileAvatar
            authLoading={authLoading}
            isAuthenticated={isAuthenticated}
            avatarPreviewUrl={avatarPreviewUrl}
            profileAvatarUrl={profileAvatarUrl}
            telegramPhotoUrl={telegramPhotoUrl}
            profileInitials={profileInitials}
            avatarBusy={avatarBusy}
            avatarFileInputRef={avatarFileInputRef}
            onAvatarFileChange={onAvatarFileChange}
            size="sm"
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[#111827]">
              {authLoading ? 'Загрузка…' : displayName}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-[#6B7280]">Клиент</p>
          </div>
        </Link>

        {avatarErr ? (
          <p className="px-1 text-[12px] font-medium text-red-600">{avatarErr}</p>
        ) : null}

        {isAuthenticated && telegramUserPhotoUrl ? (
          <button
            type="button"
            disabled={avatarBusy}
            onClick={onApplyTelegramAvatar}
            className="w-full rounded-[10px] bg-[#F6F7FB] px-3 py-2 text-[12px] font-semibold text-[#374151] transition hover:bg-[#F1EFEF] disabled:opacity-50"
          >
            Обновить фото из Telegram
          </button>
        ) : null}
      </div>
    </aside>
  );
}
