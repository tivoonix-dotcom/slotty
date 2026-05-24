import type { ChangeEvent, ReactNode, RefObject } from 'react';
import { useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import type { DemoAppointmentRecord, DemoAppointmentTab } from '../../../features/appointments/model/demoAppointments';
import type { FavoriteMasterDto } from '../../../features/profile/api/clientFavorites';
import type { BackendProfile } from '../../../features/auth/types';
import { SERVICES_PATH } from '../../../app/paths';
import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import { NothingFoundCard } from '../../../shared/ui/NothingFoundCard';
import { BelarusPhoneInline } from '../components/BelarusPhoneInline';
import {
  ClientProfileDesktopSidebar,
  type ClientProfileMainTab,
} from './ClientProfileDesktopSidebar';
import { ClientProfileAppointmentRow } from './ClientProfileAppointmentRow';
import { ClientProfileFavoriteRow } from './ClientProfileFavoriteRow';
import {
  catalogCanvasClass,
  catalogDesktopPanel,
  catalogDesktopShellClass,
  catalogPrimaryBtn,
  clientProfileSectionTitle,
  clientProfileSidebarWidth,
  clientProfileSubTabActive,
  clientProfileSubTabIdle,
  clientProfileSubTabTrack,
} from './clientProfileTheme';

type Props = {
  mainTab: ClientProfileMainTab;
  onSelectTab: (tab: ClientProfileMainTab) => void;
  displayName: string;
  roleSubtitle: string;
  initialLetter: string;
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
  onEditProfile: () => void;
  isMasterCabinet: boolean;
  clientShell: boolean;
  apptSubTab: DemoAppointmentTab;
  onApptSubTabChange: (tab: DemoAppointmentTab) => void;
  apptRows: DemoAppointmentRecord[];
  apptListLoading: boolean;
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

function EmptyAppointments() {
  return (
    <NothingFoundCard
      title="Записей пока нет"
      text="Выберите мастера и удобное время — запись появится здесь."
      action={
        <Link to={SERVICES_PATH} className={catalogPrimaryBtn}>
          Найти услуги
        </Link>
      }
    />
  );
}

function EmptyFavorites() {
  return (
    <NothingFoundCard
      title="Избранных пока нет"
      text="Сохраняйте мастеров, чтобы быстрее записываться снова."
      action={
        <Link to={SERVICES_PATH} className={catalogPrimaryBtn}>
          Найти услуги
        </Link>
      }
    />
  );
}

function ProfileField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="px-6 py-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <p className="mt-1.5 text-[16px] font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

export function ClientProfileDesktop({
  mainTab,
  onSelectTab,
  displayName,
  roleSubtitle,
  initialLetter,
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
  onEditProfile,
  isMasterCabinet,
  clientShell,
  apptSubTab,
  onApptSubTabChange,
  apptRows,
  apptListLoading,
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

  const telegramLabel = profile?.telegram_username
    ? `@${profile.telegram_username}`
    : telegramUsername
      ? `@${telegramUsername}`
      : isTelegramWebApp
        ? 'Подключен'
        : '—';

  return (
    <div className={`${catalogDesktopShellClass} hidden lg:flex ${catalogCanvasClass}`}>
      <div className={`${CLIENT_DESKTOP_SHELL_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden pb-10 pt-6`}>
        <header className="mb-5 shrink-0">
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#111827]">Мой профиль</h1>
          {!authLoading && !backendConfigured ? (
            <p className="mt-2 rounded-[10px] bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-950">
              В .env не задан VITE_API_URL — данные профиля с сервера недоступны.
            </p>
          ) : null}
        </header>

        <div className={`grid min-h-0 flex-1 gap-6 overflow-hidden ${clientProfileSidebarWidth}`}>
          <div className="scrollbar-hidden min-h-0 overflow-y-auto overscroll-y-contain pb-2">
            <ClientProfileDesktopSidebar
              displayName={displayName}
              roleSubtitle={roleSubtitle}
              initialLetter={initialLetter}
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
          </div>

          <div className="relative z-0 flex min-h-0 min-w-0 flex-col">
            {mainTab === 'appointments' ? (
              <>
                <div className={`${catalogDesktopPanel} mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4`}>
                  <h2 className={clientProfileSectionTitle}>Мои записи</h2>
                  <div className={clientProfileSubTabTrack} role="tablist" aria-label="Тип записей">
                    <button
                      type="button"
                      onClick={() => onApptSubTabChange('upcoming')}
                      className={`min-h-9 rounded-[8px] px-4 text-[13px] transition ${
                        apptSubTab === 'upcoming' ? clientProfileSubTabActive : clientProfileSubTabIdle
                      }`}
                    >
                      Предстоящие
                    </button>
                    <button
                      type="button"
                      onClick={() => onApptSubTabChange('past')}
                      className={`min-h-9 rounded-[8px] px-4 text-[13px] transition ${
                        apptSubTab === 'past' ? clientProfileSubTabActive : clientProfileSubTabIdle
                      }`}
                    >
                      История
                    </button>
                  </div>
                </div>

                <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-4">
                {!authLoading && !backendConfigured ? (
                  <p className="rounded-[10px] bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-950">
                    Укажите VITE_API_URL, чтобы загрузить записи.
                  </p>
                ) : !authLoading && !isAuthenticated ? (
                  <NothingFoundCard
                    title="Войдите в аккаунт"
                    text="Откройте SLOTTY в Telegram Mini App — тогда здесь появятся ваши записи."
                  />
                ) : apptError ? (
                  <p className="rounded-[10px] bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">
                    {apptError}
                  </p>
                ) : apptListLoading ? (
                  <div className={`${catalogDesktopPanel} divide-y divide-[#EEEEEE]`}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="px-6 py-5">
                        <div className="h-5 max-w-[12rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                        <div className="mt-2 h-4 max-w-[10rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                        <div className="mt-3 h-4 max-w-[16rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                      </div>
                    ))}
                  </div>
                ) : apptRows.length === 0 ? (
                  <div className={catalogDesktopPanel}>
                    <div className="p-5">
                      <EmptyAppointments />
                    </div>
                  </div>
                ) : (
                  <div className={`${catalogDesktopPanel} divide-y divide-[#EEEEEE]`}>
                    {apptRows.map((row) => (
                      <ClientProfileAppointmentRow
                        key={row.id}
                        row={row}
                        subTab={apptSubTab}
                        onDetails={onOpenDetails}
                        onCancel={onCancel}
                        onReview={onReview}
                        onDownloadPdf={onDownloadPdf}
                      />
                    ))}
                  </div>
                )}
                </div>
              </>
            ) : null}

            {mainTab === 'favorites' ? (
              <>
                <div className={`${catalogDesktopPanel} mb-3 flex shrink-0 items-center px-5 py-4`}>
                  <h2 className={clientProfileSectionTitle}>Избранное</h2>
                </div>

                <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-4">
                  <section>
                {!authLoading && !backendConfigured ? (
                  <p className="rounded-[10px] bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-950">
                    Укажите VITE_API_URL, чтобы загрузить избранное.
                  </p>
                ) : !authLoading && hasApiBackend && !isAuthenticated ? (
                  <NothingFoundCard
                    title="Войдите в аккаунт"
                    text="Избранные мастера сохраняются на сервере. Откройте SLOTTY через Telegram."
                  />
                ) : favoritesError ? (
                  <p className="rounded-[10px] bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">
                    {favoritesError}
                  </p>
                ) : favoritesLoading ? (
                  <div className={`${catalogDesktopPanel} divide-y divide-[#EEEEEE]`}>
                    {[0, 1].map((i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-5">
                        <div className="h-14 w-14 animate-pulse rounded-[12px] bg-[#EBEBEB]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 max-w-[10rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                          <div className="h-4 max-w-[8rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : favorites.length === 0 ? (
                  <EmptyFavorites />
                ) : (
                  <ul className={`${catalogDesktopPanel} divide-y divide-[#EEEEEE]`}>
                    {favorites.map((row, i) => (
                      <ClientProfileFavoriteRow
                        key={row.masterId}
                        row={row}
                        onRemove={onRemoveFavorite}
                        imagePriority={i < 8}
                      />
                    ))}
                  </ul>
                )}
                  </section>
                </div>
              </>
            ) : null}

            {mainTab === 'profile' ? (
              <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-4">
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className={clientProfileSectionTitle}>Личные данные</h2>
                  {isAuthenticated ? (
                    <button type="button" onClick={onEditProfile} className={catalogPrimaryBtn}>
                      Редактировать
                    </button>
                  ) : null}
                </div>
                <div className={`${catalogDesktopPanel} divide-y divide-[#EEEEEE]`}>
                  <ProfileField label="Имя" value={displayName} />
                  <ProfileField label="Telegram" value={telegramLabel} />
                  <ProfileField
                    label="Телефон"
                    value={<BelarusPhoneInline phone={profile?.phone} flagClassName="h-4 w-4 shrink-0 rounded-full object-cover" />}
                  />
                  <ProfileField
                    label="Адрес"
                    value={profile?.address?.trim() ? profile.address.trim() : 'Не указан'}
                  />
                  <ProfileField
                    label="Роль"
                    value={profile?.role === 'master' ? 'Мастер SLOTTY' : 'Клиент SLOTTY'}
                  />
                </div>
              </section>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
