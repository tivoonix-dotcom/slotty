import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { MASTERS_PATH } from '../../../app/paths';
import type { ClientOutletContext } from '../clientOutletContext';
import { useAuth } from '../../../features/auth/AuthProvider';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import {
  addMyFavoriteMaster,
  fetchMyFavorites,
  removeMyFavoriteMaster,
} from '../../../features/profile/api/clientFavorites';
import {
  isFavoriteMasterId,
  setFavoriteMasterId,
} from '../../../features/profile/lib/favoriteMastersStorage';
import { useClientErrorModal } from '../ClientErrorModalContext';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { EmptyState } from '../components/EmptyState';
import { BookingTimeSheet } from './BookingTimeSheet';
import { MasterExtraSections } from './MasterExtraSections';
import { MasterHeroCard } from './MasterHeroCard';
import { MasterPortfolioRail } from './MasterPortfolioRail';
import { MasterProfileHeader } from './MasterProfileHeader';
import { MasterReviewsSection } from './MasterReviewsSection';
import { MasterServicesList } from './MasterServicesList';
import { MasterStickyActions } from './MasterStickyActions';
import { MasterTrustStats } from './MasterTrustStats';
import { PortfolioImagePreview } from './PortfolioImagePreview';
import { ServiceDetailSheet } from './ServiceDetailSheet';
import { CLIENT_MASTER_PROFILE_PAD_BOTTOM } from '../clientNavConstants';
import { SkeletonMasterProfile } from './SkeletonMasterProfile';
import { shareMasterProfile } from './masterProfileUtils';
import { useMasterNearestSlot } from './useMasterNearestSlot';
import { useMasterPublicProfile } from './useMasterPublicProfile';

export function MasterPublicPage() {
  const navigate = useNavigate();
  const { id: rawId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { userLat, userLng } = useOutletContext<ClientOutletContext>();
  const { isAuthenticated } = useAuth();
  const { showError } = useClientErrorModal();
  const masterId = useMemo(() => (rawId ? decodeURIComponent(rawId) : ''), [rawId]);
  const highlightServiceId = searchParams.get('service') ?? searchParams.get('service_id');

  const { master, loading, error, reload } = useMasterPublicProfile(masterId);
  const { nearest, loading: nearestLoading } = useMasterNearestSlot(master);

  useEffect(() => {
    if (!error) return;
    showError('Не удалось загрузить профиль мастера. Проверьте соединение.', {
      title: 'Мастер',
      onRetry: reload,
    });
  }, [error, reload, showError]);

  const [isFavorite, setIsFavorite] = useState(() =>
    masterId ? isFavoriteMasterId(masterId) : false,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const [serviceSheet, setServiceSheet] = useState<DemoMasterService | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const portfolioUrls = useMemo(
    () => (master?.portfolio ?? []).map((p) => p.imageUrl).filter((u): u is string => Boolean(u?.trim())),
    [master?.portfolio],
  );

  useEffect(() => {
    if (!masterId) {
      setIsFavorite(false);
      return;
    }
    setIsFavorite(isFavoriteMasterId(masterId));
    if (!isAuthenticated || !getApiBaseUrl()) return;

    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchMyFavorites();
        if (!cancelled) setIsFavorite(list.some((f) => f.masterId === masterId));
      } catch {
        /* local state */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [masterId, isAuthenticated]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const onFavoriteToggle = useCallback(async () => {
    if (!masterId) return;
    const wasFavorite = isFavorite;
    const next = !wasFavorite;
    setIsFavorite(next);

    if (isAuthenticated && getApiBaseUrl()) {
      try {
        if (next) await addMyFavoriteMaster(masterId);
        else await removeMyFavoriteMaster(masterId);
        setFavoriteMasterId(masterId, next);
      } catch (e) {
        setIsFavorite(wasFavorite);
        showError(e instanceof Error ? e.message : 'Не удалось обновить избранное', {
          title: 'Избранное',
        });
      }
      return;
    }

    setFavoriteMasterId(masterId, next);
  }, [isAuthenticated, isFavorite, masterId, showError]);

  const onShare = useCallback(async () => {
    if (!master) return;
    try {
      const result = await shareMasterProfile(master.masterName, window.location.href);
      showToast(result === 'shared' ? 'Ссылка отправлена' : 'Ссылка скопирована');
    } catch {
      showToast('Не удалось поделиться');
    }
  }, [master]);

  const openBooking = (serviceId?: string | null) => {
    setBookingServiceId(serviceId ?? highlightServiceId ?? nearest?.serviceId ?? null);
    setBookingOpen(true);
  };

  if (!masterId) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-32 pt-20">
        <EmptyState
          title="Мастер не найден"
          description="Попробуйте вернуться к каталогу"
          actionLabel="К мастерам"
          onAction={() => navigate(MASTERS_PATH)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-white pb-32">
        <SkeletonMasterProfile />
      </div>
    );
  }

  if (error || !master) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-32 pt-20">
        <EmptyState
          title={error ? 'Не получилось загрузить профиль мастера' : 'Мастер не найден'}
          description={error ? 'Проверьте соединение' : undefined}
          actionLabel={error ? 'Повторить' : 'К мастерам'}
          onAction={() => (error ? reload() : navigate(MASTERS_PATH))}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-[#111827]">
      <MasterProfileHeader
        isFavorite={isFavorite}
        onFavoriteToggle={() => void onFavoriteToggle()}
        onShare={() => void onShare()}
      />

      <main
        className={`mx-auto max-w-lg px-4 pt-[calc(4.25rem+env(safe-area-inset-top,0px))] ${CLIENT_MASTER_PROFILE_PAD_BOTTOM}`}
      >
        <MasterHeroCard
          master={master}
          userLat={userLat}
          userLng={userLng}
          nearest={nearest}
          nearestLoading={nearestLoading}
          onChooseTime={() => openBooking(nearest?.serviceId)}
        />

        {portfolioUrls.length > 0 ? (
          <MasterPortfolioRail
            items={master.portfolio ?? []}
            onOpenGallery={setGalleryIndex}
            onViewAll={() => setGalleryIndex(0)}
          />
        ) : null}

        <MasterServicesList
          services={master.services}
          categoryCode={master.categoryCode}
          categoryLabel={master.category}
          highlightServiceId={highlightServiceId}
          onSelect={setServiceSheet}
          onViewAll={() => openBooking()}
        />

        <MasterTrustStats master={master} />
        <MasterReviewsSection reviews={master.reviews} />
        <MasterExtraSections master={master} />
      </main>

      <MasterStickyActions
        onChooseTime={() => openBooking()}
        phone={master.phone}
        onPhoneUnavailable={() =>
          showToast('Телефон будет доступен после подтверждения записи')
        }
      />

      <BookingTimeSheet
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        master={master}
        initialServiceId={bookingServiceId}
      />

      <ServiceDetailSheet
        open={Boolean(serviceSheet)}
        service={serviceSheet}
        onClose={() => setServiceSheet(null)}
        onChooseTime={() => openBooking(serviceSheet?.id)}
      />

      {galleryIndex != null && portfolioUrls.length > 0 ? (
        <PortfolioImagePreview
          urls={portfolioUrls}
          index={galleryIndex}
          onClose={() => setGalleryIndex(null)}
          onIndexChange={setGalleryIndex}
        />
      ) : null}

      {toast ? (
        <div
          className="fixed left-1/2 top-[calc(5rem+env(safe-area-inset-top))] z-[80] -translate-x-1/2 rounded-full bg-[#111827]/90 px-4 py-2 text-[13px] font-medium text-white shadow-lg"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
