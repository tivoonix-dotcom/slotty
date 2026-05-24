import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { isSlotToday } from './catalogFormat';

const CATEGORY_SUBTITLE: Record<string, string> = {
  manicure: 'Классический, аппаратный, комбинированный',
  barbers: 'Стрижка, борода, камуфляж',
  'brows-lashes': 'Архитектура бровей, ламинирование, наращивание',
  brows_lashes: 'Архитектура бровей, ламинирование, наращивание',
  massage: 'Классический, расслабляющий, лечебный',
  fitness: 'Персональные и групповые тренировки',
  tattoo: 'Эскиз, мини-тату, перекрытие',
};

export type AggregatedServiceCard = {
  id: string;
  categoryCode: string;
  categoryName: string;
  /** Типичное название услуги в категории */
  title: string;
  subtitle: string;
  minPrice: number;
  durationMinutes: number;
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
};

function medianDuration(values: number[]): number {
  if (!values.length) return 90;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 90;
}

export function aggregateServicesByCategory(
  listings: ServiceListingRecord[],
  categories: ServiceCategoryDto[],
): AggregatedServiceCard[] {
  const byCode = new Map<string, ServiceListingRecord[]>();

  for (const row of listings) {
    const match =
      categories.find((c) => c.name === row.category) ??
      categories.find((c) => row.category.toLowerCase().includes(c.name.toLowerCase()));
    const code = match?.code ?? row.category.toLowerCase().replace(/\s+/g, '-');
    const list = byCode.get(code) ?? [];
    list.push(row);
    byCode.set(code, list);
  }

  const cards: AggregatedServiceCard[] = [];

  for (const cat of categories) {
    const rows = byCode.get(cat.code) ?? [];
    if (!rows.length) continue;

    const masterIds = new Set(rows.map((r) => r.masterId));
    const prices = rows.map((r) => r.priceFrom).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;

    const durations = rows.map((r) => {
      const m = r.serviceName.match(/(\d+)\s*мин/);
      return m ? Number(m[1]) : 90;
    });

    let nearest: string | null = null;
    let nearestMs = Number.POSITIVE_INFINITY;
    let hasToday = false;
    for (const r of rows) {
      if (r.nextSlotStartsAt) {
        const t = new Date(r.nextSlotStartsAt).getTime();
        if (!Number.isNaN(t) && t < nearestMs) {
          nearestMs = t;
          nearest = r.nextSlotStartsAt;
        }
        if (isSlotToday(r.nextSlotStartsAt)) hasToday = true;
      }
    }

    const topRating = Math.max(...rows.map((r) => r.rating));
    const totalReviews = rows.reduce((s, r) => s + r.reviewsCount, 0);

    let badge: AggregatedServiceCard['badge'] = null;
    if (totalReviews > 80 || topRating >= 4.9) badge = 'popular';
    else if (hasToday && masterIds.size >= 5) badge = 'hit';

    let promoText: string | null = null;
    if (!badge && hasToday && minPrice > 0 && minPrice <= 55) {
      badge = 'sale';
      promoText = '-10% на первое посещение';
    }

    const primaryName =
      rows.sort((a, b) => b.reviewsCount - a.reviewsCount)[0]?.serviceName ?? cat.name;
    const subtitle =
      CATEGORY_SUBTITLE[cat.code] ??
      CATEGORY_SUBTITLE[cat.code.replace(/-/g, '_')] ??
      'Выберите мастера и удобное время';

    cards.push({
      id: cat.code,
      categoryCode: cat.code,
      categoryName: cat.name,
      title: cat.name || primaryName,
      subtitle,
      minPrice,
      durationMinutes: medianDuration(durations),
      masterCount: masterIds.size,
      nearestSlotIso: nearest,
      hasToday,
      promotionOnly: badge === 'sale',
      badge,
      promoText,
      avgRating: Math.round(topRating * 10) / 10,
      totalReviews,
      tags: subtitle.split(/,\s*/).filter(Boolean).slice(0, 4),
      isNew: totalReviews < 40 && masterIds.size >= 2,
    });
  }

  return cards.sort((a, b) => b.masterCount - a.masterCount);
}
