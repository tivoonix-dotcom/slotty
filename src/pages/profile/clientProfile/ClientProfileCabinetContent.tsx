import { EMPTY_TELEGRAM } from '../../../shared/lib/emptyDisplayText';
import type { ChangeEvent, ReactNode, RefObject } from 'react';
import { Link } from 'react-router-dom';
import type { DemoAppointmentRecord, DemoAppointmentTab } from '../../../features/appointments/model/demoAppointments';
import type { FavoriteMasterDto } from '../../../features/profile/api/clientFavorites';
import type { BackendProfile } from '../../../features/auth/types';
import { BECOME_MASTER_PATH, SERVICES_PATH } from '../../../app/paths';
import { AppointmentsEmptyState } from '../../admin/appointments/AppointmentsEmptyState';
import { APPOINTMENTS_REQUESTS_EMPTY_ILLUSTRATION_SRC } from '../../admin/appointments/adminAppointmentsTheme';
import { NothingFoundCard } from '../../../shared/ui/NothingFoundCard';
import { BelarusPhoneInline } from '../components/BelarusPhoneInline';
import { ClientProfileAppointmentRow } from './ClientProfileAppointmentRow';
import { ClientProfileFavoriteRow } from './ClientProfileFavoriteRow';
import { ClientProfileIdentityCard } from './ClientProfileIdentityCard';
import { catalogListCardClass } from '../../client/servicesCatalog/servicesCatalogTheme';
import {
  catalogPrimaryBtn,
  clientCabinetMobilePanel,
  clientProfileSubTabActive,
  clientProfileSubTabIdle,
  clientProfileSubTabTrack,
} from './clientProfileTheme';
import type { ClientProfileMainTab } from './ClientProfileDesktopSidebar';

type Props = {
  mainTab: ClientProfileMainTab;
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
  apptSubTab: DemoAppointmentTab;
  onApptSubTabChange: (tab: DemoAppointmentTab) => void;
  apptRows: DemoAppointmentRecord[];
  apptListLoading: boolean;
  apptHasMore?: boolean;
  apptLoadingMore?: boolean;
  onLoadMoreAppointments?: () => void;
  apptError: string | null;
  favorites: FavoriteMasterDto[];
  favoritesLoading: boolean;
  favoritesError: string | null;
  hasApiBackend: boolean;
  isMasterCabinet: boolean;
  onEditProfile: () => void;
  onOpenDetails: (row: DemoAppointmentRecord) => void;
  onCancel: (row: DemoAppointmentRecord) => void;
  onReview: (row: DemoAppointmentRecord) => void;
  onDownloadPdf: (row: DemoAppointmentRecord) => void;
  onRemoveFavorite: (masterId: string) => void;
};

function EmptyAppointments() {
  return (
    <AppointmentsEmptyState
      title="Записей пока нет"
      text="Когда вы запишетесь на услугу, запись появится здесь."
      illustrationSrc={APPOINTMENTS_REQUESTS_EMPTY_ILLUSTRATION_SRC}
      action={
        <Link to={SERVICES_PATH} className={`${catalogPrimaryBtn} w-full`}>
          Найти услуги
        </Link>
      }
    />
  );
}

function EmptyFavorites() {
  return (
    <AppointmentsEmptyState
      title="Избранных пока нет"
      text="Добавляйте мастеров в избранное — так быстрее записаться снова."
      picture="clientsEmpty"
      action={
        <Link to={SERVICES_PATH} className={`${catalogPrimaryBtn} w-full`}>
          Найти услуги
        </Link>
      }
    />
  );
}

function ProfileField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="px-4 py-4 sm:px-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <p className="mt-1.5 text-[16px] font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

export function ClientProfileCabinetContent({
  mainTab,
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
  apptSubTab,
  onApptSubTabChange,
  apptRows,
  apptListLoading,
  apptHasMore = false,
  apptLoadingMore = false,
  onLoadMoreAppointments,
  apptError,
  favorites,
  favoritesLoading,
  favoritesError,
  hasApiBackend,
  isMasterCabinet,
  onEditProfile,
  onOpenDetails,
  onCancel,
  onReview,
  onDownloadPdf,
  onRemoveFavorite,
}: Props) {
  const telegramLabel = profile?.telegram_username
    ? `@${profile.telegram_username}`
    : telegramUsername
      ? `@${telegramUsername}`
      : isTelegramWebApp
        ? 'Подключен'
        : EMPTY_TELEGRAM;

  return (
    <>
      {mainTab === 'appointments' ? (
        <>
          <div
            className={`${clientCabinetMobilePanel} mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-5`}
          >
            <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827] lg:hidden">Мои записи</h2>
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

          <div className="pb-4">
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
              <p className="rounded-[10px] bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">{apptError}</p>
            ) : apptListLoading ? (
              <div className={`${clientCabinetMobilePanel} divide-y divide-[#EEEEEE]`}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="px-6 py-5">
                    <div className="h-5 max-w-[12rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                    <div className="mt-2 h-4 max-w-[10rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                    <div className="mt-3 h-4 max-w-[16rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                  </div>
                ))}
              </div>
            ) : apptRows.length === 0 ? (
              <EmptyAppointments />
            ) : (
              <div className={`${clientCabinetMobilePanel} divide-y divide-[#EEEEEE]`}>
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
            {apptHasMore && apptRows.length > 0 ? (
              <button
                type="button"
                disabled={apptLoadingMore}
                onClick={onLoadMoreAppointments}
                className="mt-3 min-h-11 w-full rounded-[14px] border border-[#EAECEF] bg-white text-[14px] font-semibold text-[#374151] transition hover:bg-[#FAFAFA] active:scale-[0.98] disabled:opacity-60"
              >
                {apptLoadingMore ? 'Загрузка…' : 'Показать ещё'}
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {mainTab === 'favorites' ? (
        <div className="pb-4">
          <div className={`${clientCabinetMobilePanel} mb-3 px-4 py-3 sm:px-5 lg:hidden`}>
            <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]">Избранное</h2>
          </div>
          {!authLoading && !backendConfigured ? (
            <p className="rounded-[10px] bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-950">
              Укажите VITE_API_URL, чтобы загрузить избранное.
            </p>
          ) : !authLoading && hasApiBackend && !isAuthenticated ? (
            <NothingFoundCard
              title="Войдите в аккаунт"
              text="Войдите в аккаунт — избранные мастера сохранятся на сервере и будут доступны на всех устройствах."
            />
          ) : favoritesError ? (
            <p className="rounded-[10px] bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">{favoritesError}</p>
          ) : favoritesLoading ? (
            <div className="grid gap-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={`${catalogListCardClass} flex items-center gap-4 p-5 ring-1 ring-[#EEEEEE]`}
                >
                  <div className="h-[5.5rem] w-[5.5rem] shrink-0 animate-pulse rounded-[20px] bg-[#EBEBEB]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-5 max-w-[12rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                    <div className="h-4 max-w-[8rem] animate-pulse rounded-full bg-[#EBEBEB]" />
                  </div>
                </div>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <EmptyFavorites />
          ) : (
            <ul className="grid list-none gap-3">
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
        </div>
      ) : null}

      {mainTab === 'profile' ? (
        <div className="pb-6 max-lg:pb-8">
          <ClientProfileIdentityCard
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
            onEditProfile={onEditProfile}
          />
          <div className={`${clientCabinetMobilePanel} divide-y divide-[#EEEEEE]`}>
            <ProfileField label="Telegram" value={telegramLabel} />
            <ProfileField
              label="Телефон"
              value={
                <BelarusPhoneInline
                  phone={profile?.phone}
                  flagClassName="h-4 w-4 shrink-0 rounded-full object-cover"
                />
              }
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
          {!isMasterCabinet ? (
            <p className="mt-4 px-1 text-center text-[14px] leading-relaxed text-[#6B7280]">
              Вы не мастер?{' '}
              <Link
                to={BECOME_MASTER_PATH}
                className="font-semibold text-[#F47C8C] underline decoration-[#F47C8C]/35 underline-offset-[3px] transition hover:text-[#E86B7D]"
              >
                Хотите стать мастером?
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
