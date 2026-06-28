import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiCalendarDays,
  HiClock,
  HiHeart,
  HiHomeModern,
  HiMapPin,
  HiStar,
} from 'react-icons/hi2';
import { masterShowsVerifiedBadge } from '../../../features/masters/lib/masterVerifiedBadge';
import { MasterInlineBadges } from '../../../shared/ui/MasterInlineBadges';
import { getBookingPath, getMasterPath } from '../../../app/paths';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import {
  getCategoryWorkPhotoUrl,
  resolveCategoryWorkCode,
} from '../../../features/catalog/categoryWorkPhotos';
import { EMPTY_DISTANCE, EMPTY_METRIC } from '../../../shared/lib/emptyDisplayText';
import {
  estimatedBookingsCount,
  formatDistanceKm,
  formatMasterCardSpecialty,
  formatPriceFrom,
  formatSlotCardSubline,
  listingDistanceKm,
  masterLocationChipLine,
  visitFormatChipLabel,
} from '../lib/catalogFormat';
import {
  catalogListCardClass,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
} from '../servicesCatalog/servicesCatalogTheme';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { useFavoriteMaster } from '../../../features/profile/hooks/useFavoriteMaster';
import { useClientErrorModal } from '../ClientErrorModalContext';
import { MasterCardPortrait } from './MasterCardPortrait';

type Props = {
  listing: ServiceListingRecord;
  userLat: number | null;
  userLng: number | null;
  layout?: 'carousel' | 'list' | 'featured' | 'catalog' | 'home';
};

function uniquePortfolioUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const t = u?.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Единая типографика метрик в карточке (карусель / список). */
const CARD_STAT_VALUE = 'text-[15px] font-semibold leading-none tabular-nums';
const CARD_STAT_LABEL = 'mt-1 text-[11px] font-medium leading-snug text-[#9CA3AF]';

/** Бейдж «Свободна» поверх фото — всегда с фоном, иначе теряется на светлых снимках. */
const AVAILABILITY_BADGE =
  'inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold leading-none text-[#15803D] shadow-[0_2px_10px_rgba(0,0,0,0.14)] ring-1 ring-black/10 backdrop-blur-[2px]';

function StatDivider({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${compact ? 'mx-1' : 'mx-1.5'} w-px self-stretch min-h-[2.25rem] bg-[#F3F4F6]`}
      aria-hidden
    />
  );
}

function MasterCardMetricsStrip({
  listing,
  userLat,
  userLng,
  className = '',
  variant = 'strip',
}: {
  listing: ServiceListingRecord;
  userLat: number | null;
  userLng: number | null;
  className?: string;
  variant?: 'strip' | 'plain' | 'catalog' | 'carousel';
}) {
  const isNewMaster = listing.reviewsCount <= 0 && listing.rating <= 0;
  const bookingsCount = estimatedBookingsCount(listing.reviewsCount);
  const distanceKm = listingDistanceKm(listing, userLat, userLng);
  const distanceLabel = formatDistanceKm(distanceKm);
  const hasRating = listing.rating > 0;
  const hasReviews = listing.reviewsCount > 0;
  const valueClass = variant === 'catalog' ? 'text-[16px] font-bold leading-none tabular-nums' : CARD_STAT_VALUE;
  const labelClass =
    variant === 'carousel'
      ? 'mt-1 line-clamp-2 min-h-[2rem] text-[11px] font-medium leading-snug text-[#9CA3AF]'
      : variant === 'catalog'
        ? 'mt-1 text-[12px] font-medium leading-snug text-[#9CA3AF]'
        : CARD_STAT_LABEL;

  const ratingColumn = isNewMaster ? (
    <StatColumn
      value="Новый"
      label={variant === 'plain' ? 'рейтинг' : 'мастер'}
      valueClassName={`${valueClass} text-[#F47C8C]`}
      labelClassName={labelClass}
    />
  ) : (
    <StatColumn
      value={
        <span className="inline-flex items-center justify-center gap-0.5">
          <HiStar className={`${variant === 'catalog' ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-[#F59E0B]`} aria-hidden />
          {hasRating ? listing.rating.toFixed(1) : EMPTY_METRIC}
        </span>
      }
      label={
        hasReviews
          ? formatReviewsCountLabel(listing.reviewsCount)
          : hasRating
            ? 'средний рейтинг'
            : 'нет отзывов'
      }
      valueClassName={
        hasRating ? `${valueClass} text-[#111827]` : `${valueClass} text-[#D1D5DB]`
      }
      labelClassName={labelClass}
    />
  );

  const bookingsColumn =
    bookingsCount != null ? (
      <StatColumn value={String(bookingsCount)} label="записей" valueClassName={`${valueClass} text-[#111827]`} labelClassName={labelClass} />
    ) : (
      <StatColumn value={EMPTY_METRIC} label="записей" valueClassName={`${valueClass} text-[#9CA3AF]`} labelClassName={labelClass} />
    );

  const distanceColumn = (
    <StatColumn
      value={distanceLabel ?? EMPTY_DISTANCE}
      label={distanceLabel ? 'от вас' : 'расстояние'}
      valueClassName={
        distanceLabel ? `${valueClass} text-[#111827]` : `${valueClass} text-[#9CA3AF]`
      }
      labelClassName={labelClass}
    />
  );

  if (variant === 'plain') {
    return (
      <div className={`grid w-full min-h-[2.75rem] shrink-0 grid-cols-3 gap-1 pt-0.5 ${className}`}>
        {ratingColumn}
        {bookingsColumn}
        {distanceColumn}
      </div>
    );
  }

  if (variant === 'carousel') {
    const carouselRatingColumn = isNewMaster ? (
      <StatColumn
        compact
        value="Новый"
        label=""
        valueClassName="text-[#F47C8C]"
      />
    ) : (
      <StatColumn
        compact
        value={
          <span className="inline-flex max-w-full items-center justify-center gap-0.5">
            <HiStar className="h-3.5 w-3.5 shrink-0 text-[#F59E0B]" aria-hidden />
            <span className="truncate">{hasRating ? listing.rating.toFixed(1) : '—'}</span>
          </span>
        }
        label={
          hasReviews
            ? `${listing.reviewsCount} отз.`
            : hasRating
              ? 'рейтинг'
              : 'нет отзывов'
        }
        valueClassName={hasRating ? 'text-[#111827]' : 'text-[#9CA3AF]'}
      />
    );

    const carouselBookingsColumn = (
      <StatColumn
        compact
        value={bookingsCount != null ? String(bookingsCount) : '0'}
        label="записей"
        valueClassName={bookingsCount != null ? 'text-[#111827]' : 'text-[#9CA3AF]'}
      />
    );

    const carouselDistanceColumn = (
      <StatColumn
        compact
        value={distanceLabel ?? '—'}
        label="от вас"
        valueClassName={distanceLabel ? 'text-[#111827]' : 'text-[#9CA3AF]'}
      />
    );

    return (
      <div
        className={`flex h-[2.75rem] w-full shrink-0 items-center overflow-hidden border-t border-[#F3F4F6] pt-2 ${className}`}
      >
        {carouselRatingColumn}
        <StatDivider compact />
        {carouselBookingsColumn}
        <StatDivider compact />
        {carouselDistanceColumn}
      </div>
    );
  }

  return (
    <div
      className={`flex w-full items-start border-t border-[#F3F4F6] ${
        variant === 'catalog' ? 'pt-3' : 'pt-2.5'
      } ${className}`}
    >
      {ratingColumn}
      <StatDivider />
      {bookingsColumn}
      <StatDivider />
      {distanceColumn}
    </div>
  );
}

function StatColumn({
  value,
  label,
  valueClassName = `${CARD_STAT_VALUE} text-[#111827]`,
  labelClassName = CARD_STAT_LABEL,
  compact = false,
}: {
  value: ReactNode;
  label: string;
  valueClassName?: string;
  labelClassName?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="min-w-0 flex-1 overflow-hidden px-0.5 text-center">
        <div
          className={`truncate text-[13px] font-semibold leading-none tabular-nums ${valueClassName}`}
        >
          {value}
        </div>
        {label ? (
          <p className="mt-0.5 truncate text-[10px] font-medium leading-none text-[#9CA3AF]">
            {label}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full flex-1 text-center">
      <div className={`flex min-h-[1.125rem] items-center justify-center ${valueClassName}`}>{value}</div>
      <p className={labelClassName}>{label}</p>
    </div>
  );
}

export function MasterCard({ listing, userLat, userLng, layout = 'list' }: Props) {
  const navigate = useNavigate();
  const { showError } = useClientErrorModal();
  const { isFavorite: fav, toggleFavoriteFromEvent: onToggleFav, favoriteDisabled } = useFavoriteMaster(
    listing.masterId,
    (message) => showError(message, { title: 'Избранное' }),
  );
  const featured = layout === 'featured';
  const plainHome = layout === 'home';

  const hasSlot = Boolean(listing.nextSlotStartsAt);
  const slotSubline = formatSlotCardSubline(listing.nextSlotStartsAt);
  const showVerified = masterShowsVerifiedBadge(listing);
  const showPro = listing.isProEntitled === true;

  const priceLabel = listing.priceFrom > 0 ? formatPriceFrom(listing.priceFrom) : null;

  const { previewPhotos, extraWorks } = useMemo(() => {
    const urls = uniquePortfolioUrls(listing.portfolioPreview);
    if (urls.length >= 4) {
      const total = listing.portfolioTotal ?? urls.length;
      return {
        previewPhotos: urls.slice(0, 4),
        extraWorks: total > 4 ? total - 4 : 0,
      };
    }
    if (urls.length > 0) {
      return { previewPhotos: urls, extraWorks: 0 };
    }
    const categoryPhoto = getCategoryWorkPhotoUrl(resolveCategoryWorkCode(listing.category));
    const total = listing.portfolioTotal ?? 0;
    return {
      previewPhotos: [categoryPhoto],
      extraWorks: total > 1 ? total - 1 : 0,
    };
  }, [listing.portfolioPreview, listing.portfolioTotal, listing.category]);

  const profilePath = getMasterPath(listing.masterId);
  const bookingPath = getBookingPath(
    listing.masterId,
    listing.primaryServiceId ?? null,
    listing.nextSlotId ?? null,
    { from: 'services' },
  );

  const openProfile = () => navigate(profilePath);
  const openBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSlot) navigate(bookingPath);
    else navigate(profilePath);
  };

  const locationChip = masterLocationChipLine(listing);
  const visitChip = visitFormatChipLabel(listing);

  if (layout === 'catalog') {
    return (
      <article
        role="button"
        tabIndex={0}
        onClick={openProfile}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openProfile();
          }
        }}
        className={`group relative flex w-full cursor-pointer ${catalogListCardClass} lg:min-h-[148px] lg:flex-row`}
      >
        <button
          type="button"
          onClick={onToggleFav}
          disabled={favoriteDisabled}
          aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F5] transition hover:bg-[#EBEBEB] hover:text-[#F47C8C] active:scale-95 lg:right-4 lg:top-4 ${
            fav ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'
          }`}
        >
          <HiHeart className={`block h-[18px] w-[18px] translate-x-px ${fav ? 'fill-current' : ''}`} />
        </button>

        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[#EBEBEB] lg:h-auto lg:w-[168px] lg:min-h-[148px]">
          <MasterCardPortrait
            masterName={listing.masterName}
            photoUrl={listing.photoUrl}
            className="relative h-full w-full min-h-[176px] lg:min-h-[148px]"
            imageClassName="h-full min-h-[176px] w-full object-cover transition duration-300 group-hover:scale-[1.01] lg:min-h-[148px]"
            badge={
              hasSlot ? (
                <span className={`absolute left-3 top-3 ${AVAILABILITY_BADGE}`}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" aria-hidden />
                  Свободна
                </span>
              ) : null
            }
          />
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col p-5 lg:min-h-[148px] lg:p-4 lg:pr-[184px]">
          <div className="min-w-0 flex-1">
            <p className="pr-10 text-[12px] font-medium text-[#8E8E93] lg:pr-12">
              {formatMasterCardSpecialty(listing.category)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 pr-10 lg:pr-12">
              <h3 className="text-[18px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
                {listing.masterName}
              </h3>
              {showVerified || showPro ? (
                <MasterInlineBadges verified={showVerified} pro={showPro} className="mt-0.5" />
              ) : null}
            </div>

            <div className="mt-2">
              <MasterCardMetricsStrip
                listing={listing}
                userLat={userLat}
                userLng={userLng}
                variant="catalog"
              />
              {priceLabel ? (
                <p className="mt-2 text-[14px] font-semibold text-[#111827]">{priceLabel}</p>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-[8px] bg-[#F5F5F5] px-2.5 py-1 text-[12px] font-medium text-[#6B7280]">
                {locationChip}
              </span>
              <span className="rounded-[8px] bg-[#F5F5F5] px-2.5 py-1 text-[12px] font-medium text-[#6B7280]">
                {visitChip}
              </span>
            </div>
          </div>

          <div className="mt-3 flex w-full flex-col items-stretch gap-2 lg:absolute lg:bottom-4 lg:right-4 lg:mt-0 lg:w-[168px]">
            <div className="w-full rounded-[10px] bg-[#F5F5F5] px-3 py-2">
              <p className="text-[11px] font-medium text-[#8E8E93]">Ближайшее окно</p>
              <p
                className={`mt-0.5 text-[13px] font-semibold leading-snug ${hasSlot ? 'text-[#111827]' : 'text-[#8E8E93]'}`}
              >
                {hasSlot && slotSubline ? slotSubline : 'Свободных окон пока нет'}
              </p>
              {hasSlot && listing.serviceName ? (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#8E8E93]">
                  {listing.serviceName}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={openBooking}
              className={`${hasSlot ? catalogPrimaryBtn : catalogSecondaryBtn} w-full !min-h-9 !text-[13px]`}
            >
              {hasSlot ? 'Записаться' : 'Открыть профиль'}
            </button>
          </div>
        </div>
      </article>
    );
  }

  if (layout === 'carousel') {
    const thumbUrl =
      previewPhotos[0] ?? getCategoryWorkPhotoUrl(resolveCategoryWorkCode(listing.category));

    return (
      <article
        role="button"
        tabIndex={0}
        onClick={openProfile}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openProfile();
          }
        }}
        className="flex h-[25rem] w-full flex-col overflow-hidden rounded-[16px] bg-white p-4 ring-1 ring-black/[0.06] text-left transition active:scale-[0.99]"
      >
        <div className="flex h-[8.5rem] shrink-0 gap-3.5 overflow-hidden">
          <MasterCardPortrait
            masterName={listing.masterName}
            photoUrl={listing.photoUrl}
            className="relative h-[8.5rem] w-[7rem] shrink-0"
            imageClassName="h-full w-full rounded-[14px] object-cover"
            badge={
              hasSlot ? (
                <span
                  className={`absolute bottom-2 left-1.5 right-1.5 justify-center ${AVAILABILITY_BADGE}`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" aria-hidden />
                  Свободна
                </span>
              ) : null
            }
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-start gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex min-w-0 items-center gap-1">
                  <h3 className="min-w-0 truncate text-[16px] font-semibold leading-snug tracking-[-0.02em] text-[#111827]">
                    {listing.masterName}
                  </h3>
                  {showVerified || showPro ? (
                    <MasterInlineBadges verified={showVerified} pro={showPro} />
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[12px] font-medium leading-snug text-[#6B7280]">
                  {formatMasterCardSpecialty(listing.category)}
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleFav}
                disabled={favoriteDisabled}
                aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] transition hover:bg-[#EBEBEB] active:scale-95 ${
                  fav ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'
                }`}
              >
                <HiHeart className={`h-5 w-5 ${fav ? 'fill-current' : ''}`} />
              </button>
            </div>

            <MasterCardMetricsStrip
              listing={listing}
              userLat={userLat}
              userLng={userLng}
              variant="carousel"
              className="mt-2 shrink-0"
            />

            <div className="mt-auto flex h-7 shrink-0 items-center gap-1.5 overflow-hidden">
              <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1 rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-medium text-[#374151]">
                <HiMapPin className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
                <span className="truncate">{locationChip}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-medium text-[#374151]">
                <HiHomeModern className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
                {visitChip}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 shrink-0 overflow-hidden rounded-[12px] bg-[#F5F5F5]">
          <div className="flex items-center gap-2 px-3 py-2">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                hasSlot ? 'bg-white text-[#F47C8C]' : 'bg-[#EBEBEB] text-[#9CA3AF]'
              }`}
            >
              <HiClock className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium leading-none text-[#6B7280]">Ближайшее окно</p>
              <p
                className={`mt-1 text-[13px] leading-snug ${
                  hasSlot && slotSubline ? 'font-semibold text-[#C02658]' : 'font-medium text-[#374151]'
                }`}
              >
                {hasSlot && slotSubline ? slotSubline : 'Свободных окон пока нет'}
              </p>
            </div>
            {hasSlot ? (
              <button
                type="button"
                onClick={openBooking}
                aria-label="Выбрать время"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F47C8C] text-white active:scale-95"
              >
                <HiCalendarDays className="h-[18px] w-[18px]" aria-hidden />
              </button>
            ) : (
              <span className="h-9 w-9 shrink-0" aria-hidden />
            )}
          </div>
          {hasSlot && (listing.serviceName || priceLabel) ? (
            <div className="flex items-start justify-between gap-3 border-t border-[#E5E7EB] px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium leading-none text-[#9CA3AF]">Услуга</p>
                <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#374151] line-clamp-2">
                  {listing.serviceName}
                </p>
              </div>
              {priceLabel ? (
                <p className="shrink-0 pt-3 text-[13px] font-semibold leading-snug text-[#111827]">
                  {priceLabel}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-3.5 h-[3.75rem] shrink-0 overflow-hidden rounded-[14px] bg-[#FAFAFA]">
          <ImageReveal src={thumbUrl} alt="" className="h-full w-[5.5rem] object-cover" loading="lazy" />
        </div>

        <button
          type="button"
          onClick={openBooking}
          className={`${catalogPrimaryBtn} mt-auto flex h-[3.25rem] w-full shrink-0 flex-col items-center justify-center gap-0.5 !rounded-[12px] !py-0`}
        >
          <span className="text-[14px] font-semibold leading-none">Записаться</span>
          <span className="text-[11px] font-medium leading-none text-white/90">
            {hasSlot ? 'Выбрать время' : 'Открыть профиль'}
          </span>
        </button>
      </article>
    );
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProfile();
        }
      }}
      className={`flex h-full w-full flex-col text-left transition active:scale-[0.99] ${
        plainHome
          ? 'min-h-[26.5rem] overflow-visible rounded-[16px] bg-[#F6F6F7] p-4'
          : 'overflow-hidden rounded-[16px] bg-white p-4'
      } ${featured && !plainHome ? 'ring-1 ring-[#F47C8C]/25' : ''}`}
    >
      <div className={`flex gap-3.5 ${plainHome ? 'shrink-0' : ''}`}>
        <MasterCardPortrait
          masterName={listing.masterName}
          photoUrl={listing.photoUrl}
          className="relative h-[8.5rem] w-[7rem] shrink-0"
          imageClassName="h-full w-full rounded-[14px] object-cover"
          badge={
            hasSlot ? (
              <span
                className={`absolute bottom-2 left-1.5 right-1.5 justify-center ${AVAILABILITY_BADGE}`}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" aria-hidden />
                Свободна
              </span>
            ) : null
          }
        />

        <div className={`min-w-0 flex-1 ${plainHome ? 'flex min-h-[8.5rem] flex-col' : ''}`}>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1">
                <h3 className="min-w-0 truncate text-[16px] font-semibold leading-snug tracking-[-0.02em] text-[#111827]">
                  {listing.masterName}
                </h3>
                {showVerified || showPro ? (
                  <MasterInlineBadges verified={showVerified} pro={showPro} />
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[12px] font-medium leading-snug text-[#8E8E93]">
                {formatMasterCardSpecialty(listing.category)}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleFav}
              disabled={favoriteDisabled}
              aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
              className={`flex h-9 w-9 shrink-0 items-center justify-center transition active:scale-95 ${
                plainHome
                  ? fav
                    ? 'text-[#F47C8C]'
                    : 'text-[#9CA3AF] hover:text-[#F47C8C]'
                  : `rounded-full bg-[#F5F5F5] hover:bg-[#EBEBEB] ${fav ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'}`
              }`}
            >
              <HiHeart className={`h-5 w-5 ${fav ? 'fill-current' : ''}`} />
            </button>
          </div>

          <MasterCardMetricsStrip
            listing={listing}
            userLat={userLat}
            userLng={userLng}
            variant={plainHome ? 'plain' : 'strip'}
            className={plainHome ? 'mt-3 shrink-0' : 'mt-3'}
          />

          <div
            className={`flex flex-wrap gap-x-3 gap-y-1 ${
              plainHome
                ? 'mt-auto min-h-[2.25rem] shrink-0 content-end text-[12px] font-medium text-[#6B7280]'
                : 'mt-2.5 gap-1.5'
            }`}
          >
            <span
              className={
                plainHome
                  ? 'inline-flex max-w-full items-center gap-1'
                  : 'inline-flex max-w-full items-center gap-1 rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[12px] font-medium text-[#4B5563]'
              }
            >
              <HiMapPin className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
              <span className="truncate">{locationChip}</span>
            </span>
            <span
              className={
                plainHome
                  ? 'inline-flex items-center gap-1'
                  : 'inline-flex items-center gap-1 rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[12px] font-medium text-[#4B5563]'
              }
            >
              <HiHomeModern className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
              {visitChip}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3.5 shrink-0 overflow-hidden rounded-[12px] bg-[#F5F5F5]">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center ${
              plainHome
                ? 'text-[#F47C8C]'
                : `rounded-[10px] ${hasSlot ? 'bg-white text-[#F47C8C]' : 'bg-[#EBEBEB] text-[#9CA3AF]'}`
            }`}
          >
            <HiClock className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium leading-none text-[#9CA3AF]">Ближайшее окно</p>
            <p
              className={`mt-1 text-[14px] leading-snug ${
                hasSlot && slotSubline
                  ? 'font-semibold text-[#F47C8C]'
                  : 'font-medium text-[#6B7280]'
              }`}
            >
              {hasSlot && slotSubline ? slotSubline : 'Свободных окон пока нет'}
            </p>
          </div>
          {hasSlot ? (
            <button
              type="button"
              onClick={openBooking}
              aria-label="Выбрать время"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F47C8C] text-white active:scale-95"
            >
              <HiCalendarDays className="h-[18px] w-[18px]" aria-hidden />
            </button>
          ) : (
            <span className="h-9 w-9 shrink-0" aria-hidden />
          )}
        </div>
        {hasSlot && (listing.serviceName || priceLabel) ? (
          <div className="flex items-start justify-between gap-3 border-t border-[#EBEBEB] px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium leading-none text-[#9CA3AF]">Услуга</p>
              <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#374151] line-clamp-2">
                {listing.serviceName}
              </p>
            </div>
            {priceLabel ? (
              <p className="shrink-0 pt-3 text-[13px] font-semibold leading-snug text-[#111827]">
                {priceLabel}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {plainHome ? (
        <div className="mt-3 flex h-[3.75rem] shrink-0">
          <div className="h-full w-[5.5rem] shrink-0 overflow-hidden rounded-[10px] bg-[#FAFAFA]">
            <ImageReveal
              src={previewPhotos[0] ?? getCategoryWorkPhotoUrl(resolveCategoryWorkCode(listing.category))}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      ) : previewPhotos.length > 0 ? (
        <div className="mt-3 flex gap-1.5">
          {previewPhotos.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={`h-[3.75rem] overflow-hidden rounded-[14px] bg-[#FAFAFA] ${
                previewPhotos.length === 1 ? 'w-[5.5rem] shrink-0' : 'min-w-0 flex-1'
              }`}
            >
              <ImageReveal src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
          {extraWorks > 0 ? (
            <div className="flex h-[3.75rem] w-[3.75rem] shrink-0 flex-col items-center justify-center rounded-[14px] bg-[#FFF1F4] px-1 text-center text-[12px] font-semibold leading-tight text-[#F47C8C]">
              +{extraWorks}
              <span className="text-[11px] font-medium">работы</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={openBooking}
        className={`${catalogPrimaryBtn} flex w-full flex-col items-center justify-center gap-0.5 !rounded-[12px] py-2.5 ${
          plainHome ? 'mt-auto min-h-[3.25rem] shrink-0' : 'mt-3.5 min-h-11'
        }`}
      >
        <span className="text-[14px] font-semibold leading-none">Записаться</span>
        <span className="text-[11px] font-medium leading-none text-white/90">
          {hasSlot ? 'Выбрать время' : 'Открыть профиль'}
        </span>
      </button>
    </article>
  );
}
