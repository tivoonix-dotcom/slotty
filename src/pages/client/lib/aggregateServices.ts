import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import {
  isSlotToday,
  listingDistanceKm,
  masterLocationChipLine,
  visitFormatChipLabel,
} from './catalogFormat';
import {
  sanitizeDisplayName,
  sanitizeLocationLabel,
  sanitizeServiceTitle,
} from './catalogDisplaySanitize';
import { pickServiceCardAchievements } from './serviceCardPresentation';
import { isLikelyNewMaster } from './mastersTopRankSections';
import { resolveMasterTopRankStatus, type MasterTopAchievementKind } from './resolveMasterTopRankStatus';

export type AggregatedServiceCard = {
  id: string;
  categoryCode: string;
  categoryName: string;
  /** Название услуги мастера */
  title: string;
  /** Имя мастера */
  subtitle: string;
  masterId: string;
  masterName: string;
  primaryServiceId?: string;
  nextSlotId?: string | null;
  photoUrl?: string;
  serviceCoverUrl?: string;
  serviceCoverFocalX?: number;
  serviceCoverFocalY?: number;
  minPrice: number;
  durationMinutes: number;
  /** Всегда 1 для карточки конкретной услуги */
  masterCount: number;
  nearestSlotIso: string | null;
  hasToday: boolean;
  promotionOnly: boolean;
  badge: 'popular' | 'hit' | 'sale' | null;
  promoText: string | null;
  avgRating: number;
  totalReviews: number;
  tags: string[];
  isNew: boolean;
  /** Оценка просмотров за 7 дней (клиентский скоринг до API). */
  weeklyViews: number;
  /** Достижения мастера (топ, рейтинг, отзывы…). */
  achievementLabels: string[];
  achievementIds: MasterTopAchievementKind[];
  portfolioTotal: number;
  /** Короткая локация мастера (live с listing.location). */
  locationLabel?: string;
  /** «В студии» / «На дому». */
  visitLabel?: string;
  /** Расстояние до пользователя, км (API или клиентский расчёт). */
  distanceKm?: number | null;
  isVerified?: boolean;
};

export type MapListingsGeo = {
  userLat?: number | null;
  userLng?: number | null;
};

function resolveCategoryCode(
  row: ServiceListingRecord,
  categories: ServiceCategoryDto[],
): string {
  if (row.categoryCode?.trim()) return row.categoryCode.trim();
  const match =
    categories.find((c) => c.name === row.category) ??
    categories.find((c) => row.category.toLowerCase().includes(c.name.toLowerCase()));
  return match?.code ?? row.category.toLowerCase().replace(/\s+/g, '-');
}

function parseDurationMinutes(serviceName: string): number {
  const m = serviceName.match(/(\d+)\s*мин/);
  if (m) return Number(m[1]);
  const h = serviceName.match(/(\d+)\s*ч/);
  if (h) return Number(h[1]) * 60;
  return 90;
}

function estimateWeeklyViews(input: {
  totalReviews: number;
  hasToday: boolean;
  badge: AggregatedServiceCard['badge'];
  avgRating: number;
}): number {
  const base =
    140 +
    input.totalReviews * 22 +
    Math.round(input.avgRating * 45) +
    (input.hasToday ? 120 : 0) +
    (input.badge === 'popular' ? 260 : input.badge === 'hit' ? 180 : input.badge === 'sale' ? 90 : 0);

  return Math.max(48, base);
}

function listingBadge(row: ServiceListingRecord, hasToday: boolean): {
  badge: AggregatedServiceCard['badge'];
  promotionOnly: boolean;
} {
  if (row.hasPromotion) {
    return { badge: 'sale', promotionOnly: true };
  }

  let badge: AggregatedServiceCard['badge'] = null;
  if (row.reviewsCount > 50 && row.rating >= 4.8) {
    badge = 'popular';
  } else if (hasToday && row.rating >= 4.5) {
    badge = 'hit';
  }

  return { badge, promotionOnly: false };
}

/** Одна карточка каталога = одна услуга конкретного мастера. */
export function mapListingsToServiceCards(
  listings: ServiceListingRecord[],
  categories: ServiceCategoryDto[],
  geo?: MapListingsGeo,
): AggregatedServiceCard[] {
  const userLat = geo?.userLat ?? null;
  const userLng = geo?.userLng ?? null;

  return listings
    .map((row) => {
      const categoryCode = resolveCategoryCode(row, categories);
      const categoryName =
        categories.find((c) => c.code === categoryCode)?.name ?? row.category;
      const hasToday = row.nextSlotStartsAt ? isSlotToday(row.nextSlotStartsAt) : false;
      const { badge, promotionOnly } = listingBadge(row, hasToday);
      const avgRating = Math.round(row.rating * 10) / 10;
      const topRank = resolveMasterTopRankStatus(row.masterId, listings);
      const cardAchievements = pickServiceCardAchievements(topRank.achievements, 2, {
        reviewsCount: row.reviewsCount,
        avgRating: row.rating,
        badge,
      });
      const portfolioTotal =
        row.portfolioTotal ??
        (row.portfolioPreview?.length ? row.portfolioPreview.length : 0);

      const sanitizeCtx = { categoryCode, masterId: row.masterId };
      const distanceKm =
        row.distanceKm != null && Number.isFinite(row.distanceKm)
          ? row.distanceKm
          : listingDistanceKm(row, userLat, userLng);

      return {
        id: row.id,
        categoryCode,
        categoryName,
        title: sanitizeServiceTitle(row.serviceName, sanitizeCtx),
        subtitle: sanitizeDisplayName(row.masterName, sanitizeCtx),
        masterId: row.masterId,
        masterName: sanitizeDisplayName(row.masterName, sanitizeCtx),
        primaryServiceId: row.primaryServiceId,
        nextSlotId: row.nextSlotId,
        photoUrl: row.photoUrl,
        serviceCoverUrl: row.serviceCoverUrl,
        serviceCoverFocalX: row.serviceCoverFocalX,
        serviceCoverFocalY: row.serviceCoverFocalY,
        minPrice: row.priceFrom,
        durationMinutes: parseDurationMinutes(row.serviceName),
        masterCount: 1,
        nearestSlotIso: row.nextSlotStartsAt ?? null,
        hasToday,
        promotionOnly,
        badge,
        promoText: null,
        avgRating,
        totalReviews: row.reviewsCount,
        tags: categoryName ? [categoryName] : [],
        isNew: row.reviewsCount <= 0 || isLikelyNewMaster(row),
        weeklyViews:
          row.weeklyViews != null && Number.isFinite(row.weeklyViews)
            ? row.weeklyViews
            : estimateWeeklyViews({
                totalReviews: row.reviewsCount,
                hasToday,
                badge,
                avgRating: row.rating,
              }),
        achievementLabels: cardAchievements.map((item) => item.title),
        achievementIds: cardAchievements.map((item) => item.id),
        portfolioTotal,
        locationLabel: sanitizeLocationLabel(masterLocationChipLine(row)),
        visitLabel: visitFormatChipLabel(row),
        distanceKm,
        isVerified: row.isVerified ?? false,
      };
    });
}

/** @deprecated Используйте mapListingsToServiceCards */
export function aggregateServicesByCategory(
  listings: ServiceListingRecord[],
  categories: ServiceCategoryDto[],
): AggregatedServiceCard[] {
  return mapListingsToServiceCards(listings, categories);
}
