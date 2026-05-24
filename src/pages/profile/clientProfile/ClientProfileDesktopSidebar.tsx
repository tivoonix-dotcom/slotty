import type { ChangeEvent, RefObject } from 'react';
import { Link } from 'react-router-dom';
import { HiBell, HiCog6Tooth, HiSparkles } from 'react-icons/hi2';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { ADMIN_PATH, BECOME_MASTER_PATH, PROFILE_NOTIFICATIONS_PATH, PROFILE_SETTINGS_PATH } from '../../../app/paths';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import {
  catalogDesktopPanel,
  catalogSectionTabActive,
  catalogSectionTabIdle,
} from './clientProfileTheme';

export type ClientProfileMainTab = 'appointments' | 'favorites' | 'profile';

const MAIN_TABS: { id: ClientProfileMainTab; label: string }[] = [
  { id: 'appointments', label: 'Мои записи' },
  { id: 'favorites', label: 'Избранное' },
  { id: 'profile', label: 'Профиль' },
];

type Props = {
  displayName: string;
  roleSubtitle: string;
  initialLetter: string;
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
  mainTab: ClientProfileMainTab;
  onSelectTab: (tab: ClientProfileMainTab) => void;
  isMasterCabinet: boolean;
  clientShell: boolean;
  upcomingCount: number;
  favoritesCount: number;
};

export function ClientProfileDesktopSidebar({
  displayName,
  roleSubtitle,
  initialLetter,
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
  onSelectTab,
  isMasterCabinet,
  clientShell,
  upcomingCount,
  favoritesCount,
}: Props) {
  return (
    <aside className="flex min-h-0 flex-col gap-4">
      {clientShell && isMasterCabinet ? (
        <Link
          to={ADMIN_PATH}
          className={`${catalogDesktopPanel} flex items-center gap-3.5 p-4 transition hover:bg-[#FAFAFA]`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#F5F5F5]">
            <img
              src={HEADER_LOGO_SRC}
              alt="SLOTTY"
              width={44}
              height={44}
              decoding="async"
              className="h-9 w-auto origin-center object-contain [transform:scale(1.65)]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-[#111827]">Вы мастер</p>
            <p className="mt-0.5 text-[13px] text-[#6B7280]">Перейти в кабинет</p>
          </div>
        </Link>
      ) : null}

      <div className={`${catalogDesktopPanel} p-5`}>
        {authLoading ? (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-[14px] bg-[#EBEBEB]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 max-w-[10rem] animate-pulse rounded-full bg-[#EBEBEB]" />
              <div className="h-4 max-w-[7rem] animate-pulse rounded-full bg-[#EBEBEB]" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={onAvatarFileChange}
                />
                <button
                  type="button"
                  disabled={!isAuthenticated || avatarBusy}
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="group relative flex h-16 w-16 overflow-hidden rounded-[14px] bg-[#F47C8C] text-xl font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Загрузить фото профиля"
                >
                  {avatarPreviewUrl ? (
                    <ImageReveal src={avatarPreviewUrl} alt="" className="h-full w-full object-cover" loading="eager" />
                  ) : profileAvatarUrl ? (
                    <ImageReveal src={profileAvatarUrl} alt="" className="h-full w-full object-cover" loading="eager" />
                  ) : telegramPhotoUrl ? (
                    <ImageReveal
                      src={optimizeAvatarUrl(telegramPhotoUrl, 128)}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">{initialLetter}</span>
                  )}
                </button>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-[18px] font-bold tracking-[-0.03em] text-[#111827]">{displayName}</p>
                <p className="mt-0.5 text-[14px] text-[#6B7280]">{roleSubtitle}</p>
              </div>
            </div>

            {avatarErr ? (
              <p className="mt-3 text-[13px] font-medium text-red-600">{avatarErr}</p>
            ) : null}

            {isAuthenticated && telegramUserPhotoUrl ? (
              <button
                type="button"
                disabled={avatarBusy}
                onClick={onApplyTelegramAvatar}
                className="mt-3 w-full rounded-[10px] bg-[#F5F5F5] px-3 py-2 text-[12px] font-semibold text-[#374151] transition hover:bg-[#EBEBEB] disabled:opacity-50"
              >
                Обновить фото из Telegram
              </button>
            ) : null}

            <div className="mt-4 flex gap-2">
              <Link
                to={PROFILE_NOTIFICATIONS_PATH}
                className="relative flex flex-1 min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#F5F5F5] text-[14px] font-semibold text-[#374151] transition hover:bg-[#EBEBEB]"
              >
                <HiBell className="h-4 w-4" />
                Уведомления
                {hasNewNotifications ? (
                  <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-[#F47C8C]" aria-hidden />
                ) : null}
              </Link>
              <Link
                to={PROFILE_SETTINGS_PATH}
                aria-label="Настройки"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#374151] transition hover:bg-[#EBEBEB]"
              >
                <HiCog6Tooth className="h-5 w-5" />
              </Link>
            </div>
          </>
        )}
      </div>

      <nav className={`${catalogDesktopPanel} flex flex-col gap-2 p-2`} aria-label="Разделы профиля">
        {MAIN_TABS.map((tab) => {
          const active = mainTab === tab.id;
          const count =
            tab.id === 'appointments' ? upcomingCount : tab.id === 'favorites' ? favoritesCount : null;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex w-full min-h-11 items-center justify-between rounded-[10px] px-4 py-2.5 text-left text-[14px] transition ${
                active ? catalogSectionTabActive : catalogSectionTabIdle
              }`}
            >
              <span>{tab.label}</span>
              {count != null && count > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-[#EBEBEB] text-[#374151]'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {!(clientShell && isMasterCabinet) ? (
        <Link
          to={isMasterCabinet ? ADMIN_PATH : BECOME_MASTER_PATH}
          className={`${catalogDesktopPanel} flex items-center gap-3 p-4 transition hover:bg-[#FAFAFA]`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF1F4] text-[#F47C8C]">
            <HiSparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#111827]">
              {isMasterCabinet ? 'Кабинет мастера' : 'Стать мастером'}
            </p>
            <p className="mt-0.5 text-[12px] text-[#6B7280]">
              {isMasterCabinet ? 'Управление записями и услугами' : 'Принимайте клиентов в SLOTTY'}
            </p>
          </div>
        </Link>
      ) : null}
    </aside>
  );
}
