import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  getClientAppointmentPath,
  getClientAppointmentReviewPath,
  getProfilePath,
  PROFILE_NOTIFICATIONS_PATH,
  PROFILE_PATH,
} from '../../app/paths';
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
import { useClientNotifications } from './notifications/ClientNotificationsContext';
import { useAuth } from '../../features/auth/AuthProvider';
import { AccountAccessRestrictedBanner } from '../../features/auth/components/AccountAccessBanner';
import { AccountBlockedScreen } from '../../features/auth/components/AccountBlockedScreen';
import { useAccountAccess } from '../../features/auth/hooks/useAccountAccess';
import { openBookingVoucherPrint } from '../../features/booking/lib/bookingConfirmationVoucherPrint';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { formatTelegramUserDisplayName } from '../../shared/lib/telegramWebApp';
import { formatClientName } from '../../shared/lib/displayFormat';
import { apiFetch, getApiBaseUrl } from '../../shared/api/backendClient';
import { postClientReview } from '../../features/profile/api/clientReviews';
import { useClientErrorModal } from '../client/ClientErrorModalContext';
import { profileDisplayAvatarUrl, profileDisplayInitials } from '../../features/profile/lib/profileDisplayAvatar';
import { HomeHeader } from '../HomeHeader';
import type { ClientOutletContext } from '../client/clientOutletContext';
import { CLIENT_CONTENT_PAD_BOTTOM } from '../client/clientNavConstants';
import { ProfileEditModal } from './components/ProfileEditModal';
import { ClientProfileDesktop } from './clientProfile/ClientProfileDesktop';
import {
  getClientCabinetMobileTabPath,
  resolveClientCabinetMobileTab,
  type ClientProfileMainTab,
} from './clientProfile/clientCabinetMobileTabs';
import { formatPriceByn, statusLabelRu } from './profileFormat';
import { subscribeBookingDataRefresh } from '../../features/appointments/bookingDataSync';

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

  const { hasUnread: hasNewNotifications, unreadCount: clientNotificationCount } = useClientNotifications();

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
    () => resolveClientCabinetMobileTab(PROFILE_PATH, `?${searchParams.toString()}`),
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
    (tab: ClientProfileMainTab) => {
      navigate(getClientCabinetMobileTabPath(tab));
    },
    [navigate],
  );

  useEffect(() => {
    if (searchParams.get('tab') === 'notifications') {
      navigate(PROFILE_NOTIFICATIONS_PATH, { replace: true });
    }
  }, [navigate, searchParams]);

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
    [isAuthenticated, profile?.id],
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
            await syncLocalFavoritesToServer({ force: false });
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
    if (mainTab !== 'appointments') return;
    void loadClientAppointments();
  }, [mainTab, loadClientAppointments]);

  useEffect(() => {
    return subscribeBookingDataRefresh(() => {
      if (mainTab === 'appointments') void loadClientAppointments();
    });
  }, [loadClientAppointments, mainTab]);

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
          next.delete('focus');
          next.delete('code');
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
    }
  }, [isAuthenticated]);

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
    openBookingVoucherPrint(demoAppointmentToVoucherPayload(row));
  }, []);

  const apptRows = apptSubTab === 'upcoming' ? apptState.upcoming : apptState.past;

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
      className={`min-h-dvh overflow-x-hidden text-neutral-900 ${
        clientShell
          ? 'max-lg:h-dvh max-lg:overflow-hidden max-lg:bg-[#F5F5F5] lg:h-dvh lg:overflow-hidden lg:bg-[#f6f7fb] lg:p-0'
          : `${CLIENT_CONTENT_PAD_BOTTOM} bg-white pb-[calc(2rem+env(safe-area-inset-bottom,0px))] lg:pb-0 lg:bg-[#F5F5F5]`
      }`}
    >
      {!clientShell ? (
        <HomeHeader isDemoMaster={isMasterCabinet} onProfileTab={onProfileTab} />
      ) : null}

      {accountAccess.showRestrictedBanner ? (
        <div
          className={`mx-auto w-full px-4 pt-3 sm:px-5 ${
            clientShell ? 'max-w-none lg:px-8' : 'max-w-lg'
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
        notificationCount={clientNotificationCount}
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