import type { ChangeEvent, RefObject } from 'react';
import { ClientProfileAvatar } from './ClientProfileAvatar';
import { clientCabinetMobilePanel, clientProfileEditBtn } from './clientProfileTheme';

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
  onEditProfile: () => void;
};

export function ClientProfileIdentityCard({
  displayName,
  roleSubtitle,
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
  onEditProfile,
}: Props) {
  return (
    <div className={`${clientCabinetMobilePanel} relative mb-3 overflow-hidden`}>
      {isAuthenticated ? (
        <button
          type="button"
          onClick={onEditProfile}
          className={`${clientProfileEditBtn} absolute right-3 top-3 z-10 sm:right-4 sm:top-4 lg:right-6 lg:top-6`}
        >
          Редактировать
        </button>
      ) : null}

      <div className="flex items-start gap-3.5 px-4 pb-5 pt-4 sm:gap-4 sm:px-5 sm:pb-6 sm:pt-5 lg:items-center lg:px-6 lg:py-7">
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
          size="lg"
          showCameraHint
        />
        <div className="min-w-0 flex-1 pr-24 pt-0.5 sm:pr-28">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] lg:hidden">
            Профиль
          </p>
          <h2 className="mt-1 text-left text-[20px] font-bold leading-tight tracking-[-0.03em] text-[#111827] sm:text-[22px] lg:mt-0 lg:text-[24px]">
            {authLoading ? 'Загрузка…' : displayName}
          </h2>
          <p className="mt-1 text-left text-[14px] font-medium text-[#6B7280]">{roleSubtitle}</p>
        </div>
      </div>

      {avatarErr ? (
        <p className="border-t border-[#EEEEEE] px-5 py-3 text-[13px] font-medium text-red-600 lg:px-6">
          {avatarErr}
        </p>
      ) : null}

      {isAuthenticated && telegramUserPhotoUrl ? (
        <div className="border-t border-[#EEEEEE] px-5 py-3 lg:px-6">
          <button
            type="button"
            disabled={avatarBusy}
            onClick={onApplyTelegramAvatar}
            className="w-full rounded-[10px] bg-[#F6F7FB] px-3 py-2.5 text-[13px] font-semibold text-[#374151] transition hover:bg-[#F1EFEF] disabled:opacity-50 sm:w-auto"
          >
            Обновить фото из Telegram
          </button>
        </div>
      ) : null}
    </div>
  );
}
