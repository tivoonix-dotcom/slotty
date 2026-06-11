import type { ChangeEvent, RefObject } from 'react';
import { useLayoutEffect, useRef } from 'react';
import type { DemoAppointmentRecord, DemoAppointmentTab } from '../../../features/appointments/model/demoAppointments';
import type { FavoriteMasterDto } from '../../../features/profile/api/clientFavorites';
import type { BackendProfile } from '../../../features/auth/types';
import {
  adminDesktopCabinetBody,
  adminDesktopCabinetMainColumn,
  adminDesktopCabinetShell,
  adminDesktopMainScroll,
  ADMIN_DESKTOP_CANVAS,
  CLIENT_CABINET_DESKTOP_MAIN,
} from '../../admin/adminCabinetLayout';
import {
  ClientProfileDesktopSidebar,
  type ClientProfileMainTab,
} from './ClientProfileDesktopSidebar';
import { ClientProfileDesktopTopBar } from './ClientProfileDesktopTopBar';
import { ClientProfileCabinetContent } from './ClientProfileCabinetContent';
import { ClientCabinetMobileShell } from './ClientCabinetMobileShell';

type Props = {
  mainTab: ClientProfileMainTab;
  onSelectTab: (tab: ClientProfileMainTab) => void;
  displayName: string;
  roleSubtitle: string;
  profileInitials: string;
  authLoading: boolean;
  isAuthenticated: boolean;
  backendConfigured: boolean;
  profile: BackendProfile | null;
  isTelegramWebApp: boolean;
  telegramUsername: string | null;
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
  notificationCount: number;
  onEditProfile: () => void;
  isMasterCabinet: boolean;
  clientShell: boolean;
  apptSubTab: DemoAppointmentTab;
  onApptSubTabChange: (tab: DemoAppointmentTab) => void;
  apptRows: DemoAppointmentRecord[];
  apptListLoading: boolean;
  apptHasMore?: boolean;
  apptLoadingMore?: boolean;
  onLoadMoreAppointments?: () => void;
  apptError: string | null;
  upcomingCount: number;
  favorites: FavoriteMasterDto[];
  favoritesLoading: boolean;
  favoritesError: string | null;
  hasApiBackend: boolean;
  onOpenDetails: (row: DemoAppointmentRecord) => void;
  onCancel: (row: DemoAppointmentRecord) => void;
  onReview: (row: DemoAppointmentRecord) => void;
  onDownloadPdf: (row: DemoAppointmentRecord) => void;
  onRemoveFavorite: (masterId: string) => void;
};

export function ClientProfileDesktop({
  mainTab,
  onSelectTab,
  displayName,
  roleSubtitle,
  profileInitials,
  authLoading,
  isAuthenticated,
  backendConfigured,
  profile,
  isTelegramWebApp,
  telegramUsername,
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
  notificationCount,
  onEditProfile,
  isMasterCabinet,
  clientShell,
  apptSubTab,
  onApptSubTabChange,
  apptRows,
  apptListLoading,
  apptHasMore = false,
  apptLoadingMore = false,
  onLoadMoreAppointments,
  apptError,
  upcomingCount,
  favorites,
  favoritesLoading,
  favoritesError,
  hasApiBackend,
  onOpenDetails,
  onCancel,
  onReview,
  onDownloadPdf,
  onRemoveFavorite,
}: Props) {
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const pageTitle =
    mainTab === 'appointments' ? 'Мои записи' : mainTab === 'favorites' ? 'Избранное' : 'Профиль';

  const cabinetContent = (
    <ClientProfileCabinetContent
      mainTab={mainTab}
      displayName={displayName}
      roleSubtitle={roleSubtitle}
      profileInitials={profileInitials}
      authLoading={authLoading}
      isAuthenticated={isAuthenticated}
      backendConfigured={backendConfigured}
      profile={profile}
      isTelegramWebApp={isTelegramWebApp}
      telegramUsername={telegramUsername}
      avatarPreviewUrl={avatarPreviewUrl}
      profileAvatarUrl={profileAvatarUrl}
      telegramPhotoUrl={telegramPhotoUrl}
      avatarBusy={avatarBusy}
      avatarErr={avatarErr}
      avatarFileInputRef={avatarFileInputRef}
      onAvatarFileChange={onAvatarFileChange}
      telegramUserPhotoUrl={telegramUserPhotoUrl}
      onApplyTelegramAvatar={onApplyTelegramAvatar}
      apptSubTab={apptSubTab}
      onApptSubTabChange={onApptSubTabChange}
      apptRows={apptRows}
      apptListLoading={apptListLoading}
      apptHasMore={apptHasMore}
      apptLoadingMore={apptLoadingMore}
      onLoadMoreAppointments={onLoadMoreAppointments}
      apptError={apptError}
      favorites={favorites}
      favoritesLoading={favoritesLoading}
      favoritesError={favoritesError}
      hasApiBackend={hasApiBackend}
      onEditProfile={onEditProfile}
      onOpenDetails={onOpenDetails}
      onCancel={onCancel}
      onReview={onReview}
      onDownloadPdf={onDownloadPdf}
      onRemoveFavorite={onRemoveFavorite}
    />
  );

  useLayoutEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0 });
    mobileScrollRef.current?.scrollTo({ top: 0 });
  }, [mainTab]);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      document.documentElement.classList.toggle('catalog-desktop-scroll-lock', mq.matches);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      document.documentElement.classList.remove('catalog-desktop-scroll-lock');
      mq.removeEventListener('change', sync);
    };
  }, []);

  return (
    <>
      <div className={`hidden ${adminDesktopCabinetShell} text-[#111827] lg:flex ${ADMIN_DESKTOP_CANVAS}`}>
        <ClientProfileDesktopTopBar
          title={pageTitle}
          hasNewNotifications={hasNewNotifications}
          notificationCount={notificationCount}
        />

        <div className={adminDesktopCabinetBody}>
        <ClientProfileDesktopSidebar
          displayName={displayName}
          roleSubtitle={roleSubtitle}
          profileInitials={profileInitials}
          authLoading={authLoading}
          isAuthenticated={isAuthenticated}
          avatarPreviewUrl={avatarPreviewUrl}
          profileAvatarUrl={profileAvatarUrl}
          telegramPhotoUrl={telegramPhotoUrl}
          avatarBusy={avatarBusy}
          avatarErr={avatarErr}
          avatarFileInputRef={avatarFileInputRef}
          onAvatarFileChange={onAvatarFileChange}
          telegramUserPhotoUrl={telegramUserPhotoUrl}
          onApplyTelegramAvatar={onApplyTelegramAvatar}
          hasNewNotifications={hasNewNotifications}
          mainTab={mainTab}
          onSelectTab={onSelectTab}
          isMasterCabinet={isMasterCabinet}
          clientShell={clientShell}
          upcomingCount={upcomingCount}
          favoritesCount={favorites.length}
        />

        <div className={adminDesktopCabinetMainColumn}>
          <div
            ref={contentScrollRef}
            className={`${adminDesktopMainScroll} ${ADMIN_DESKTOP_CANVAS} lg:pb-8`}
          >
            {!authLoading && !backendConfigured ? (
              <div className="px-4 pt-3 lg:px-8 lg:pt-4">
                <p className="rounded-[10px] bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-950">
                  В .env не задан VITE_API_URL — данные профиля с сервера недоступны.
                </p>
              </div>
            ) : null}

            <div className={CLIENT_CABINET_DESKTOP_MAIN}>{cabinetContent}</div>
          </div>
        </div>
        </div>
      </div>

      {clientShell ? (
        <ClientCabinetMobileShell
          showMainTabs
          mainTab={mainTab}
          onSelectTab={onSelectTab}
          upcomingCount={upcomingCount}
          favoritesCount={favorites.length}
        >
          {!authLoading && !backendConfigured ? (
            <p className="mb-3 rounded-[10px] bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-950">
              В .env не задан VITE_API_URL — данные профиля с сервера недоступны.
            </p>
          ) : null}
          <div ref={mobileScrollRef} className="min-w-0 space-y-4">
            {cabinetContent}
          </div>
        </ClientCabinetMobileShell>
      ) : null}
    </>
  );
}
