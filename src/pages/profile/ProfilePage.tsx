import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { EMPTY_TELEGRAM } from '../../shared/lib/emptyDisplayText';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import { ADMIN_PATH, BECOME_MASTER_PATH, getClientAppointmentPath, getClientAppointmentReviewPath, getMasterPath, getProfilePath, PROFILE_NOTIFICATIONS_PATH, PROFILE_SETTINGS_PATH, SERVICES_PATH } from '../../app/paths';
import { setProfileRole } from '../../features/profile/lib/setProfileRole';
import { useIsMasterUser } from '../../features/profile/hooks/useIsMasterUser';
import { type DemoAppointmentRecord, type DemoAppointmentTab } from '../../features/appointments/model/demoAppointments';
import { ClientAppointmentDetailSheetContent } from '../../features/appointments/clientBooking/ClientAppointmentDetailSheetContent';
import { ClientReviewForm } from '../../features/appointments/clientBooking/ClientReviewForm';
import {
  emptyClientAppointments,
  fetchClientAppointmentsPage,
  mergeClientAppointmentsState,
  type ClientAppointmentsState,
} from '../../features/appointments/api/clientAppointments';
import { removeMyFavoriteMaster, type FavoriteMasterDto } from '../../features/profile/api/clientFavorites';
import {
  fetchFavoritesForDisplay,
  resolveLocalFavoritesForDisplay,
  syncLocalFavoritesToServer,
} from '../../features/profile/lib/favoriteMastersResolve';
import { hasApiBackend } from '../../features/profile/lib/favoriteMastersPolicy';
import {
  FAVORITE_MASTERS_CHANGED,
  removeFavoriteMasterId,
} from '../../features/profile/lib/favoriteMastersStorage';
import { useMyNotifications } from '../../features/notifications/useMyNotifications';
import { useAuth } from '../../features/auth/AuthProvider';
import { AccountAccessRestrictedBanner } from '../../features/auth/components/AccountAccessBanner';
import { AccountBlockedScreen } from '../../features/auth/components/AccountBlockedScreen';
import { useAccountAccess } from '../../features/auth/hooks/useAccountAccess';
import { openBookingVoucherPrint } from '../../features/booking/lib/bookingConfirmationVoucherPrint';
import { NothingFoundCard } from '../../shared/ui/NothingFoundCard';
import type { MiniPictureKey } from '../../shared/ui/miniPictureSrc';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { formatTelegramUserDisplayName } from '../../shared/lib/telegramWebApp';
import { formatClientName } from '../../shared/lib/displayFormat';
import { apiFetch, getApiBaseUrl } from '../../shared/api/backendClient';
import { postClientReview } from '../../features/profile/api/clientReviews';
import { useClientErrorModal } from '../client/ClientErrorModalContext';
import { profileDisplayAvatarUrl, profileDisplayInitials } from '../../features/profile/lib/profileDisplayAvatar';
import { optimizeAvatarUrl } from '../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { HomeHeader } from '../HomeHeader';
import type { ClientOutletContext } from '../client/clientOutletContext';
import { CLIENT_CONTENT_PAD_BOTTOM, CLIENT_HEADER_OFFSET, CLIENT_STICKY_BELOW_MOBILE_HEADER } from '../client/clientNavConstants';
import { BelarusPhoneInline } from './components/BelarusPhoneInline';
import { ProfileEditModal } from './components/ProfileEditModal';
import { ClientProfileDesktop } from './clientProfile/ClientProfileDesktop';
import {
  clientProfileSectionTitle,
  clientProfileSubTabActive,
  clientProfileSubTabIdle,
  clientProfileSubTabTrack,
} from './clientProfile/clientProfileTheme';
import { formatPriceByn, statusClassName, statusLabelRu } from './profileFormat';
import { subscribeBookingDataRefresh } from '../../features/appointments/bookingDataSync';

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconCameraPlus({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconPdf({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M10 13h4M10 17h4M10 9h2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconDetails({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h11" strokeLinecap="round" />
    </svg>
  );
}

function IconCancelAppt({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" strokeLinecap="round" />
    </svg>
  );
}

function IconReviewStar({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M12 17.5 6.5 20l1.25-6.14L3 8.86l6.11-.89L12 2.5l2.89 5.47 6.11.89-4.75 4.5L17.5 20z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type MainTab = 'appointments' | 'favorites' | 'profile';

function parseMainTab(tabParam: string | null): MainTab {
  if (tabParam === 'appointments') return 'appointments';
  if (tabParam === 'favorites') return 'favorites';
  return 'profile';
}

function demoAppointmentToVoucherPayload(row: DemoAppointmentRecord) {
  return {
    masterName: row.masterName,
    serviceTitle: row.serviceTitle,
    dateLabel: row.dateLabel,
    timeLabel: row.timeLabel,
    locationLine: row.addressShort,
    priceLabel: formatPriceByn(row.price),
    statusLabel: statusLabelRu(row.status),
    voucherNumber: row.voucherNumber ?? undefined,
  };
}

type CancelModalState =
  | { open: false }
  | { open: true; phase: 'confirm'; row: DemoAppointmentRecord; apiError?: string }
  | { open: true; phase: 'cancelling'; row: DemoAppointmentRecord }
  | { open: true; phase: 'success' };

function AppointmentCard({
  row,
  subTab,
  onDetails,
  onCancel,
  onReview,
  onDownloadPdf,
}: {
  row: DemoAppointmentRecord;
  subTab: DemoAppointmentTab;
  onDetails: (row: DemoAppointmentRecord) => void;
  onCancel: (row: DemoAppointmentRecord) => void;
  onReview: (row: DemoAppointmentRecord) => void;
  onDownloadPdf: (row: DemoAppointmentRecord) => void;
}) {
  const when = `${row.dateLabel}, ${row.timeLabel}`;
  const isCancelled = row.status === 'cancelled';

  const btnBase =
    'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold leading-tight transition active:scale-[0.98]';

  return (
    <article className="rounded-[30px] bg-white p-4 shadow-[0_12px_34px_rgba(17,17,17,0.045)] transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">
            {row.masterName}
          </p>

          <p className="mt-1 text-[15px] font-medium leading-snug text-neutral-600">
            {row.serviceTitle}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${statusClassName(
            row.status,
          )}`}
        >
          {statusLabelRu(row.status)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4">
        <div>
          <p className="text-[15px] font-semibold text-neutral-900">{when}</p>

          <p className="mt-1 text-[14px] leading-snug text-neutral-400">
            {row.addressShort}
          </p>
        </div>

        <p className="text-right text-[18px] font-semibold tabular-nums tracking-[-0.04em] text-neutral-950">
          {formatPriceByn(row.price)}
        </p>
      </div>

      <div className="mt-3 flex items-stretch gap-1.5">
        <button
          type="button"
          onClick={() => onDetails(row)}
          className={`${btnBase} bg-[#F1EFEF] text-neutral-900`}
        >
          <IconDetails className="shrink-0 opacity-80" />
          Подробнее
        </button>

        <button
          type="button"
          onClick={() => onDownloadPdf(row)}
          className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border border-[#e8e4e4] bg-white text-[#c47878] shadow-[inset_0_0_0_1px_rgba(226,149,149,0.12)] transition active:scale-[0.96]"
          title="Скачать PDF"
          aria-label="Скачать PDF — откроется печать, в диалоге выберите «Сохранить как PDF»"
        >
          <IconPdf className="h-4 w-4" />
        </button>

        {subTab === 'upcoming' ? (
          isCancelled ? (
            <span className={`${btnBase} cursor-default bg-[#F3F1F1] text-neutral-400 active:scale-100`}>Отменена</span>
          ) : (
            <button
              type="button"
              onClick={() => onCancel(row)}
              className={`${btnBase} bg-white text-neutral-600 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.06)]`}
            >
              <IconCancelAppt className="shrink-0 opacity-75" />
              Отменить
            </button>
          )
        ) : row.status === 'completed' ? (
          row.hasReview ? (
            <span className={`${btnBase} cursor-default bg-[#F3F1F1] text-neutral-500 active:scale-100`}>
              <IconReviewStar className="shrink-0 opacity-60" />
              Отзыв отправлен
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onReview(row)}
              className={`${btnBase} bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.22)]`}
            >
              <IconReviewStar className="shrink-0 opacity-95" />
              Отзыв
            </button>
          )
        ) : (
          <span className={`${btnBase} cursor-default bg-[#F3F1F1] text-neutral-400 active:scale-100`}>
            {row.status === 'cancelled' ? 'Отменена' : 'Завершена'}
          </span>
        )}
      </div>
    </article>
  );
}

function FavoriteMasterRow({
  row,
  onRemove,
  imagePriority,
}: {
  row: FavoriteMasterDto;
  onRemove: (id: string) => void;
  imagePriority?: boolean;
}) {
  const masterPath = getMasterPath(row.masterId);
  const ratingLabel =
    Number.isFinite(row.rating) && row.reviewsCount > 0
      ? `★ ${row.rating.toFixed(1)} · ${row.reviewsCount} отзывов`
      : row.reviewsCount > 0
        ? `${row.reviewsCount} отзывов`
        : 'Мастер';

  return (
    <li className="rounded-[30px] bg-white p-3 pr-2 shadow-[0_12px_34px_rgba(17,17,17,0.045)]">
      <div className="flex items-center gap-2">
        <Link
          to={masterPath}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] py-1 pl-1 transition active:bg-black/[0.03]"
        >
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[20px] bg-[#F1EFEF]">
            {row.photoUrl ? (
              <ImageReveal
                src={optimizeAvatarUrl(row.photoUrl, 128)}
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-cover"
                loading={imagePriority ? 'eager' : 'lazy'}
                fetchPriority={imagePriority ? 'high' : 'low'}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-400">
                {row.displayName.trim().charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold text-neutral-950">{row.displayName}</p>
            <p className="mt-0.5 truncate text-[14px] font-medium text-neutral-500">{ratingLabel}</p>
          </div>

          <IconChevronRight className="mr-1 shrink-0 text-neutral-400" />
        </Link>

        <button
          type="button"
          onClick={() => onRemove(row.masterId)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[#F1EFEF] hover:text-neutral-700 active:scale-95"
          aria-label="Убрать из избранного"
        >
          <IconClose className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
}

function EmptyState({
  title,
  text,
  buttonText,
  picture,
}: {
  title: string;
  text?: string;
  buttonText: string;
  picture?: MiniPictureKey;
}) {
  return (
    <NothingFoundCard
      title={title}
      picture={picture}
      {...(text ? { text } : {})}
      action={
        <Link
          to={SERVICES_PATH}
          className="inline-flex min-h-[3.15rem] w-full max-w-xs items-center justify-center self-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
        >
          {buttonText}
        </Link>
      }
    />
  );
}

function AppointmentBottomSheet({
  onClose,
  children,
  labelledBy,
}: {
  onClose: () => void;
  children: ReactNode;
  labelledBy: string;
}) {
  return (
    <div
      className="scrollbar-hidden fixed inset-0 z-[51] flex items-end justify-center overflow-x-hidden overflow-y-hidden bg-black/30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-[max(2.5rem,env(safe-area-inset-top,0px))] backdrop-blur-[2px] sm:items-center sm:overflow-y-auto sm:p-4 sm:py-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="pointer-events-auto flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2.5rem))] w-full max-w-lg flex-col overflow-hidden rounded-t-[36px] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.2)] sm:max-h-[min(88dvh,calc(100dvh-4rem))] sm:rounded-[36px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="scrollbar-hidden min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain p-5 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { profile, isLoading: authLoading, isAuthenticated, backendConfigured, refreshProfile } = useAuth();
  const accountAccess = useAccountAccess();
  const { isTelegramWebApp, telegramUserPhotoUrl, telegramUserPreview } = useTelegram();
  const isMasterCabinet = useIsMasterUser();
  const outletCtx = useOutletContext<ClientOutletContext | undefined>();
  const clientShell = outletCtx?.clientShell === true;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [apptSubTab, setApptSubTab] = useState<DemoAppointmentTab>('upcoming');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const { hasUnread: hasNewNotifications } = useMyNotifications(isAuthenticated && backendConfigured, {
    pollIntervalMs: 60_000,
    audience: 'client',
  });

  const sheetBlocksScroll = editProfileOpen;

  useEffect(() => {
    if (!sheetBlocksScroll) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setEditProfileOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sheetBlocksScroll]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const applyTelegramAvatar = useCallback(async () => {
    if (!telegramUserPhotoUrl || !isAuthenticated) return;
    setAvatarErr(null);
    setAvatarBusy(true);
    try {
      const res = await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: telegramUserPhotoUrl }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setAvatarErr(j?.error?.message ?? 'Не удалось обновить фото из Telegram.');
        return;
      }
      await refreshProfile();
    } catch {
      setAvatarErr('Нет соединения с сервером.');
    } finally {
      setAvatarBusy(false);
    }
  }, [isAuthenticated, refreshProfile, telegramUserPhotoUrl]);

  const onAvatarFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file?.type.startsWith('image/')) return;
      if (!isAuthenticated) return;
      setAvatarErr(null);
      setAvatarPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setAvatarBusy(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await apiFetch('/api/me/avatar', { method: 'POST', body: fd });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
          setAvatarErr(j?.error?.message ?? 'Не удалось загрузить фото.');
          return;
        }
        await refreshProfile();
        setAvatarPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      } catch {
        setAvatarErr('Нет соединения с сервером.');
      } finally {
        setAvatarBusy(false);
      }
    },
    [isAuthenticated, refreshProfile],
  );

  const mainTab = useMemo(
    () => parseMainTab(searchParams.get('tab')),
    [searchParams],
  );

  const { displayName, roleSubtitle, profileInitials } = useMemo(() => {
    if (profile) {
      const name = formatClientName({
        full_name: profile.full_name,
        phone: profile.phone ?? null,
        telegram_username: profile.telegram_username,
      });
      const sub = clientShell
        ? 'Клиент\u00a0SLOTTY'
        : profile.role === 'master' || profile.hasMasterProfile
          ? 'Мастер\u00a0SLOTTY'
          : 'Клиент\u00a0SLOTTY';
      return { displayName: name, roleSubtitle: sub, profileInitials: profileDisplayInitials(name) };
    }
    if (telegramUserPreview) {
      const name = formatTelegramUserDisplayName(telegramUserPreview);
      return {
        displayName: name,
        roleSubtitle: 'Клиент\u00a0SLOTTY',
        profileInitials: profileDisplayInitials(name),
      };
    }
    return { displayName: 'Гость', roleSubtitle: 'Войдите через Telegram', profileInitials: '?' };
  }, [profile, telegramUserPreview, clientShell]);

  const profileAvatarUrl = useMemo(() => profileDisplayAvatarUrl(profile), [profile]);

  const selectMainTab = useCallback(
    (tab: MainTab) => {
      if (tab === 'profile') {
        setSearchParams({}, { replace: true });
        return;
      }

      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams],
  );

  const pickClientRoleAnd = useCallback(
    async (path: string) => {
      void setProfileRole('client');
      navigate(path);
    },
    [navigate],
  );

  const onProfileTab = useCallback(
    (tab: 'appointments' | 'favorites') => {
      void pickClientRoleAnd(getProfilePath(tab));
    },
    [pickClientRoleAnd],
  );

  const [apptState, setApptState] = useState<ClientAppointmentsState>(() => emptyClientAppointments());
  const [apptListLoading, setApptListLoading] = useState(false);
  const [apptLoadingMore, setApptLoadingMore] = useState(false);
  const [apptHasMore, setApptHasMore] = useState(false);
  const apptOffsetRef = useRef(0);
  const [apptError, setApptError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<FavoriteMasterDto[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const favoritesEverLoadedRef = useRef(false);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<CancelModalState>({ open: false });
  const [cancelReason, setCancelReason] = useState('');
  const [reviewAppointmentId, setReviewAppointmentId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const { showError } = useClientErrorModal();

  const loadClientAppointments = useCallback(
    async (mode: 'reset' | 'more' = 'reset') => {
      const base = getApiBaseUrl();
      if (!isAuthenticated || !base) {
        setApptState(emptyClientAppointments());
        setApptError(null);
        setApptHasMore(false);
        apptOffsetRef.current = 0;
        setApptListLoading(false);
        setApptLoadingMore(false);
        return;
      }
      const offset = mode === 'reset' ? 0 : apptOffsetRef.current;
      if (mode === 'reset') {
        setApptListLoading(true);
        setApptError(null);
      } else {
        setApptLoadingMore(true);
      }
      try {
        const page = await fetchClientAppointmentsPage({ limit: 30, offset });
        apptOffsetRef.current = page.loaded;
        setApptHasMore(page.hasMore);
        setApptState((prev) =>
          mode === 'reset' ? page.state : mergeClientAppointmentsState(prev, page.state),
        );
      } catch (e) {
        if (mode === 'reset') {
          setApptState(emptyClientAppointments());
          setApptHasMore(false);
          apptOffsetRef.current = 0;
          const msg = e instanceof Error ? e.message : 'Нет соединения с сервером.';
          setApptError(/401|unauthorized/i.test(msg) ? 'Сессия истекла. Откройте приложение снова.' : msg);
        }
      } finally {
        if (mode === 'reset') setApptListLoading(false);
        else setApptLoadingMore(false);
      }
    },
    [isAuthenticated],
  );

  const loadMoreClientAppointments = useCallback(() => {
    if (!apptHasMore || apptListLoading || apptLoadingMore) return;
    void loadClientAppointments('more');
  }, [apptHasMore, apptListLoading, apptLoadingMore, loadClientAppointments]);

  const loadFavorites = useCallback(
    async (opts?: { silent?: boolean; syncLocal?: boolean }) => {
      const silent = opts?.silent === true;
      const showSkeleton = !silent && !favoritesEverLoadedRef.current;

      if (hasApiBackend()) {
        if (!isAuthenticated) {
          setFavorites([]);
          setFavoritesError(null);
          setFavoritesLoading(false);
          favoritesEverLoadedRef.current = false;
          return;
        }
        if (showSkeleton) setFavoritesLoading(true);
        setFavoritesError(null);
        try {
          if (opts?.syncLocal !== false && !silent) {
            await syncLocalFavoritesToServer();
          }
          setFavorites(await fetchFavoritesForDisplay());
          favoritesEverLoadedRef.current = true;
        } catch (e) {
          if (!silent) {
            setFavorites([]);
          }
          setFavoritesError(e instanceof Error ? e.message : 'Не удалось загрузить избранное.');
        } finally {
          if (showSkeleton) setFavoritesLoading(false);
        }
        return;
      }

      if (showSkeleton) setFavoritesLoading(true);
      setFavoritesError(null);
      try {
        setFavorites(await resolveLocalFavoritesForDisplay());
        favoritesEverLoadedRef.current = true;
      } catch (e) {
        if (!silent) {
          setFavorites([]);
        }
        setFavoritesError(e instanceof Error ? e.message : 'Не удалось загрузить избранное.');
      } finally {
        if (showSkeleton) setFavoritesLoading(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    void loadClientAppointments();
  }, [loadClientAppointments, searchParams]);

  useEffect(() => {
    return subscribeBookingDataRefresh(() => {
      void loadClientAppointments();
    });
  }, [loadClientAppointments]);

  const focusAppointmentId = searchParams.get('focus');
  const focusBookingCode = searchParams.get('code');
  const legacyReviewAppointmentId = searchParams.get('review');
  const focusHandledRef = useRef<string | null>(null);
  const legacyReviewHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!legacyReviewAppointmentId) {
      legacyReviewHandledRef.current = null;
      return;
    }
    if (legacyReviewHandledRef.current === legacyReviewAppointmentId) return;
    const row =
      apptState.past.find((r) => r.id === legacyReviewAppointmentId) ??
      apptState.upcoming.find((r) => r.id === legacyReviewAppointmentId);
    if (!row?.voucherNumber) return;
    legacyReviewHandledRef.current = legacyReviewAppointmentId;
    navigate(getClientAppointmentReviewPath(row.voucherNumber), { replace: true });
  }, [apptState.past, apptState.upcoming, legacyReviewAppointmentId, navigate]);

  useEffect(() => {
    if (!focusAppointmentId && !focusBookingCode) {
      focusHandledRef.current = null;
      return;
    }
    if (mainTab !== 'appointments') {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', 'appointments');
          return next;
        },
        { replace: true },
      );
      return;
    }
    if (apptListLoading) return;

    const normalizedCode = focusBookingCode?.trim().toUpperCase() ?? '';
    const focusKey = `${focusAppointmentId ?? ''}|${normalizedCode}`;
    const row = [...apptState.upcoming, ...apptState.past].find((r) => {
      if (focusAppointmentId && r.id === focusAppointmentId) return true;
      if (!normalizedCode) return false;
      return r.voucherNumber?.trim().toUpperCase() === normalizedCode;
    });

    const clearFocusParams = () => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('focus');
          next.delete('code');
          return next;
        },
        { replace: true },
      );
    };

    if (row) {
      focusHandledRef.current = focusKey;
      setApptSubTab(row.type);
      const code = row.voucherNumber?.trim();
      if (code) {
        navigate(getClientAppointmentPath(code));
      } else {
        setSelectedAppointmentId(row.id);
      }
      clearFocusParams();
      return;
    }

    if (!normalizedCode || focusHandledRef.current === focusKey) return;

    focusHandledRef.current = focusKey;
    navigate(getClientAppointmentPath(normalizedCode));
    clearFocusParams();
  }, [focusAppointmentId, focusBookingCode, mainTab, apptListLoading, apptState, navigate, setSearchParams]);

  useEffect(() => {
    if (mainTab === 'favorites') {
      void loadFavorites();
    }
  }, [mainTab, loadFavorites]);

  useEffect(() => {
    if (mainTab !== 'profile') return;
    void refreshProfile();
  }, [mainTab, refreshProfile]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      favoritesEverLoadedRef.current = false;
      return;
    }
    void loadFavorites({ silent: true });
  }, [isAuthenticated, loadFavorites]);

  useEffect(() => {
    const onFavoritesChanged = () => {
      void loadFavorites({ silent: true });
    };
    window.addEventListener(FAVORITE_MASTERS_CHANGED, onFavoritesChanged);
    return () => window.removeEventListener(FAVORITE_MASTERS_CHANGED, onFavoritesChanged);
  }, [loadFavorites]);

  useEffect(() => {
    if (!apptError) return;
    showError(apptError, { title: 'Записи', onRetry: () => void loadClientAppointments() });
  }, [apptError, loadClientAppointments, showError]);

  useEffect(() => {
    if (!favoritesError) return;
    showError(favoritesError, { title: 'Избранное', onRetry: () => void loadFavorites() });
  }, [favoritesError, loadFavorites, showError]);

  const handleRemoveFavorite = useCallback(
    async (masterId: string) => {
      setFavoritesError(null);
      try {
        if (hasApiBackend()) {
          if (!isAuthenticated) {
            showError('Войдите в аккаунт, чтобы изменить избранное.', { title: 'Избранное' });
            return;
          }
          await removeMyFavoriteMaster(masterId);
        }
        removeFavoriteMasterId(masterId);
        setFavorites((prev) => prev.filter((f) => f.masterId !== masterId));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Не удалось убрать из избранного.';
        setFavoritesError(msg);
        showError(msg, { title: 'Избранное' });
      }
    },
    [isAuthenticated, showError],
  );

  const selectedAppointment = useMemo(() => {
    if (!selectedAppointmentId) return null;
    return [...apptState.upcoming, ...apptState.past].find((r) => r.id === selectedAppointmentId) ?? null;
  }, [selectedAppointmentId, apptState]);

  const reviewRow = useMemo(() => {
    if (!reviewAppointmentId) return null;
    return apptState.past.find((r) => r.id === reviewAppointmentId) ?? null;
  }, [reviewAppointmentId, apptState]);

  const openDetails = useCallback(
    (row: DemoAppointmentRecord) => {
      const code = row.voucherNumber?.trim();
      if (code) {
        navigate(getClientAppointmentPath(code));
        return;
      }
      setSelectedAppointmentId(row.id);
    },
    [navigate],
  );

  const closeDetails = useCallback(() => {
    setSelectedAppointmentId(null);
  }, []);

  const openCancel = useCallback((row: DemoAppointmentRecord) => {
    setSelectedAppointmentId(null);
    setCancelReason('');
    setCancelModal({ open: true, phase: 'confirm', row });
  }, []);

  const closeCancelModal = useCallback(() => {
    setCancelModal({ open: false });
  }, []);

  const confirmCancelAppointment = useCallback(() => {
    setCancelModal((m) => {
      if (!m.open || m.phase !== 'confirm' || !m.row) return m;
      const row = m.row;
      void (async () => {
        try {
          const reason = cancelReason.trim();
          const res = await apiFetch(`/api/me/appointments/${encodeURIComponent(row.id)}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify({ reason: reason || undefined }),
          });
          if (!res.ok) {
            const msg =
              res.status === 409
                ? 'Эту запись нельзя отменить.'
                : 'Не удалось отменить. Попробуйте позже.';
            setCancelModal({ open: true, phase: 'confirm', row, apiError: msg });
            return;
          }
          await loadClientAppointments();
          setCancelModal({ open: true, phase: 'success' });
        } catch {
          setCancelModal({ open: true, phase: 'confirm', row, apiError: 'Нет соединения с сервером.' });
        }
      })();
      return { open: true, phase: 'cancelling', row };
    });
  }, [cancelReason, loadClientAppointments]);

  const openReview = useCallback((row: DemoAppointmentRecord) => {
    setSelectedAppointmentId(null);
    setReviewRating(5);
    setReviewBody('');
    setReviewAppointmentId(row.id);
  }, []);

  const closeReview = useCallback(() => {
    setReviewAppointmentId(null);
    setReviewBody('');
    setReviewSubmitting(false);
  }, []);

  const submitReview = useCallback(async () => {
    if (!reviewRow || !getApiBaseUrl()) return;
    const body = reviewBody.trim();
    if (body.length < 2) {
      showError('Напишите пару слов об услуге — так мастеру будет приятнее.', { title: 'Отзыв' });
      return;
    }
    setReviewSubmitting(true);
    try {
      await postClientReview(reviewRow.id, reviewRating, body);
      await loadClientAppointments();
      closeReview();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Не удалось отправить отзыв', { title: 'Отзыв' });
    } finally {
      setReviewSubmitting(false);
    }
  }, [closeReview, loadClientAppointments, reviewBody, reviewRating, reviewRow, showError]);

  const openDownloadPdf = useCallback((row: DemoAppointmentRecord) => {
    openBookingVoucherPrint(demoAppointmentToVoucherPayload(row), HEADER_LOGO_SRC);
  }, []);

  const apptRows = apptSubTab === 'upcoming' ? apptState.upcoming : apptState.past;
  const showApptList = apptRows.length > 0;

  if (
    isAuthenticated &&
    (accountAccess.showBlockedScreen || accountAccess.showDeletedScreen)
  ) {
    return (
      <div className="min-h-dvh bg-white text-neutral-900">
        {!clientShell ? (
          <HomeHeader isDemoMaster={isMasterCabinet} onProfileTab={onProfileTab} />
        ) : null}
        <AccountBlockedScreen access={accountAccess} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-dvh overflow-x-hidden text-neutral-900 lg:bg-[#F5F5F5] ${
        clientShell ? `${CLIENT_CONTENT_PAD_BOTTOM} lg:pb-0` : 'pb-[calc(2rem+env(safe-area-inset-bottom,0px))] lg:pb-0'
      } bg-white`}
    >
      {!clientShell ? (
        <HomeHeader isDemoMaster={isMasterCabinet} onProfileTab={onProfileTab} />
      ) : null}

      {accountAccess.showRestrictedBanner ? (
        <div
          className={`mx-auto w-full px-4 pt-3 sm:px-5 ${
            clientShell ? 'max-w-none lg:max-w-6xl lg:px-8' : 'max-w-lg'
          }`}
        >
          <AccountAccessRestrictedBanner access={accountAccess} variant="client" />
        </div>
      ) : null}

      <ClientProfileDesktop
        mainTab={mainTab}
        onSelectTab={selectMainTab}
        displayName={displayName}
        roleSubtitle={roleSubtitle}
        profileInitials={profileInitials}
        authLoading={authLoading}
        isAuthenticated={isAuthenticated}
        backendConfigured={backendConfigured}
        profile={profile}
        isTelegramWebApp={isTelegramWebApp}
        telegramUsername={telegramUserPreview?.username ?? null}
        avatarPreviewUrl={avatarPreviewUrl}
        profileAvatarUrl={profileAvatarUrl}
        telegramPhotoUrl={telegramUserPreview?.photoUrl ?? null}
        avatarBusy={avatarBusy}
        avatarErr={avatarErr}
        avatarFileInputRef={avatarFileInputRef}
        onAvatarFileChange={onAvatarFileChange}
        telegramUserPhotoUrl={telegramUserPhotoUrl ?? null}
        onApplyTelegramAvatar={() => void applyTelegramAvatar()}
        hasNewNotifications={hasNewNotifications}
        onEditProfile={() => setEditProfileOpen(true)}
        isMasterCabinet={isMasterCabinet}
        clientShell={clientShell}
        apptSubTab={apptSubTab}
        onApptSubTabChange={setApptSubTab}
        apptRows={apptRows}
        apptListLoading={apptListLoading}
        apptHasMore={apptHasMore}
        apptLoadingMore={apptLoadingMore}
        onLoadMoreAppointments={loadMoreClientAppointments}
        apptError={apptError}
        upcomingCount={apptState.upcoming.length}
        favorites={favorites}
        favoritesLoading={favoritesLoading}
        favoritesError={favoritesError}
        hasApiBackend={hasApiBackend()}
        onOpenDetails={openDetails}
        onCancel={openCancel}
        onReview={openReview}
        onDownloadPdf={openDownloadPdf}
        onRemoveFavorite={handleRemoveFavorite}
      />

      <div className="lg:hidden">
      <div className="mx-auto w-full max-w-lg px-4 sm:px-5">
        <div
          className={`bg-white pb-5 ${
            clientShell
              ? CLIENT_HEADER_OFFSET
              : 'pt-[calc(5.5rem+env(safe-area-inset-top,0px))]'
          }`}
        >
          <h1 className="text-[38px] font-semibold leading-none tracking-[-0.065em] text-neutral-950">
            Мой профиль
          </h1>

          {!authLoading && !backendConfigured ? (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-[14px] font-medium leading-snug text-amber-950">
              В .env не задан VITE_API_URL — данные профиля с сервера недоступны.
            </p>
          ) : null}

          <section className="mt-7 rounded-[36px] border border-neutral-100 bg-white p-3 shadow-[0_8px_28px_rgba(17,17,17,0.04)]">
            <div className="rounded-[30px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
              {authLoading ? (
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 animate-pulse rounded-[22px] bg-neutral-200/90" aria-hidden />
                  <div className="min-w-0 flex-1 space-y-2 py-1">
                    <div className="h-5 max-w-[10rem] animate-pulse rounded-full bg-neutral-200/90" />
                    <div className="h-4 max-w-[7rem] animate-pulse rounded-full bg-neutral-200/80" />
                  </div>
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-neutral-200/80" aria-hidden />
                </div>
              ) : (
              <div>
              <div className="flex items-center gap-4">
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
                  className="group relative flex h-14 w-14 overflow-hidden rounded-[22px] bg-[#E29595] text-xl font-semibold text-white shadow-[0_10px_26px_rgba(226,149,149,0.26)] transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Загрузить фото профиля с устройства"
                >
                  {avatarPreviewUrl ? (
                    <ImageReveal src={avatarPreviewUrl} alt="" className="h-full w-full object-cover" loading="eager" />
                  ) : profileAvatarUrl ? (
                    <ImageReveal src={profileAvatarUrl} alt="" className="h-full w-full object-cover" loading="eager" />
                  ) : telegramUserPreview?.photoUrl ? (
                    <ImageReveal
                      src={telegramUserPreview.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[17px] tracking-tight" aria-hidden>
                      {profileInitials}
                    </span>
                  )}

                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />

                  <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-neutral-700 shadow-[0_4px_12px_rgba(17,17,17,0.12)] ring-2 ring-white">
                    <IconCameraPlus className="shrink-0" />
                  </span>
                </button>
              </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[20px] font-semibold tracking-[-0.045em] text-neutral-950">
                    {displayName}
                  </p>

                  <p className="mt-0.5 text-[15px] text-neutral-500">
                    {roleSubtitle}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                <Link
                  to={PROFILE_NOTIFICATIONS_PATH}
                  aria-label="Уведомления"
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1EFEF] text-neutral-800 shadow-[0_8px_24px_rgba(17,17,17,0.06)] transition hover:bg-[#ebe8e8] active:scale-[0.97]"
                >
                  <IconBell className="h-[22px] w-[22px] shrink-0" />

                  {hasNewNotifications ? (
                    <span
                      className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#E29595] ring-2 ring-[#F1EFEF]"
                      aria-hidden
                    />
                  ) : null}
                </Link>

                <Link
                  to={PROFILE_SETTINGS_PATH}
                  aria-label="Настройки"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1EFEF] text-neutral-800 shadow-[0_8px_24px_rgba(17,17,17,0.06)] transition hover:bg-[#ebe8e8] active:scale-[0.97]"
                >
                  <IconGear className="h-[22px] w-[22px] shrink-0" />
                </Link>
                </div>
              </div>

              {avatarErr ? (
                <p className="mt-2 text-[13px] font-medium leading-snug text-red-600">{avatarErr}</p>
              ) : null}

              {isAuthenticated && telegramUserPhotoUrl ? (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={() => void applyTelegramAvatar()}
                    className="flex w-full min-h-9 items-center justify-center whitespace-nowrap rounded-full bg-[#F1EFEF] px-3 py-2 text-[11px] font-semibold leading-none text-neutral-800 transition hover:bg-[#ebe8e8] disabled:opacity-50 sm:text-[12px]"
                  >
                    Обновить фото из Telegram
                  </button>
                </div>
              ) : null}
              </div>
              )}
            </div>

            <div className="mt-3 grid w-full grid-cols-3 gap-1.5 rounded-[28px] border border-neutral-100 bg-white p-1.5 shadow-[0_4px_16px_rgba(17,17,17,0.04)]">
              {(
                [
                  { id: 'appointments' as const, label: 'Мои записи' },
                  { id: 'favorites' as const, label: 'Избранное' },
                  { id: 'profile' as const, label: 'Профиль' },
                ] as const
              ).map((tab) => {
                const active = mainTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectMainTab(tab.id)}
                    className={`
                      flex
                      min-h-11
                      min-w-0
                      items-center
                      justify-center
                      rounded-full
                      px-2
                      text-center
                      text-[13px]
                      font-semibold
                      leading-tight
                      transition
                      active:scale-[0.98]
                      ${
                        active
                          ? 'bg-[#E29595] text-white shadow-[0_10px_24px_rgba(226,149,149,0.24)]'
                          : 'text-neutral-700'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="w-full min-w-0">
        {mainTab === 'appointments' ? (
          <section className="mt-7 flex flex-col gap-3">
            <div
              className={`sticky z-20 -mx-4 bg-white px-4 pb-3 sm:-mx-5 sm:px-5 ${CLIENT_STICKY_BELOW_MOBILE_HEADER}`}
            >
              <div className="flex flex-col gap-3 rounded-[16px] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className={clientProfileSectionTitle}>Мои записи</h2>

                <div className={clientProfileSubTabTrack} role="tablist" aria-label="Тип записей">
                <button
                  type="button"
                  onClick={() => setApptSubTab('upcoming')}
                  className={`min-h-9 rounded-[8px] px-4 text-[13px] transition ${
                    apptSubTab === 'upcoming' ? clientProfileSubTabActive : clientProfileSubTabIdle
                  }`}
                >
                  Предстоящие
                </button>

                <button
                  type="button"
                  onClick={() => setApptSubTab('past')}
                  className={`min-h-9 rounded-[8px] px-4 text-[13px] transition ${
                    apptSubTab === 'past' ? clientProfileSubTabActive : clientProfileSubTabIdle
                  }`}
                >
                  История
                </button>
              </div>
              </div>
            </div>

            {!authLoading && !backendConfigured ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-950">
                Укажите VITE_API_URL, чтобы загрузить записи.
              </p>
            ) : !authLoading && !isAuthenticated ? (
              <NothingFoundCard
                title="Войдите в аккаунт"
                text="Откройте SLOTTY в Telegram Mini App — тогда здесь появятся ваши записи."
              />
            ) : apptError ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">{apptError}</p>
            ) : apptListLoading ? (
              <ul className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="rounded-[30px] bg-white p-4 shadow-[0_12px_34px_rgba(17,17,17,0.045)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-5 max-w-[12rem] animate-pulse rounded-full bg-neutral-200/90" />
                        <div className="h-4 max-w-[10rem] animate-pulse rounded-full bg-neutral-200/75" />
                      </div>
                      <div className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-neutral-200/80" />
                    </div>
                    <div className="mt-4 flex justify-between gap-4">
                      <div className="space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded-full bg-neutral-200/80" />
                        <div className="h-3 w-40 animate-pulse rounded-full bg-neutral-200/70" />
                      </div>
                      <div className="h-6 w-14 shrink-0 animate-pulse rounded-md bg-neutral-200/80" />
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      <div className="h-9 flex-1 animate-pulse rounded-full bg-neutral-200/70" />
                      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-neutral-200/70" />
                      <div className="h-9 flex-1 animate-pulse rounded-full bg-neutral-200/70" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : !showApptList ? (
              <EmptyState title="Записей пока нет" buttonText="Найти услуги" picture="appointmentsEmpty" />
            ) : (
              <ul className="flex flex-col gap-3">
                {apptRows.map((row) => (
                  <li key={row.id}>
                    <AppointmentCard
                      row={row}
                      subTab={apptSubTab}
                      onDetails={openDetails}
                      onCancel={openCancel}
                      onReview={openReview}
                      onDownloadPdf={openDownloadPdf}
                    />
                  </li>
                ))}
              </ul>
            )}
            {apptHasMore && showApptList ? (
              <button
                type="button"
                disabled={apptLoadingMore}
                onClick={loadMoreClientAppointments}
                className="mt-3 min-h-11 w-full rounded-[14px] border border-[#EAECEF] bg-white text-[14px] font-semibold text-[#374151] transition hover:bg-[#FAFAFA] active:scale-[0.98] disabled:opacity-60"
              >
                {apptLoadingMore ? 'Загрузка…' : 'Показать ещё'}
              </button>
            ) : null}
          </section>
        ) : null}

        {mainTab === 'favorites' ? (
          <section className="mt-7 flex flex-col gap-3">
            <div
              className={`sticky z-20 -mx-4 bg-white px-4 pb-3 sm:-mx-5 sm:px-5 ${CLIENT_STICKY_BELOW_MOBILE_HEADER}`}
            >
              <div className="flex items-center rounded-[16px] bg-white px-4 py-4">
                <h2 className={clientProfileSectionTitle}>Избранное</h2>
              </div>
            </div>

            {!authLoading && !backendConfigured ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-950">
                Укажите VITE_API_URL, чтобы загрузить избранное.
              </p>
            ) : !authLoading && hasApiBackend() && !isAuthenticated ? (
              <NothingFoundCard
                title="Войдите в аккаунт"
                text="Войдите в аккаунт — избранные мастера сохранятся на сервере и будут доступны на всех устройствах."
              />
            ) : favoritesError ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">{favoritesError}</p>
            ) : favoritesLoading ? (
              <ul className="flex flex-col gap-3">
                {[0, 1].map((i) => (
                  <li key={i} className="rounded-[30px] bg-white p-4 shadow-[0_12px_34px_rgba(17,17,17,0.045)]">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 animate-pulse rounded-[20px] bg-neutral-200/80" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-5 max-w-[10rem] animate-pulse rounded-full bg-neutral-200/90" />
                        <div className="h-4 max-w-[8rem] animate-pulse rounded-full bg-neutral-200/75" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : favorites.length === 0 ? (
              <EmptyState title="Избранных пока нет" buttonText="Найти услуги" picture="clientsEmpty" />
            ) : (
              <ul className="flex flex-col gap-3">
                  {favorites.map((row, i) => (
                    <FavoriteMasterRow
                      key={row.masterId}
                      row={row}
                      onRemove={handleRemoveFavorite}
                      imagePriority={i < 8}
                    />
                  ))}
              </ul>
            )}
          </section>
        ) : null}

        {mainTab === 'profile' ? (
          <section className="mt-7">
            <div className="flex flex-col gap-2">
                <div className="rounded-[28px] border border-neutral-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
                  <p className="text-[13px] font-medium text-neutral-400">
                    Имя
                  </p>

                  <p className="mt-1 text-[17px] font-semibold text-neutral-950">
                    {displayName}
                  </p>
                </div>

                <div className="rounded-[28px] border border-neutral-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
                  <p className="text-[13px] font-medium text-neutral-400">
                    Telegram
                  </p>

                  <p className="mt-1 text-[17px] font-semibold text-neutral-950">
                    {profile?.telegram_username
                      ? `@${profile.telegram_username}`
                      : telegramUserPreview?.username
                        ? `@${telegramUserPreview.username}`
                        : isTelegramWebApp
                          ? 'Подключен'
                          : EMPTY_TELEGRAM}
                  </p>
                </div>

                <div className="rounded-[28px] border border-neutral-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
                  <p className="text-[13px] font-medium text-neutral-400">
                    Телефон
                  </p>

                  <p className="mt-1 text-[17px] font-semibold text-neutral-950">
                    <BelarusPhoneInline phone={profile?.phone} flagClassName="h-4 w-4 shrink-0 rounded-full object-cover" />
                  </p>
                </div>

                <div className="rounded-[28px] border border-neutral-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
                  <p className="text-[13px] font-medium text-neutral-400">
                    Адрес
                  </p>

                  <p className="mt-1 whitespace-pre-wrap break-words text-[17px] font-semibold text-neutral-950">
                    {profile?.address?.trim() ? profile.address.trim() : 'Не указан'}
                  </p>
                </div>

                <div className="rounded-[28px] border border-neutral-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
                  <p className="text-[13px] font-medium text-neutral-400">
                    Роль
                  </p>

                  <p className="mt-1 text-[17px] font-semibold text-neutral-950">
                    {profile?.role === 'master' ? 'Мастер SLOTTY' : profile ? 'Клиент SLOTTY' : 'Клиент SLOTTY'}
                  </p>
                </div>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => setEditProfileOpen(true)}
                    className="mt-1 flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#F1EFEF] px-5 text-[16px] font-semibold text-neutral-900 transition active:scale-[0.98]"
                  >
                    Редактировать
                  </button>
                ) : null}

                {!(clientShell && isMasterCabinet) ? (
                  <Link
                    to={isMasterCabinet ? ADMIN_PATH : BECOME_MASTER_PATH}
                    className="mt-1 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-[#E29595] px-5 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
                  >
                    {isMasterCabinet ? 'Кабинет мастера' : 'Стать мастером'}
                    <IconChevronRight className="h-4 w-4" />
                  </Link>
                ) : clientShell && isMasterCabinet ? (
                  <Link
                    to={ADMIN_PATH}
                    className="mt-1 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-[#E29595] px-5 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
                  >
                    Кабинет мастера
                    <IconChevronRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
          </section>
        ) : null}
        </div>
      </div>
      </div>

      {selectedAppointment ? (
        <AppointmentBottomSheet onClose={closeDetails} labelledBy="appointment-details-title">
          <ClientAppointmentDetailSheetContent
            row={selectedAppointment}
            onClose={closeDetails}
            onRefreshList={loadClientAppointments}
            onOpenReview={() => {
              const code = selectedAppointment?.voucherNumber?.trim();
              closeDetails();
              if (code) {
                navigate(getClientAppointmentReviewPath(code));
                return;
              }
              if (selectedAppointment) openReview(selectedAppointment);
            }}
          />
        </AppointmentBottomSheet>
      ) : null}

      {cancelModal.open ? (
        <AppointmentBottomSheet
          onClose={closeCancelModal}
          labelledBy={
            cancelModal.phase === 'success' ? 'cancel-success-title' : 'cancel-appointment-title'
          }
        >
          {cancelModal.phase === 'success' ? (
            <>
              <h2
                id="cancel-success-title"
                className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950"
              >
                Запись отменена
              </h2>

              <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
                Мастер увидит отмену в своём кабинете.
              </p>

              <button
                type="button"
                onClick={closeCancelModal}
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
              >
                Понятно
              </button>
            </>
          ) : (
            <>
              <h2
                id="cancel-appointment-title"
                className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950"
              >
                Отменить запись?
              </h2>

              <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
                Вы действительно хотите отменить запись к мастеру {cancelModal.row.masterName} на{' '}
                {cancelModal.row.dateLabel}, {cancelModal.row.timeLabel}?
              </p>

              <label className="mt-4 block">
                <span className="text-[13px] font-semibold text-neutral-700">Причина отмены</span>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Например: изменились планы"
                  className="mt-1.5 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none focus:border-[#E29595]"
                />
              </label>

              {cancelModal.phase === 'confirm' && cancelModal.apiError ? (
                <p className="mt-2 text-[14px] font-medium text-red-600">{cancelModal.apiError}</p>
              ) : null}

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={closeCancelModal}
                  disabled={cancelModal.phase === 'cancelling'}
                  className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Не отменять
                </button>

                <button
                  type="button"
                  onClick={confirmCancelAppointment}
                  disabled={cancelModal.phase === 'cancelling'}
                  className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelModal.phase === 'cancelling' ? 'Отмена…' : 'Отменить запись'}
                </button>
              </div>
            </>
          )}
        </AppointmentBottomSheet>
      ) : null}

      {reviewRow ? (
        <AppointmentBottomSheet onClose={closeReview} labelledBy="review-appointment-title">
          <div id="review-appointment-title" className="-mx-1">
            <ClientReviewForm
              compact
              showTags={false}
              masterName={reviewRow.masterName}
              serviceTitle={reviewRow.serviceTitle}
              rating={reviewRating}
              onRatingChange={setReviewRating}
              text={reviewBody}
              onTextChange={setReviewBody}
              tags={[]}
              onToggleTag={() => {}}
              submitError={null}
              submitting={reviewSubmitting}
              canSubmit={
                backendConfigured &&
                !reviewSubmitting &&
                reviewRating >= 1 &&
                reviewBody.trim().length >= 2
              }
              onSubmit={() => void submitReview()}
            />
          </div>
        </AppointmentBottomSheet>
      ) : null}

      <ProfileEditModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        profile={profile}
        isAuthenticated={isAuthenticated}
        refreshProfile={refreshProfile}
        telegramUserPhotoUrl={telegramUserPhotoUrl ?? null}
      />
    </div>
  );
}