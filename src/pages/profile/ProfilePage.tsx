import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import { ADMIN_PATH, BECOME_MASTER_PATH, getMasterPath, getProfilePath, SERVICES_PATH } from '../../app/paths';
import { setProfileRole } from '../../features/profile/lib/setProfileRole';
import { isDemoMaster } from '../../features/profile/lib/demoMasterStorage';
import {
  type DemoAppointmentRecord,
  type DemoAppointmentStatus,
  type DemoAppointmentTab,
  buildYandexMapWidgetUrl,
  buildYandexMapsRouteUrl,
} from '../../features/appointments/model/demoAppointments';
import {
  emptyClientAppointments,
  splitClientAppointments,
  type ClientAppointmentsState,
  type ServerClientAppointment,
} from '../../features/appointments/api/clientAppointments';
import { masterLocationDetailRows } from '../../features/profile/model/masterLocation';
import {
  fetchMyFavorites,
  removeMyFavoriteMaster,
  type FavoriteMasterDto,
} from '../../features/profile/api/clientFavorites';
import {
  fetchMyNotifications,
  markNotificationReadApi,
  type MeNotificationRow,
} from '../../features/profile/api/clientNotifications';
import { useAuth } from '../../features/auth/AuthProvider';
import { openBookingVoucherPrint } from '../../features/booking/lib/bookingConfirmationVoucherPrint';
import { NothingFoundCard } from '../../shared/ui/NothingFoundCard';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { formatTelegramUserDisplayName } from '../../shared/lib/telegramWebApp';
import { apiFetch, getApiBaseUrl } from '../../shared/api/backendClient';
import { optimizeAvatarUrl } from '../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { HomeHeader } from '../HomeHeader';
import { formatBelarusPhoneDisplay } from '../../features/profile/lib/belarusPhone';
import { ClientSettingsSheet } from './components/ClientSettingsSheet';
import { ProfileEditModal } from './components/ProfileEditModal';

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

function IconRouteYandex({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="7" cy="17" r="2.5" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M9 15l6-6M15 9h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type MainTab = 'appointments' | 'favorites' | 'profile';

function formatNotificationListTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  const timePart = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Сегодня, ${timePart}`;
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const ySame =
    d.getFullYear() === yest.getFullYear() && d.getMonth() === yest.getMonth() && d.getDate() === yest.getDate();
  if (ySame) return `Вчера, ${timePart}`;
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function parseMainTab(tabParam: string | null): MainTab {
  if (tabParam === 'appointments') return 'appointments';
  if (tabParam === 'favorites') return 'favorites';
  return 'profile';
}

function statusLabelRu(status: DemoAppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Подтверждена';
    case 'pending':
      return 'Ожидает';
    case 'completed':
      return 'Завершена';
    case 'cancelled':
      return 'Отменена';
    default:
      return status;
  }
}

function statusClassName(status: DemoAppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-[#EAFBF2] text-[#2F8A5B]';
    case 'pending':
      return 'bg-[#FFF4E8] text-[#B66A24]';
    case 'completed':
      return 'bg-[#EEF2FF] text-[#5B63B7]';
    case 'cancelled':
      return 'bg-[#F3F1F1] text-neutral-500';
    default:
      return 'bg-[#F3F1F1] text-neutral-500';
  }
}

function formatPriceByn(price: number): string {
  return `${price} BYN`;
}

function statusDetailsRu(status: DemoAppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Подтверждена';
    case 'pending':
      return 'Ожидает подтверждения';
    case 'completed':
      return 'Завершена';
    case 'cancelled':
      return 'Отменена';
    default:
      return status;
  }
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
          <button
            type="button"
            onClick={() => onReview(row)}
            className={`${btnBase} bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.22)]`}
          >
            <IconReviewStar className="shrink-0 opacity-95" />
            Отзыв
          </button>
        ) : (
          <span className={`${btnBase} cursor-default bg-[#F3F1F1] text-neutral-400 active:scale-100`}>
            {row.status === 'cancelled' ? 'Отменена' : 'Завершена'}
          </span>
        )}
      </div>
    </article>
  );
}

function NotificationCard({
  item,
  index = 0,
  onAfterRead,
}: {
  item: MeNotificationRow;
  index?: number;
  onAfterRead?: () => void;
}) {
  const isNew = !item.read_at;

  const onClick = useCallback(() => {
    if (item.read_at) return;
    void (async () => {
      try {
        await markNotificationReadApi(item.id);
        onAfterRead?.();
      } catch {
        /* ignore */
      }
    })();
  }, [item.id, item.read_at, onAfterRead]);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`animate-fade-enter rounded-[26px] px-4 py-3.5 ring-1 ${
        isNew
          ? 'bg-white ring-[#E29595]/18 shadow-[0_10px_30px_rgba(226,149,149,0.1)]'
          : 'bg-white ring-black/[0.03] shadow-[0_6px_22px_rgba(17,17,17,0.04)]'
      }`}
      style={{ animationDelay: `${index * 52}ms` }}
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
            isNew ? 'bg-[#FDF8F8] text-[#E29595]' : 'bg-[#F1EFEF] text-neutral-500'
          }`}
          aria-hidden
        >
          <IconBell className="h-[18px] w-[18px] shrink-0" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-[16px] font-semibold leading-snug tracking-[-0.035em] text-neutral-950">
              {item.title}
            </p>

            <time className="shrink-0 pt-0.5 text-right text-[12px] font-medium leading-tight text-neutral-400 tabular-nums">
              {formatNotificationListTime(item.created_at)}
            </time>
          </div>

          <p className="mt-2 text-[14px] leading-[1.5] text-neutral-500">{item.body}</p>
        </div>
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
}: {
  title: string;
  text: string;
  buttonText: string;
}) {
  return (
    <NothingFoundCard
      title={title}
      text={text}
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

function DetailSheetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-[14px] first:pt-0 last:pb-0">
      <span className="shrink-0 font-medium text-neutral-500">{label}</span>
      <span className="min-w-0 text-right font-semibold text-neutral-950">{value}</span>
    </div>
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
  const { isTelegramWebApp, telegramUserPhotoUrl, telegramUserPreview } = useTelegram();
  const isMasterCabinet = isDemoMaster() || profile?.role === 'master';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [apptSubTab, setApptSubTab] = useState<DemoAppointmentTab>('upcoming');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const closeNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  const sheetBlocksScroll = isNotificationsOpen || editProfileOpen || settingsOpen;

  useEffect(() => {
    if (!sheetBlocksScroll) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeNotifications();
      setEditProfileOpen(false);
      setSettingsOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sheetBlocksScroll, closeNotifications]);

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

  const { displayName, roleSubtitle, initialLetter } = useMemo(() => {
    if (profile) {
      const name = profile.full_name;
      const sub = profile.role === 'master' ? 'Мастер\u00a0SLOTTY' : 'Клиент\u00a0SLOTTY';
      const t = name.trim();
      const ini = t.length ? t[0]!.toUpperCase() : '?';
      return { displayName: name, roleSubtitle: sub, initialLetter: ini };
    }
    if (telegramUserPreview) {
      const name = formatTelegramUserDisplayName(telegramUserPreview);
      const t = name.trim();
      const ini = t.length ? t[0]!.toUpperCase() : '?';
      return { displayName: name, roleSubtitle: 'Клиент\u00a0SLOTTY', initialLetter: ini };
    }
    return { displayName: 'Гость', roleSubtitle: 'Войдите через Telegram', initialLetter: '?' };
  }, [profile, telegramUserPreview]);

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
  const [apptError, setApptError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<FavoriteMasterDto[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<MeNotificationRow[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<CancelModalState>({ open: false });
  const [reviewAppointmentId, setReviewAppointmentId] = useState<string | null>(null);

  const loadClientAppointments = useCallback(async () => {
    const base = getApiBaseUrl();
    if (!isAuthenticated || !base) {
      setApptState(emptyClientAppointments());
      setApptError(null);
      setApptListLoading(false);
      return;
    }
    setApptListLoading(true);
    setApptError(null);
    try {
      const res = await apiFetch('/api/me/appointments');
      if (!res.ok) {
        setApptState(emptyClientAppointments());
        setApptError(
          res.status === 401 ? 'Сессия истекла. Откройте приложение снова.' : 'Не удалось загрузить записи.',
        );
        return;
      }
      const data = (await res.json()) as { appointments?: ServerClientAppointment[] };
      setApptState(splitClientAppointments(data.appointments ?? []));
    } catch {
      setApptState(emptyClientAppointments());
      setApptError('Нет соединения с сервером.');
    } finally {
      setApptListLoading(false);
    }
  }, [isAuthenticated]);

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated || !getApiBaseUrl()) {
      setFavorites([]);
      setFavoritesError(null);
      return;
    }
    setFavoritesLoading(true);
    setFavoritesError(null);
    try {
      setFavorites(await fetchMyFavorites());
    } catch {
      setFavorites([]);
      setFavoritesError('Не удалось загрузить избранное.');
    } finally {
      setFavoritesLoading(false);
    }
  }, [isAuthenticated]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !getApiBaseUrl()) {
      setNotifications([]);
      setNotificationsError(null);
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      setNotifications(await fetchMyNotifications());
    } catch {
      setNotifications([]);
      setNotificationsError('Не удалось загрузить уведомления.');
    } finally {
      setNotificationsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadClientAppointments();
    void loadFavorites();
    void loadNotifications();
  }, [loadClientAppointments, loadFavorites, loadNotifications, searchParams]);

  const handleRemoveFavorite = useCallback(async (masterId: string) => {
    setFavoritesError(null);
    try {
      await removeMyFavoriteMaster(masterId);
      setFavorites((prev) => prev.filter((f) => f.masterId !== masterId));
    } catch {
      setFavoritesError('Не удалось убрать из избранного.');
    }
  }, []);

  const selectedAppointment = useMemo(() => {
    if (!selectedAppointmentId) return null;
    return [...apptState.upcoming, ...apptState.past].find((r) => r.id === selectedAppointmentId) ?? null;
  }, [selectedAppointmentId, apptState]);

  const reviewRow = useMemo(() => {
    if (!reviewAppointmentId) return null;
    return apptState.past.find((r) => r.id === reviewAppointmentId) ?? null;
  }, [reviewAppointmentId, apptState]);

  const openDetails = useCallback((row: DemoAppointmentRecord) => {
    setSelectedAppointmentId(row.id);
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedAppointmentId(null);
  }, []);

  const openCancel = useCallback((row: DemoAppointmentRecord) => {
    setSelectedAppointmentId(null);
    setCancelModal({ open: true, phase: 'confirm', row });
  }, []);

  const openCancelFromDetails = useCallback(() => {
    if (!selectedAppointment || selectedAppointment.status === 'cancelled') return;
    const row = selectedAppointment;
    setSelectedAppointmentId(null);
    setCancelModal({ open: true, phase: 'confirm', row });
  }, [selectedAppointment]);

  const closeCancelModal = useCallback(() => {
    setCancelModal({ open: false });
  }, []);

  const confirmCancelAppointment = useCallback(() => {
    setCancelModal((m) => {
      if (!m.open || m.phase !== 'confirm' || !m.row) return m;
      const row = m.row;
      void (async () => {
        try {
          const res = await apiFetch(`/api/me/appointments/${encodeURIComponent(row.id)}/cancel`, {
            method: 'PATCH',
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
  }, [loadClientAppointments]);

  const openReview = useCallback((row: DemoAppointmentRecord) => {
    setSelectedAppointmentId(null);
    setReviewAppointmentId(row.id);
  }, []);

  const closeReview = useCallback(() => {
    setReviewAppointmentId(null);
  }, []);

  const openDownloadPdf = useCallback((row: DemoAppointmentRecord) => {
    openBookingVoucherPrint(demoAppointmentToVoucherPayload(row), HEADER_LOGO_SRC);
  }, []);

  const isDetailsUpcoming = useMemo(
    () =>
      Boolean(selectedAppointment && apptState.upcoming.some((a) => a.id === selectedAppointment.id)),
    [apptState.upcoming, selectedAppointment],
  );

  const apptRows = apptSubTab === 'upcoming' ? apptState.upcoming : apptState.past;
  const showApptList = apptRows.length > 0;
  const hasNewNotifications = notifications.some((n) => !n.read_at);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-0 text-neutral-900">
      <HomeHeader isDemoMaster={isMasterCabinet} onProfileTab={onProfileTab} />

      <div className="mx-auto w-full max-w-lg px-4 sm:px-5">
        <div className="bg-white pb-5 pt-[calc(5.5rem+env(safe-area-inset-top,0px))]">
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
                  ) : profile?.avatar_url ? (
                    <ImageReveal src={profile.avatar_url} alt="" className="h-full w-full object-cover" loading="eager" />
                  ) : telegramUserPreview?.photoUrl ? (
                    <ImageReveal
                      src={telegramUserPreview.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center" aria-hidden>
                      {initialLetter}
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
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(true);
                    void loadNotifications();
                  }}
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
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Настройки"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1EFEF] text-neutral-800 shadow-[0_8px_24px_rgba(17,17,17,0.06)] transition hover:bg-[#ebe8e8] active:scale-[0.97]"
                >
                  <IconGear className="h-[22px] w-[22px] shrink-0" />
                </button>
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

        <div className="scrollbar-hidden w-full min-w-0">
        {mainTab === 'appointments' ? (
          <section className="mt-7">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="whitespace-nowrap text-[26px] font-semibold tracking-[-0.055em] text-neutral-950">
                Мои записи
              </h2>

              <div className="flex w-full shrink-0 rounded-full border border-neutral-200/70 bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:w-auto">
                <button
                  type="button"
                  onClick={() => setApptSubTab('upcoming')}
                  className={`
                    min-h-11
                    flex-1
                    rounded-full
                    px-4
                    py-2.5
                    text-[13px]
                    font-semibold
                    transition
                    active:scale-[0.98]
                    ${
                      apptSubTab === 'upcoming'
                        ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                        : 'text-neutral-500'
                    }
                  `}
                >
                  Предстоящие
                </button>

                <button
                  type="button"
                  onClick={() => setApptSubTab('past')}
                  className={`
                    min-h-11
                    flex-1
                    rounded-full
                    px-4
                    py-2.5
                    text-[13px]
                    font-semibold
                    transition
                    active:scale-[0.98]
                    ${
                      apptSubTab === 'past'
                        ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                        : 'text-neutral-500'
                    }
                  `}
                >
                  История
                </button>
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
              <EmptyState
                title="Записей пока нет"
                text="Выберите мастера и удобное время — запись появится здесь."
                buttonText="Найти услуги"
              />
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
          </section>
        ) : null}

        {mainTab === 'favorites' ? (
          <section className="mt-7">
            {!authLoading && !backendConfigured ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-950">
                Укажите VITE_API_URL, чтобы загрузить избранное.
              </p>
            ) : !authLoading && !isAuthenticated ? (
              <NothingFoundCard
                title="Войдите в аккаунт"
                text="Избранные мастера хранятся в вашем профиле на сервере. Откройте приложение в Telegram."
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
              <EmptyState
                title="Избранных пока нет"
                text="Сохраняйте мастеров, чтобы быстрее записываться снова."
                buttonText="Найти услуги"
              />
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
                          : '—'}
                  </p>
                </div>

                <div className="rounded-[28px] border border-neutral-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
                  <p className="text-[13px] font-medium text-neutral-400">
                    Телефон
                  </p>

                  <p className="mt-1 text-[17px] font-semibold text-neutral-950">
                    {profile?.phone ? formatBelarusPhoneDisplay(profile.phone) : 'Не указан'}
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

                <Link
                  to={isMasterCabinet ? ADMIN_PATH : BECOME_MASTER_PATH}
                  className="mt-1 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-[#E29595] px-5 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
                >
                  {isMasterCabinet ? 'Кабинет мастера' : 'Стать мастером'}
                  <IconChevronRight className="h-4 w-4" />
                </Link>
              </div>
          </section>
        ) : null}
        </div>
      </div>

      {selectedAppointment ? (
        <AppointmentBottomSheet onClose={closeDetails} labelledBy="appointment-details-title">
          <h2
            id="appointment-details-title"
            className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950"
          >
            Детали записи
          </h2>

          <div className="mt-4 rounded-[28px] border border-neutral-200/70 bg-white px-4 py-3 shadow-[0_4px_20px_rgba(17,17,17,0.04)]">
            <DetailSheetRow label="Мастер" value={selectedAppointment.masterName} />
            <DetailSheetRow label="Услуга" value={selectedAppointment.serviceTitle} />
            <DetailSheetRow label="Дата" value={selectedAppointment.dateLabel} />
            <DetailSheetRow label="Время" value={selectedAppointment.timeLabel} />
            {masterLocationDetailRows(selectedAppointment.location).map((line) => (
              <DetailSheetRow key={line.label} label={line.label} value={line.value} />
            ))}
            <DetailSheetRow label="Стоимость" value={formatPriceByn(selectedAppointment.price)} />
            <DetailSheetRow label="Статус" value={statusDetailsRu(selectedAppointment.status)} />
          </div>

          <div className="mt-4 overflow-hidden rounded-[28px] border border-neutral-200/70 bg-white p-2 shadow-[0_4px_20px_rgba(17,17,17,0.04)]">
            <p className="px-2 pb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Яндекс.Карты
            </p>
            <div className="overflow-hidden rounded-[22px] bg-neutral-200 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.04)]">
              <iframe
                title={`Карта: ${selectedAppointment.addressShort}`}
                src={buildYandexMapWidgetUrl(selectedAppointment)}
                className="block h-[min(220px,42dvh)] w-full min-h-[180px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={buildYandexMapsRouteUrl(selectedAppointment)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-[22px] bg-white px-4 py-2.5 text-[14px] font-semibold text-neutral-900 shadow-[0_4px_14px_rgba(17,17,17,0.06)] transition active:scale-[0.98] hover:bg-neutral-50"
            >
              <IconRouteYandex className="shrink-0 text-[#E29595]" />
              Построить маршрут в Яндекс.Картах
            </a>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-neutral-500">
            Мы напомним вам о визите в Telegram.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              title="Откроется диалог печати — выберите «Сохранить как PDF»"
              onClick={() => openBookingVoucherPrint(demoAppointmentToVoucherPayload(selectedAppointment), HEADER_LOGO_SRC)}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border-2 border-[#E29595] bg-white text-[14px] font-semibold text-[#c47878] transition hover:bg-[#fff8f8] active:scale-[0.99]"
            >
              <IconPdf className="h-4 w-4 shrink-0" />
              Скачать PDF
            </button>

            <button
              type="button"
              onClick={closeDetails}
              className="flex min-h-10 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]"
            >
              Закрыть
            </button>

            {isDetailsUpcoming && selectedAppointment.status !== 'cancelled' ? (
              <button
                type="button"
                onClick={openCancelFromDetails}
                className="flex min-h-10 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
              >
                Отменить запись
              </button>
            ) : null}

            {!isDetailsUpcoming && selectedAppointment.status === 'completed' ? (
              <button
                type="button"
                onClick={() => openReview(selectedAppointment)}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-[#E29595] px-4 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
              >
                <IconReviewStar className="h-4 w-4 shrink-0 opacity-95" />
                Оставить отзыв
              </button>
            ) : null}
          </div>
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
          {/* TODO: create review form and insert into reviews. */}
          <h2
            id="review-appointment-title"
            className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950"
          >
            Оставить отзыв
          </h2>

          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            Отзывы появятся после подключения базы данных.
          </p>

          <button
            type="button"
            onClick={closeReview}
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
          >
            Понятно
          </button>
        </AppointmentBottomSheet>
      ) : null}

      {isNotificationsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-[max(2.5rem,env(safe-area-inset-top,0px))] sm:items-center sm:px-4 sm:py-8">
          <button
            type="button"
            className="animate-notif-backdrop absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            aria-label="Закрыть уведомления"
            onClick={closeNotifications}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notifications-title"
            className="animate-notif-sheet relative flex max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-t-[38px] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:rounded-[38px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-neutral-300/90 sm:hidden" aria-hidden />

            <div className="flex shrink-0 items-start justify-between gap-4 px-4 pb-3 pt-0.5 sm:px-5 sm:pb-4 sm:pt-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">SLOTTY</p>

                <h2
                  id="notifications-title"
                  className="mt-1.5 text-[26px] font-semibold tracking-[-0.055em] text-neutral-950"
                >
                  Уведомления
                </h2>
              </div>

              <button
                type="button"
                onClick={closeNotifications}
                aria-label="Закрыть уведомления"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-neutral-800 transition hover:bg-[#e8e4e4] active:scale-[0.96]"
              >
                <IconClose />
              </button>
            </div>

            <div className="scrollbar-hidden min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-4">
              {notificationsError ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">{notificationsError}</p>
              ) : notificationsLoading ? (
                <div className="space-y-2">
                  <div className="h-20 animate-pulse rounded-[26px] bg-neutral-100" />
                  <div className="h-20 animate-pulse rounded-[26px] bg-neutral-100" />
                </div>
              ) : notifications.length === 0 ? (
                <NothingFoundCard title="Пока тихо" text="Когда появятся новости о записях, они окажутся здесь." />
              ) : (
                <ul className="flex flex-col gap-2.5 [-webkit-overflow-scrolling:touch] sm:gap-3">
                  {notifications.map((item, index) => (
                    <li key={item.id}>
                      <NotificationCard
                        item={item}
                        index={index}
                        onAfterRead={() => void loadNotifications()}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ProfileEditModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        profile={profile}
        isAuthenticated={isAuthenticated}
        refreshProfile={refreshProfile}
        telegramUserPhotoUrl={telegramUserPhotoUrl ?? null}
      />
      <ClientSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}