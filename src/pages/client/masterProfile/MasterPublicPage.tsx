import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { MASTERS_PATH, getBookingPath } from '../../../app/paths';
import type { ClientOutletContext } from '../clientOutletContext';
import { useFavoriteMaster } from '../../../features/profile/hooks/useFavoriteMaster';
import { useClientErrorModal } from '../ClientErrorModalContext';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { EmptyState } from '../components/EmptyState';
import { MasterExtraSections } from './MasterExtraSections';
import { MasterHeroCard } from './MasterHeroCard';
import { MasterPortfolioRail } from './MasterPortfolioRail';
import { MasterProfileMobileToolbar } from './MasterProfileMobileToolbar';
import { MasterReviewsSection } from './MasterReviewsSection';
import { MasterServicesList } from './MasterServicesList';
import { MasterStickyActions } from './MasterStickyActions';
import { MasterTrustStats } from './MasterTrustStats';
import { PortfolioImagePreview } from './PortfolioImagePreview';
import { ServiceDetailSheet } from './ServiceDetailSheet';
import { CLIENT_HEADER_OFFSET, CLIENT_MASTER_PROFILE_PAD_BOTTOM } from '../clientNavConstants';
import { SkeletonMasterProfile } from './SkeletonMasterProfile';
import { MasterProfileDesktop } from './MasterProfileDesktop';
import { shareMasterProfile } from './masterProfileUtils';
import { useMasterNearestSlot } from './useMasterNearestSlot';
import { catalogCanvasClass } from './masterProfileTheme';
import { useMasterPublicProfile } from './useMasterPublicProfile';

export function MasterPublicPage() {
  const navigate = useNavigate();
  const { id: rawId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { userLat, userLng } = useOutletContext<ClientOutletContext>();
  const { showError } = useClientErrorModal();
  const masterId = useMemo(() => (rawId ? decodeURIComponent(rawId) : ''), [rawId]);
  const { isFavorite, toggleFavorite, favoriteDisabled } = useFavoriteMaster(masterId, (message) =>
    showError(message, { title: 'Избранное' }),
  );
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

  const [toast, setToast] = useState<string | null>(null);
  const [serviceSheet, setServiceSheet] = useState<DemoMasterService | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const portfolioUrls = useMemo(
    () => (master?.portfolio ?? []).map((p) => p.imageUrl).filter((u): u is string => Boolean(u?.trim())),
    [master?.portfolio],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const onShare = useCallback(async () => {
    if (!master) return;
    try {
      const result = await shareMasterProfile(master.masterName, window.location.href);
      showToast(result === 'shared' ? 'Ссылка отправлена' : 'Ссылка скопирована');
    } catch {
      showToast('Не удалось поделиться');
    }
  }, [master]);

  const goToBooking = useCallback(
    (serviceId?: string | null) => {
      const resolvedServiceId =
        serviceId ?? highlightServiceId ?? nearest?.serviceId ?? master?.services[0]?.id ?? null;
      navigate(getBookingPath(masterId, resolvedServiceId));
    },
    [navigate, masterId, highlightServiceId, nearest?.serviceId, master?.services],
  );

  if (!masterId) {
    return (
      <div className={`min-h-dvh ${catalogCanvasClass} px-4 sm:px-5 ${CLIENT_HEADER_OFFSET} ${CLIENT_MASTER_PROFILE_PAD_BOTTOM}`}>
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
      <>
        <div className={`hidden min-h-dvh lg:block ${catalogCanvasClass}`}>
          <SkeletonMasterProfile desktop />
        </div>
        <div className={`min-h-dvh lg:hidden ${catalogCanvasClass} ${CLIENT_HEADER_OFFSET}`}>
          <SkeletonMasterProfile />
        </div>
      </>
    );
  }

  if (error || !master) {
    return (
      <div className={`min-h-dvh ${catalogCanvasClass} px-4 sm:px-5 ${CLIENT_HEADER_OFFSET} ${CLIENT_MASTER_PROFILE_PAD_BOTTOM}`}>
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
    <>
      <MasterProfileDesktop
        master={master}
        userLat={userLat}
        userLng={userLng}
        nearest={nearest}
        nearestLoading={nearestLoading}
        isFavorite={isFavorite}
        favoriteDisabled={favoriteDisabled}
        onFavoriteToggle={() => void toggleFavorite()}
        onShare={() => void onShare()}
        onChooseTime={goToBooking}
        onPhoneUnavailable={() =>
          showToast(
            master.phone || master.contact
              ? 'Не удалось открыть набор номера. Попробуйте скопировать телефон из профиля.'
              : 'Телефон мастера не указан. Запишитесь онлайн или напишите в мессенджer из контактов.',
          )
        }
        highlightServiceId={highlightServiceId}
        onSelectService={setServiceSheet}
        onOpenGallery={setGalleryIndex}
        portfolioItems={master.portfolio ?? []}
      />

      <div className={`relative z-0 lg:hidden min-h-dvh ${catalogCanvasClass} ${CLIENT_HEADER_OFFSET} text-[#111827]`}>
        <div className="mx-auto w-full max-w-lg px-4 pt-1">
          <MasterProfileMobileToolbar
            masterName={master.masterName}
            isFavorite={isFavorite}
            onFavoriteToggle={() => void toggleFavorite()}
            favoriteDisabled={favoriteDisabled}
            onShare={() => void onShare()}
          />

          <main className={`space-y-4 pb-6 ${CLIENT_MASTER_PROFILE_PAD_BOTTOM}`}>
            <MasterHeroCard
              master={master}
              userLat={userLat}
              userLng={userLng}
              nearest={nearest}
              nearestLoading={nearestLoading}
              onChooseTime={() => goToBooking(nearest?.serviceId)}
            />

            <MasterServicesList
              services={master.services}
              categoryCode={master.categoryCode}
              categoryLabel={master.category}
              highlightServiceId={highlightServiceId}
              onSelect={setServiceSheet}
              onViewAll={() => goToBooking()}
            />

            {portfolioUrls.length > 0 ? (
              <MasterPortfolioRail
                items={master.portfolio ?? []}
                onOpenGallery={setGalleryIndex}
                onViewAll={() => setGalleryIndex(0)}
              />
            ) : null}

            <MasterTrustStats master={master} />
            <MasterReviewsSection reviews={master.reviews} />
            <MasterExtraSections master={master} />
          </main>

          <MasterStickyActions
            onChooseTime={() => goToBooking()}
            phone={master.phone}
            contact={master.contact}
            nearest={nearest}
            nearestLoading={nearestLoading}
            onPhoneUnavailable={() =>
              showToast(
                master.phone || master.contact
                  ? 'Не удалось открыть набор номера. Попробуйте скопировать телефон из профиля.'
                  : 'Телефон мастера не указан. Запишитесь онлайн или напишите в мессенджer из контактов.',
              )
            }
          />
        </div>
      </div>

      <ServiceDetailSheet
        open={Boolean(serviceSheet)}
        service={serviceSheet}
        paymentMethods={master.paymentMethods}
        paymentNote={master.paymentNote}
        onClose={() => setServiceSheet(null)}
        onChooseTime={() => goToBooking(serviceSheet?.id)}
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
          className="fixed left-1/2 top-[calc(5rem+env(safe-area-inset-top))] z-[80] -translate-x-1/2 rounded-full bg-[#111827]/90 px-4 py-2 text-[13px] font-medium text-white shadow-lg lg:top-24"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
