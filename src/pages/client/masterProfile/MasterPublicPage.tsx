import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { LOGIN_PATH, SERVICES_PATH, getBookingPath, getMasterPath } from '../../../app/paths';
import { SeoHead } from '../../../shared/seo/SeoHead';
import { truncateMetaDescription } from '../../../shared/seo/seoConfig';
import { JsonLd } from '../../../shared/seo/JsonLd';
import { buildMasterProfileStructuredData } from '../../../shared/seo/masterStructuredData';
import { ANALYTICS_EVENTS, trackAnalyticsEvent } from '../../../shared/analytics/analyticsEvents';
import { resolveSeoImageUrl } from '../../../shared/seo/seoImageUrl';
import { SEO_DEFAULT_ROBOTS, SEO_NOINDEX_ROBOTS } from '../../../shared/seo/seoSite';
import type { ClientOutletContext } from '../clientOutletContext';
import { useFavoriteMaster } from '../../../features/profile/hooks/useFavoriteMaster';
import { useClientErrorModal } from '../ClientErrorModalContext';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { EmptyState } from '../components/EmptyState';
import { MasterProfileMainContent } from './MasterProfileMainContent';
import { MasterProfileStatsRow } from './MasterProfileStatsRow';
import { MasterProfileHeroCoverStack } from './MasterProfileHeroCoverStack';
import { MasterProfileMobileToolbar } from './MasterProfileMobileToolbar';
import { MasterPublicHeroSection } from './MasterPublicHeroSection';
import { MasterStickyActions } from './MasterStickyActions';
import { masterProfileCanvasClass, masterProfileHeroContentOverlapClass } from './masterProfileTheme';
import { PortfolioImagePreview } from './PortfolioImagePreview';
import { ServiceDetailSheet } from './ServiceDetailSheet';
import { CLIENT_MASTER_PROFILE_PAD_BOTTOM, CLIENT_MOBILE_PAGE_TOP } from '../clientNavConstants';
import { SkeletonMasterProfile } from './SkeletonMasterProfile';
import { MasterProfileDesktop } from './MasterProfileDesktop';
import { shareMasterProfile } from './masterProfileUtils';
import { useMasterNearestSlot } from './useMasterNearestSlot';
import { catalogCanvasClass } from './masterProfileTheme';
import { useMasterPublicProfile } from './useMasterPublicProfile';
import { useMasterTopRankStatus } from './useMasterTopRankStatus';
import { MasterProfileReportSheet } from './MasterProfileReportSheet';

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
  const topRankStatus = useMasterTopRankStatus(master, nearest);
  const topAchievements = topRankStatus.achievements;
  const topAchievementsReady = topRankStatus.ready ?? true;

  const errorModalShownRef = useRef(false);

  useEffect(() => {
    if (!error) {
      errorModalShownRef.current = false;
      return;
    }
    if (errorModalShownRef.current) return;
    errorModalShownRef.current = true;
    showError('Не удалось загрузить профиль мастера. Проверьте соединение.', {
      title: 'Мастер',
      onRetry: () => {
        errorModalShownRef.current = false;
        reload();
      },
    });
  }, [error, reload, showError]);

  const [toast, setToast] = useState<string | null>(null);
  const [serviceSheet, setServiceSheet] = useState<DemoMasterService | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const portfolioUrls = useMemo(
    () => (master?.portfolio ?? []).map((p) => p.imageUrl).filter((u): u is string => Boolean(u?.trim())),
    [master?.portfolio],
  );

  const masterSeoMeta = useMemo(() => {
    if (loading) return null;
    if (error || !master) {
      return {
        title: 'Мастер не найден | SLOTTY',
        description: 'Профиль мастера недоступен или ещё не опубликован.',
        robots: SEO_NOINDEX_ROBOTS,
      };
    }
    const bio = master.bio?.trim();
    const categoryLabel = master.category?.trim();
    const locationCity = master.location?.city?.trim() || 'Минск';
    const description = bio
      ? truncateMetaDescription(bio)
      : truncateMetaDescription(
          `${master.masterName}: услуги, цены и онлайн-запись в ${locationCity}${categoryLabel ? ` · ${categoryLabel}` : ''}.`,
        );
    return {
      title: `${master.masterName} — онлайн-запись | SLOTTY`,
      description,
      robots: SEO_DEFAULT_ROBOTS,
      canonicalPath: getMasterPath(masterId),
      ogImage: resolveSeoImageUrl(master.photoUrl),
    };
  }, [master, masterId, loading, error]);

  const masterStructuredData = useMemo(() => {
    if (!master) return null;
    return buildMasterProfileStructuredData({ master, masterId });
  }, [master, masterId]);

  useEffect(() => {
    if (!master) return;
    trackAnalyticsEvent(ANALYTICS_EVENTS.masterProfileOpen, {
      category_code: master.categoryCode ?? undefined,
    });
  }, [master]);

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

  const openReport = useCallback(() => setReportOpen(true), []);

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
      <div className={`min-h-dvh ${catalogCanvasClass} px-4 sm:px-5 ${CLIENT_MOBILE_PAGE_TOP} ${CLIENT_MASTER_PROFILE_PAD_BOTTOM}`}>
        <EmptyState
          title="Мастер не найден"
          description="Попробуйте вернуться к каталогу"
          actionLabel="К мастерам"
          onAction={() => navigate(SERVICES_PATH)}
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
        <div className={`min-h-dvh lg:hidden ${catalogCanvasClass} ${CLIENT_MOBILE_PAGE_TOP}`}>
          <SkeletonMasterProfile />
        </div>
      </>
    );
  }

  if (error || !master) {
    return (
      <div className={`min-h-dvh ${catalogCanvasClass} px-4 sm:px-5 ${CLIENT_MOBILE_PAGE_TOP} ${CLIENT_MASTER_PROFILE_PAD_BOTTOM}`}>
        <EmptyState
          title={error ? 'Не получилось загрузить профиль мастера' : 'Мастер не найден'}
          description={error ? 'Проверьте соединение' : undefined}
          actionLabel={error ? 'Повторить' : 'К мастерам'}
          onAction={() => (error ? reload() : navigate(SERVICES_PATH))}
        />
      </div>
    );
  }

  return (
    <>
      {masterSeoMeta ? <SeoHead meta={masterSeoMeta} /> : null}
      {masterStructuredData ? <JsonLd data={masterStructuredData} /> : null}
      <MasterProfileDesktop
        master={master}
        userLat={userLat}
        userLng={userLng}
        nearest={nearest}
        nearestLoading={nearestLoading}
        topAchievements={topAchievements}
        topAchievementsReady={topAchievementsReady}
        isFavorite={isFavorite}
        favoriteDisabled={favoriteDisabled}
        onFavoriteToggle={() => void toggleFavorite()}
        onShare={() => void onShare()}
        onReport={openReport}
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

      <div className={`relative z-0 lg:hidden min-h-dvh ${masterProfileCanvasClass} pt-0 text-[#111827]`}>
        <MasterProfileHeroCoverStack
          master={master}
          layout="mobile"
          toolbar={
            <MasterProfileMobileToolbar
              masterName={master.masterName}
              showPro={master.isProEntitled === true}
              isFavorite={isFavorite}
              onFavoriteToggle={() => void toggleFavorite()}
              favoriteDisabled={favoriteDisabled}
              onShare={() => void onShare()}
              onReport={openReport}
            />
          }
        />

        <div className={`mx-auto w-full max-w-lg px-4 ${masterProfileHeroContentOverlapClass}`}>
          <main className={`space-y-4 pb-6 ${CLIENT_MASTER_PROFILE_PAD_BOTTOM}`}>
            <MasterPublicHeroSection
              master={master}
              userLat={userLat}
              userLng={userLng}
              nearest={nearest}
              nearestLoading={nearestLoading}
              layout="mobile"
              profileCardOnly
              onChooseTime={() => goToBooking(nearest?.serviceId)}
            />

            <MasterProfileStatsRow
              master={master}
              nearest={nearest}
              nearestLoading={nearestLoading}
              layout="mobile"
              onChooseTime={goToBooking}
            />

            <MasterProfileMainContent
              master={master}
              topAchievements={topAchievements}
        topAchievementsReady={topAchievementsReady}
              highlightServiceId={highlightServiceId}
              portfolioItems={master.portfolio ?? []}
              onSelectService={setServiceSheet}
              onChooseTime={goToBooking}
              onOpenGallery={setGalleryIndex}
              onBookFromReviews={() => goToBooking(nearest?.serviceId)}
              layout="mobile"
            />
          </main>

          <MasterStickyActions
            master={master}
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
        categoryCode={master.categoryCode}
        categoryLabel={master.category}
        paymentMethods={master.paymentMethods}
        payment={master.payment}
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

      <MasterProfileReportSheet
        open={reportOpen}
        masterId={master.masterId}
        masterName={master.masterName}
        onClose={() => setReportOpen(false)}
        onSuccess={() => showToast('Жалоба отправлена в админку')}
        onNeedLogin={() => {
          setReportOpen(false);
          navigate(`${LOGIN_PATH}?from=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }}
      />
    </>
  );
}
