import type { AggregatedServiceCard } from './aggregateServices';
import { formatWeeklyViewsLabel } from './catalogFormat';
import type { ServiceBadgeVariant } from '../components/ServiceBadge';
import type { MasterTopAchievement, MasterTopAchievementKind } from './resolveMasterTopRankStatus';

const ACHIEVEMENT_CARD_PRIORITY: MasterTopAchievementKind[] = [
  'week',
  'month',
  'reviews',
  'rating',
  'new',
];

export type ServiceCardAchievementPickContext = {
  reviewsCount?: number;
  avgRating?: number;
  badge?: AggregatedServiceCard['badge'];
};

function shouldShowCardAchievement(
  item: MasterTopAchievement,
  ctx?: ServiceCardAchievementPickContext,
): boolean {
  const reviews = Math.max(0, ctx?.reviewsCount ?? 0);
  const rating = ctx?.avgRating ?? 0;

  if (item.id === 'new') {
    if (reviews >= 5) return false;
    if (ctx?.badge === 'popular' || ctx?.badge === 'hit') return false;
    return reviews <= 3 && (rating >= 4.3 || reviews === 0);
  }
  if (item.id === 'reviews' && reviews <= 0) return false;
  if (item.id === 'rating' && rating <= 0) return false;
  return true;
}

export function pickServiceCardAchievements(
  achievements: MasterTopAchievement[],
  limit = 2,
  ctx?: ServiceCardAchievementPickContext,
): Array<{ id: MasterTopAchievementKind; title: string }> {
  const seen = new Set<MasterTopAchievementKind>();
  const result: Array<{ id: MasterTopAchievementKind; title: string }> = [];

  const sorted = [...achievements]
    .filter((item) => shouldShowCardAchievement(item, ctx))
    .sort(
      (a, b) =>
        ACHIEVEMENT_CARD_PRIORITY.indexOf(a.id) - ACHIEVEMENT_CARD_PRIORITY.indexOf(b.id),
    );

  for (const item of sorted) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push({ id: item.id, title: item.title });
    if (result.length >= limit) break;
  }

  return result;
}

export type ServiceCardInlineBadgeTone = 'mint' | 'pink' | 'amber' | 'blue';

export type ServiceCardInlineBadge = {
  id: string;
  label: string;
  tone: ServiceCardInlineBadgeTone;
  variant: ServiceBadgeVariant;
};

const TONE_TO_VARIANT: Record<ServiceCardInlineBadgeTone, ServiceBadgeVariant> = {
  mint: 'today',
  pink: 'promo',
  amber: 'topWeek',
  blue: 'verified',
};

export function serviceCardInlineBadgeClass(tone: ServiceCardInlineBadgeTone): string {
  return TONE_TO_VARIANT[tone];
}

export function resolveServicePhotoBadge(
  service: AggregatedServiceCard,
  showPromo: boolean,
): string | null {
  if (service.badge === 'hit') return 'Выбор Slotty';
  if (service.badge === 'popular') return 'Популярно';
  if (showPromo) return 'Акция';
  if (service.isNew && service.totalReviews < 5) return 'Новинка';
  return null;
}

/** Не больше трёх текстовых бейджей (достижения — отдельными картинками на карточке). */
export function resolveServiceInlineBadges(
  service: AggregatedServiceCard,
  options: { showPromo: boolean; hasSlot: boolean },
): ServiceCardInlineBadge[] {
  const badges: ServiceCardInlineBadge[] = [];
  const max = 3;

  if (service.isVerified && badges.length < max) {
    badges.push({
      id: 'verified',
      label: 'Проверенный мастер',
      tone: 'blue',
      variant: 'verified',
    });
  }

  if (service.hasToday && badges.length < max) {
    badges.push({
      id: 'today',
      label: 'Можно сегодня',
      tone: 'mint',
      variant: 'today',
    });
  }

  if (options.hasSlot && badges.length < max && !badges.some((b) => b.id === 'cancel')) {
    badges.push({
      id: 'cancel',
      label: 'Бесплатная отмена',
      tone: 'mint',
      variant: 'freeCancel',
    });
  }

  return badges.slice(0, max);
}

/** Бейдж «выбор» в плитке каталога (Kwork-style). */
export function resolveGridChoiceBadge(service: AggregatedServiceCard): {
  label: string;
  tone: 'today' | 'slotty' | 'promo';
} | null {
  if (service.hasToday) return { label: 'Сегодня', tone: 'today' };
  if (service.badge === 'hit') return { label: 'Выбор Slotty', tone: 'slotty' };
  if (service.badge === 'popular') return { label: 'Популярно', tone: 'slotty' };
  if (service.promoText) return { label: 'Акция', tone: 'promo' };
  if (service.isVerified) return { label: 'Проверен', tone: 'slotty' };
  return null;
}

/** Короткая trust-строка под именем мастера в плитке. */
export function resolveGridMasterTrustLine(service: AggregatedServiceCard): string | null {
  if (service.achievementLabels[0]) return service.achievementLabels[0];
  if (service.isVerified) return 'Проверенный мастер';
  if (service.avgRating >= 4.8 && service.totalReviews >= 5) return 'Высокий рейтинг';
  if (service.isNew && service.totalReviews < 5) return 'Новый мастер';
  return null;
}
/** Короткая подпись CTA на плитке каталога (Kwork-style на фото). */
export function resolveServiceCardGridCtaLabel(hasSlot: boolean): string {
  if (!hasSlot) return 'К мастеру';
  return 'Записаться';
}

/** Подпись CTA на карточке услуги. */
export function resolveServiceCardCtaLabel(hasSlot: boolean): string {
  if (!hasSlot) return 'Посмотреть мастера';
  return 'Записаться';
}

/** Клиентский язык вместо сырых просмотров (weeklyViews — оценка до API). */
export function formatServicePopularityHint(service: AggregatedServiceCard): string | null {
  if (service.weeklyViews >= 3) {
    return formatWeeklyViewsLabel(service.weeklyViews);
  }
  if (service.hasToday) return 'Можно записаться сегодня';
  if (service.badge === 'hit' || service.badge === 'popular') return 'Часто выбирают';
  if (service.achievementLabels.some((l) => l.toLowerCase().includes('недел'))) {
    return 'Популярно на неделе';
  }
  if (service.weeklyViews >= 400) return 'Часто смотрят';
  if (service.isNew && service.totalReviews < 5) return 'Новинка в каталоге';
  return null;
}
