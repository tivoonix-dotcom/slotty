import { EMPTY_PRICE, EMPTY_SLOT } from '../../../shared/lib/emptyDisplayText';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCalendarDays,
  HiChevronRight,
  HiClock,
  HiEye,
  HiMapPin,
  HiStar,
  HiWallet,
} from 'react-icons/hi2';
import { getBookingPath, SERVICES_PATH } from '../../../app/paths';
import { recordCatalogListingView } from '../../../features/services/api/catalogListingsApi';
import type { AggregatedServiceCard } from '../lib/aggregateServices';
import {
  formatDurationMinutes,
  formatPriceFrom,
  formatReviewsCountCompact,
  formatServiceCardCategoryLabel,
  formatServiceCardMetaLocationLine,
  formatSlotCardSubline,
  formatWeeklyViewsLabel,
} from '../lib/catalogFormat';
import { formatServiceCardRatingDisplay } from '../lib/catalogDisplaySanitize';
import {
  formatServicePopularityHint,
  resolveGridChoiceBadge,
  resolveServiceInlineBadges,
  resolveServicePhotoBadge,
  resolveServiceCardCtaLabel,
  resolveServiceCardGridCtaLabel,
} from '../lib/serviceCardPresentation';
import { getServiceImage } from '../../../features/catalog/catalogServicePhotos';
import { serviceCoverImageStyle } from '../../../features/catalog/serviceCoverPresentation';
import {
  MASTER_ACHIEVEMENTS_EMPTY_ART,
  resolveMasterAchievementArt,
} from '../lib/masterAchievementAssets';
import type { MasterTopAchievementKind } from '../lib/resolveMasterTopRankStatus';

import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { MasterCardPortrait } from './MasterCardPortrait';
import { ServiceBadge, ServicePhotoBadge } from './ServiceBadge';
import { ServiceCardBookingAside } from './ServiceCardBookingAside';
import {
  catalogDesktopSectionLabel,
  catalogInnerDivider,
  catalogListCardClass,
  catalogPanelRowClass,
  catalogPanelRowPad,
  catalogGridCardClass,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  catalogServiceCardClass,
} from '../servicesCatalog/servicesCatalogTheme';

type Props = {
  service: AggregatedServiceCard;
  /** stack — мобильная; grid — плитка; wide — десктоп-строка */
  layout?: 'stack' | 'grid' | 'wide';
  /** row — строка внутри общей белой панели (OKX); card — отдельная карточка */
  surface?: 'card' | 'row';
  /** compact — 2 колонки mobile; comfortable — 3 колонки desktop */
  density?: 'compact' | 'comfortable';
};

function StatRow({
  icon,
  label,
  value,
  valueClassName = 'text-[15px] font-semibold text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#6B7280]">
          {icon}
        </span>
        <span className="text-[14px] font-medium text-[#6B7280]">{label}</span>
      </div>
      <span className={`shrink-0 text-right leading-snug ${valueClassName}`}>{value}</span>
    </div>
  );
}

function ServiceCardBadge({ label }: { label: string }) {
  return <ServicePhotoBadge>{label}</ServicePhotoBadge>;
}

function serviceCardHref(service: AggregatedServiceCard): string {
  if (!service.masterId) {
    return SERVICES_PATH;
  }
  return getBookingPath(
    service.masterId,
    service.primaryServiceId ?? null,
    service.nextSlotId,
    { from: 'services' },
  );
}

function recordListingView(service: AggregatedServiceCard) {
  void recordCatalogListingView({
    masterId: service.masterId,
    serviceId: service.primaryServiceId ?? null,
  }).catch(() => undefined);
}

function serviceCardPhoto(service: AggregatedServiceCard): string {
  return getServiceImage({
    serviceCoverUrl: service.serviceCoverUrl,
    categoryCode: service.categoryCode,
    categoryName: service.categoryName,
    title: service.title,
    serviceId: service.id,
    masterId: service.masterId,
  });
}

function serviceCardPhotoStyle(service: AggregatedServiceCard) {
  return serviceCoverImageStyle({
    focalX: service.serviceCoverFocalX,
    focalY: service.serviceCoverFocalY,
  });
}

const wideStatChipClass =
  'inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-[#F5F5F5] px-2.5 py-1 text-[12px] font-medium text-[#6B7280]';

const wideCardCategoryClass =
  'text-[14px] font-semibold leading-none text-[#8E8E93]';

const wideCardTitleClass =
  'text-[20px] font-bold leading-[1.2] tracking-[-0.025em] text-[#111827] lg:text-[22px]';

function ServiceCardRatingReviews({
  avgRating,
  totalReviews,
  size = 'wide',
}: {
  avgRating: number;
  totalReviews: number;
  size?: 'wide' | 'compact' | 'meta';
}) {
  const display = formatServiceCardRatingDisplay(avgRating, totalReviews);
  const starSize =
    size === 'wide' ? 'h-4 w-4' : size === 'meta' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const ratingTextSize =
    size === 'wide'
      ? 'text-[16px]'
      : size === 'meta'
        ? 'text-[15px]'
        : 'text-[11px] sm:text-[12px]';
  const reviewsTextSize =
    size === 'wide' ? 'text-[13px]' : size === 'meta' ? 'text-[13px]' : 'text-[11px]';

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {display.showRating && display.ratingText ? (
        <span
          className={`inline-flex items-center gap-1 font-extrabold leading-none text-[#D97706] tabular-nums ${ratingTextSize}`}
        >
          <HiStar className={`${starSize} shrink-0 text-[#F59E0B]`} aria-hidden />
          {display.ratingText}
        </span>
      ) : null}
      <span
        className={`font-medium tabular-nums ${reviewsTextSize} ${
          display.isNewMaster ? 'text-[#8E8E93]' : 'text-[#6B7280]'
        }`}
      >
        {display.reviewsText}
      </span>
    </span>
  );
}

function ServiceCardGridChoiceBadge({
  label,
  tone = 'slotty',
  density = 'compact',
}: {
  label: string;
  tone?: 'today' | 'slotty' | 'promo';
  density?: 'compact' | 'comfortable';
}) {
  const toneClass =
    tone === 'today'
      ? 'bg-[#22C55E]'
      : tone === 'promo'
        ? 'bg-[#F59E0B]'
        : 'bg-[#F47C8C]';

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center rounded-full px-2.5 py-1 font-bold leading-none text-white shadow-[0_2px_8px_rgba(17,24,39,0.18)] ${
        density === 'comfortable' ? 'text-[11px] sm:text-[12px]' : 'text-[10px] sm:text-[11px]'
      } ${toneClass}`}
    >
      {label}
    </span>
  );
}

function ServiceCardGridRatingBlock({
  avgRating,
  totalReviews,
  density = 'compact',
  className = '',
}: {
  avgRating: number;
  totalReviews: number;
  density?: 'compact' | 'comfortable';
  className?: string;
}) {
  const display = formatServiceCardRatingDisplay(avgRating, totalReviews);
  const reviews = Math.max(0, Math.floor(totalReviews));
  const starSize = density === 'comfortable' ? 'h-3.5 w-3.5' : 'h-3 w-3';
  const ratingSize = density === 'comfortable' ? 'text-[13px]' : 'text-[12px]';
  const reviewsLabel =
    reviews > 0 ? formatReviewsCountCompact(reviews) : display.reviewsText;

  return (
    <div className={`flex shrink-0 items-center leading-none ${className}`}>
      <span className="inline-flex items-center gap-1 tabular-nums">
        {display.showRating && display.ratingText ? (
          <>
            <HiStar className={`shrink-0 text-[#F59E0B] ${starSize}`} aria-hidden />
            <span className={`font-bold text-[#111827] ${ratingSize}`}>{display.ratingText}</span>
          </>
        ) : null}
        <span
          className={`font-medium ${ratingSize} ${
            display.isNewMaster ? 'text-[#8E8E93]' : 'text-[#6B7280]'
          }`}
        >
          {reviewsLabel}
        </span>
      </span>
    </div>
  );
}

function ServiceCardGridAchievements({
  service,
  density = 'compact',
  className = '',
}: {
  service: AggregatedServiceCard;
  density?: 'compact' | 'comfortable';
  className?: string;
}) {
  const ids = service.achievementIds ?? [];
  if (ids.length === 0) return null;
  const maxIcons = density === 'comfortable' ? 3 : 2;
  const visibleIds = ids.slice(0, maxIcons);

  return (
    <div
      className={`flex min-w-0 flex-nowrap items-center overflow-hidden ${
        density === 'comfortable' ? 'gap-1.5' : 'gap-0.5'
      } ${className}`}
    >
      {visibleIds.map((kind, index) => (
        <ServiceCardAchievementImage
          key={`${kind}-${index}`}
          kind={kind}
          title={service.achievementLabels[index] ?? ''}
          size="xs"
        />
      ))}
    </div>
  );
}

function ServiceCardGridMetaLines({
  service,
  density = 'compact',
}: {
  service: AggregatedServiceCard;
  density?: 'compact' | 'comfortable';
}) {
  const slotLine = formatSlotCardSubline(service.nearestSlotIso);
  const locationLine = formatServiceCardMetaLocationLine({
    locationLabel: service.locationLabel,
    visitLabel: service.visitLabel,
    distanceKm: service.distanceKm,
  });
  const textSize = density === 'comfortable' ? 'text-[11px] sm:text-[12px]' : 'text-[10px] sm:text-[11px]';
  const iconSize = density === 'comfortable' ? 'h-3.5 w-3.5' : 'h-3 w-3';
  const lineClass = `inline-flex min-w-0 max-w-full items-center gap-1 font-medium leading-tight ${textSize}`;

  return (
    <div className={`mt-2 flex flex-col ${density === 'comfortable' ? 'mb-2.5 gap-1' : 'mb-2 gap-1'}`}>
      {locationLine ? (
        <p className={`${lineClass} text-[#8E8E93]`}>
          <HiMapPin className={`shrink-0 ${iconSize}`} aria-hidden />
          <span className="truncate">{locationLine}</span>
        </p>
      ) : null}
      <p className={lineClass}>
        <HiCalendarDays className={`shrink-0 ${iconSize} text-[#9CA3AF]`} aria-hidden />
        <span
          className={`truncate ${
            slotLine
              ? service.hasToday
                ? 'font-semibold text-[#F47C8C]'
                : 'text-[#374151]'
              : 'text-[#8E8E93]'
          }`}
        >
          {slotLine ?? EMPTY_SLOT}
        </span>
      </p>
      {service.weeklyViews >= 1 ? (
        <p className={`${lineClass} text-[#8E8E93]`}>
          <HiEye className={`shrink-0 ${iconSize}`} aria-hidden />
          <span className="truncate">{formatWeeklyViewsLabel(service.weeklyViews)}</span>
        </p>
      ) : null}
    </div>
  );
}

function ServiceCardGridMasterFooter({
  service,
  density = 'compact',
}: {
  service: AggregatedServiceCard;
  density?: 'compact' | 'comfortable';
}) {
  const hasAchievements = (service.achievementIds?.length ?? 0) > 0;
  const avatarClass =
    density === 'comfortable' ? 'relative h-8 w-8 shrink-0' : 'relative h-7 w-7 shrink-0';
  const nameClass =
    density === 'comfortable'
      ? 'line-clamp-1 text-[12px] font-semibold leading-tight text-[#111827]'
      : 'line-clamp-1 text-[11px] font-semibold leading-tight text-[#111827]';

  return (
    <div className={`mt-auto flex items-center gap-2.5 ${density === 'comfortable' ? 'pt-3' : 'pt-2.5'}`}>
      <MasterCardPortrait
        masterName={service.masterName}
        photoUrl={service.photoUrl}
        className={avatarClass}
        imageClassName="h-full w-full rounded-full object-cover"
        photoMaxEdge={density === 'comfortable' ? 64 : 56}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center justify-between gap-1">
          <p className={`${nameClass} min-w-0 flex-1`}>{service.masterName}</p>
          <ServiceCardGridRatingBlock
            avgRating={service.avgRating}
            totalReviews={service.totalReviews}
            density={density}
            className="shrink-0"
          />
        </div>
        {hasAchievements ? (
          <ServiceCardGridAchievements service={service} density={density} />
        ) : null}
      </div>
    </div>
  );
}

function ServiceCardGridPhotoCta({ label, hasSlot }: { label: string; hasSlot: boolean }) {
  return (
    <span className="pointer-events-none absolute bottom-2 right-2 z-10">
      <span
        className={`service-card-photo-cta ${
          hasSlot ? 'service-card-photo-cta--primary' : 'service-card-photo-cta--muted'
        }`}
      >
        <span className="service-card-photo-cta__beam" aria-hidden />
        <span className="service-card-photo-cta__inner">{label}</span>
      </span>
    </span>
  );
}

function ServiceCardGridMarketplace({
  service,
  href,
  photo,
  photoBadge,
  hasSlot,
  density = 'compact',
}: {
  service: AggregatedServiceCard;
  href: string;
  photo: string;
  photoBadge: string | null;
  hasSlot: boolean;
  density?: 'compact' | 'comfortable';
}) {
  const priceLabel = service.minPrice > 0 ? formatPriceFrom(service.minPrice) : EMPTY_PRICE;
  const choiceBadge = resolveGridChoiceBadge(service);
  const isComfortable = density === 'comfortable';

  const bodyPad = isComfortable
    ? 'px-3 pb-4 pt-2.5 sm:px-3.5 sm:pb-4'
    : 'px-2.5 pb-3 pt-2 sm:px-3 sm:pb-3.5';

  return (
    <Link
      to={href}
      onClick={() => recordListingView(service)}
      className={`group flex h-full w-full min-w-0 flex-col overflow-hidden ${catalogGridCardClass}`}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 bg-[#F3F4F6]">
        <div className="absolute inset-0 overflow-hidden">
          <ImageReveal
            src={photo}
            alt=""
            className="h-full w-full object-cover"
            style={serviceCardPhotoStyle(service)}
            loading="lazy"
          />
        </div>
        {photoBadge ? (
          <span className="pointer-events-none absolute left-2 top-2 z-10">
            <ServiceCardBadge label={photoBadge} />
          </span>
        ) : null}
        {choiceBadge ? (
          <span className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[calc(100%-5.5rem)]">
            <ServiceCardGridChoiceBadge
              label={choiceBadge.label}
              tone={choiceBadge.tone}
              density={density}
            />
          </span>
        ) : null}
        <ServiceCardGridPhotoCta
          label={resolveServiceCardGridCtaLabel(hasSlot)}
          hasSlot={hasSlot}
        />
      </div>

      <div className={`flex min-h-0 flex-1 flex-col ${bodyPad}`}>
        <h3
          className={`line-clamp-2 leading-[1.25] text-[#111827] ${
            isComfortable
              ? 'text-[14px] font-medium sm:text-[15px]'
              : 'text-[13px] font-medium'
          }`}
        >
          {service.title}
        </h3>

        <p
          className={`mt-2 text-right font-extrabold leading-none tracking-[-0.03em] text-[#111827] tabular-nums ${
            isComfortable ? 'text-[20px] sm:mt-2.5 sm:text-[21px]' : 'text-[17px] sm:text-[18px]'
          }`}
        >
          {priceLabel}
        </p>

        <ServiceCardGridMetaLines service={service} density={density} />

        <ServiceCardGridMasterFooter service={service} density={density} />
      </div>
    </Link>
  );
}

function ServiceCardAchievementImage({
  kind,
  title,
  size = 'md',
}: {
  kind: MasterTopAchievementKind;
  title: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const artSrc = resolveMasterAchievementArt(kind, title);

  return (
    <img
      src={artSrc}
      alt={title}
      title={title}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        const img = event.currentTarget;
        if (img.dataset.fallback) return;
        img.dataset.fallback = '1';
        img.src = MASTER_ACHIEVEMENTS_EMPTY_ART;
      }}
      className={
        size === 'xs'
          ? 'h-[18px] w-auto max-w-[52px] shrink-0 object-contain object-center sm:h-5 sm:max-w-[58px]'
          : size === 'sm'
            ? 'h-8 w-auto max-w-[96px] shrink-0 object-contain object-center'
            : 'h-11 w-auto max-w-[128px] shrink-0 object-contain object-center sm:h-12 sm:max-w-[140px]'
      }
    />
  );
}

function ServiceCardInlineBadgesRow({
  service,
  showPromo,
  hasSlot,
  badgeSize = 'sm',
}: {
  service: AggregatedServiceCard;
  showPromo: boolean;
  hasSlot: boolean;
  badgeSize?: 'sm' | 'md';
}) {
  const badges = resolveServiceInlineBadges(service, { showPromo, hasSlot });
  const achievementIds = service.achievementIds ?? [];
  const hasAchievements = achievementIds.length > 0;
  if (!hasAchievements && badges.length === 0) return null;

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
      {achievementIds.map((kind, index) => (
        <ServiceCardAchievementImage
          key={`${kind}-${index}`}
          kind={kind}
          title={service.achievementLabels[index] ?? ''}
          size={badgeSize}
        />
      ))}
      {badges.map((badge) => (
        <ServiceBadge key={badge.id} variant={badge.variant} size={badgeSize}>
          {badge.label}
        </ServiceBadge>
      ))}
    </div>
  );
}

function servicePhotoBadgeLabel(
  service: AggregatedServiceCard,
  showPromo: boolean,
): string | null {
  return resolveServicePhotoBadge(service, showPromo);
}

export function ServiceCard({ service, layout = 'stack', surface = 'card', density = 'compact' }: Props) {
  const href = serviceCardHref(service);
  const photo = serviceCardPhoto(service);
  const slotLine = formatSlotCardSubline(service.nearestSlotIso);
  const hasSlot = Boolean(slotLine);
  const showPromo = Boolean(service.promoText);
  const showPopular = service.badge === 'popular' || service.badge === 'hit';
  const isGrid = layout === 'grid';
  const isWide = layout === 'wide';

  if (isWide && surface === 'row') {
    return (
      <Link
        to={href}
        onClick={() => recordListingView(service)}
        className={`group ${catalogPanelRowClass} ${catalogPanelRowPad}`}
      >
        <div className="flex items-center gap-4 lg:gap-5">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[#EBEBEB] lg:h-14 lg:w-14">
            <ImageReveal
              src={photo}
              alt=""
              className="h-full w-full object-cover"
              style={serviceCardPhotoStyle(service)}
              loading="lazy"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className={catalogDesktopSectionLabel}>
              {formatServiceCardCategoryLabel(service.categoryName, service.categoryCode)}
            </p>
            <h3 className="mt-0.5 text-[16px] font-bold leading-snug text-[#111827] lg:text-[17px]">
              {service.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-[13px] text-[#8E8E93] lg:hidden">{service.masterName}</p>
          </div>

          <div className="hidden shrink-0 items-center gap-0 lg:flex">
            <div className="min-w-[100px] border-l border-[#EEEEEE] px-5 first:border-l-0 first:pl-0">
              <p className="text-[13px] text-[#8E8E93]">Цена</p>
              <p className="mt-0.5 text-[15px] font-bold tabular-nums text-[#111827]">
                {service.minPrice > 0 ? formatPriceFrom(service.minPrice) : EMPTY_PRICE}
              </p>
            </div>
            <div className="min-w-[88px] border-l border-[#EEEEEE] px-5">
              <p className="text-[13px] text-[#8E8E93]">Время</p>
              <p className="mt-0.5 text-[15px] font-bold text-[#111827]">
                {formatDurationMinutes(service.durationMinutes)}
              </p>
            </div>
            <div className="min-w-[120px] border-l border-[#EEEEEE] px-5">
              <p className="text-[13px] text-[#8E8E93]">Окно</p>
              <p className={`mt-0.5 text-[15px] font-semibold ${hasSlot ? 'text-[#111827]' : 'text-[#8E8E93]'}`}>
                {hasSlot ? slotLine : EMPTY_SLOT}
              </p>
            </div>
          </div>

          <HiChevronRight
            className="h-5 w-5 shrink-0 text-[#C7C7CC]"
            aria-hidden
          />
        </div>
      </Link>
    );
  }

  if (isWide) {
    const photoBadge = servicePhotoBadgeLabel(service, showPromo);
    const priceLabel =
      service.minPrice > 0 ? formatPriceFrom(service.minPrice) : EMPTY_PRICE;
    const popularityHint = formatServicePopularityHint(service);

    return (
      <Link
        to={href}
        onClick={() => recordListingView(service)}
        className={`group relative flex w-full flex-col ${catalogServiceCardClass} lg:min-h-[148px] lg:grid lg:grid-cols-[176px_minmax(0,1fr)_200px] lg:items-stretch`}
      >
        <div className="relative h-36 w-full shrink-0 overflow-hidden bg-[#EBEBEB] lg:h-full lg:min-h-[148px]">
          <ImageReveal
            src={photo}
            alt=""
            className="h-full w-full object-cover"
            style={serviceCardPhotoStyle(service)}
            loading="lazy"
          />
          {photoBadge ? (
            <span className="pointer-events-none absolute left-2 top-2 z-10">
              <ServiceCardBadge label={photoBadge} />
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-2 p-3.5 lg:gap-2.5 lg:px-5 lg:py-3.5">
          <div className="min-w-0 space-y-1">
            <p className={wideCardCategoryClass}>
              {formatServiceCardCategoryLabel(service.categoryName, service.categoryCode)}
            </p>
            <h3 className={wideCardTitleClass}>{service.title}</h3>
          </div>

          <div className="flex min-w-0 items-center gap-2.5">
            <MasterCardPortrait
              masterName={service.masterName}
              photoUrl={service.photoUrl}
              className="relative h-10 w-10 shrink-0"
              imageClassName="h-full w-full rounded-full object-cover ring-2 ring-white"
              photoMaxEdge={80}
            />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-[#111827]">{service.masterName}</p>
              <div className="mt-0.5">
                <ServiceCardRatingReviews
                  avgRating={service.avgRating}
                  totalReviews={service.totalReviews}
                  size="meta"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className={wideStatChipClass}>
              <HiClock className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden />
              {formatDurationMinutes(service.durationMinutes)}
            </span>
            {service.visitLabel ? (
              <span className={wideStatChipClass}>{service.visitLabel}</span>
            ) : null}
            {service.locationLabel ? (
              <span className={`${wideStatChipClass} max-w-full`}>
                <HiMapPin className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
                <span className="truncate">{service.locationLabel}</span>
              </span>
            ) : null}
            {popularityHint ? (
              <span className={`${wideStatChipClass} bg-[#FFF1F4] text-[13px] font-semibold text-[#F47C8C]`}>
                {popularityHint}
              </span>
            ) : null}
          </div>

          <ServiceCardInlineBadgesRow service={service} showPromo={showPromo} hasSlot={hasSlot} badgeSize="md" />
        </div>

        <ServiceCardBookingAside
          priceLabel={priceLabel}
          hasSlot={hasSlot}
          slotLine={hasSlot ? slotLine : null}
        />
      </Link>
    );
  }

  if (isGrid) {
    const photoBadge = servicePhotoBadgeLabel(service, showPromo);

    return (
      <ServiceCardGridMarketplace
        service={service}
        href={href}
        photo={photo}
        photoBadge={photoBadge}
        hasSlot={hasSlot}
        density={density}
      />
    );
  }

  return (
    <Link
      to={href}
      onClick={() => recordListingView(service)}
      className={`block w-full ${catalogListCardClass}`}
    >
      <div className="p-4">
        <div className="flex gap-3.5">
          <div className="relative h-[5.5rem] w-[5.5rem] shrink-0">
            <ImageReveal
              src={photo}
              alt=""
              className="h-full w-full rounded-[20px] object-cover"
              style={serviceCardPhotoStyle(service)}
              loading="lazy"
            />
            {showPopular ? (
              <span className="absolute -left-0.5 -top-0.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#111827] shadow-sm">
                🔥 Топ
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-[20px] font-semibold leading-[1.15] tracking-tight text-[#111827]">
              {service.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-[#6B7280]">
              {service.masterName}
            </p>
            {service.categoryName ? (
              <p className={`mt-2 ${catalogDesktopSectionLabel}`}>
                {formatServiceCardCategoryLabel(service.categoryName, service.categoryCode)}
              </p>
            ) : null}
          </div>

          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full bg-[#F1EFEF] text-[#9CA3AF]"
            aria-hidden
          >
            <HiChevronRight className="h-5 w-5" />
          </span>
        </div>

        <div className={`mt-4 space-y-1 pt-3 ${catalogInnerDivider}`}>
          <StatRow
            icon={<HiWallet className="h-[18px] w-[18px]" aria-hidden />}
            label="Цена"
            value={service.minPrice > 0 ? formatPriceFrom(service.minPrice) : 'Уточните'}
          />
          <StatRow
            icon={<HiClock className="h-[18px] w-[18px]" aria-hidden />}
            label="Длительность"
            value={formatDurationMinutes(service.durationMinutes)}
          />
          <StatRow
            icon={<HiCalendarDays className="h-[18px] w-[18px]" aria-hidden />}
            label="Окна"
            value={service.hasToday ? 'Сегодня' : hasSlot ? 'Есть' : 'Уточните'}
            valueClassName={
              service.hasToday || hasSlot
                ? 'text-[15px] font-semibold text-[#F47C8C]'
                : 'text-[15px] font-semibold text-[#111827]'
            }
          />
        </div>

        <div className="mt-4 rounded-[10px] bg-[#F5F5F5] p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#8E8E93]">Ближайшее окно</p>
              {hasSlot ? (
                <p className="mt-0.5 text-[14px] font-semibold leading-snug text-[#111827]">{slotLine}</p>
              ) : (
                <p className="mt-0.5 text-[14px] font-medium leading-snug text-[#8E8E93]">
                  Свободных окон пока нет
                </p>
              )}
            </div>
            <span className={hasSlot ? catalogPrimaryBtn : catalogSecondaryBtn}>
              {resolveServiceCardCtaLabel(hasSlot)}
            </span>
          </div>
        </div>
      </div>

      {showPromo ? (
        <div className={`flex items-center gap-2 bg-[#F6F7FB] px-4 py-3 ${catalogInnerDivider}`}>
          <span className="text-[13px] font-semibold text-[#374151]">С акцией</span>
          <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-[#6B7280]">
            {service.promoText}
          </span>
          <HiChevronRight className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        </div>
      ) : null}
    </Link>
  );
}
