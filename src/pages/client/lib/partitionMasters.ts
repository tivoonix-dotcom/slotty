import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { isSlotToday, listingDistanceKm } from './catalogFormat';
import { sortMastersByDistance } from './groupMasters';

export type MasterFeedSection = {
  id: 'today' | 'nearby' | 'top' | 'new' | 'all';
  title: string;
  subtitle?: string;
  items: ServiceListingRecord[];
  layout: 'carousel' | 'list' | 'top';
};

export type MasterFeed = {
  total: number;
  freeTodayCount: number;
  sections: MasterFeedSection[];
  /** Один мастер — отдельный крупный блок без повторов */
  singleMaster: ServiceListingRecord | null;
};

function takeUnique(
  source: ServiceListingRecord[],
  used: Set<string>,
  limit: number,
): ServiceListingRecord[] {
  const out: ServiceListingRecord[] = [];
  for (const m of source) {
    if (used.has(m.masterId)) continue;
    used.add(m.masterId);
    out.push(m);
    if (out.length >= limit) break;
  }
  return out;
}

function sortBySoonest(a: ServiceListingRecord, b: ServiceListingRecord): number {
  const ta = a.nextSlotStartsAt ? new Date(a.nextSlotStartsAt).getTime() : Number.POSITIVE_INFINITY;
  const tb = b.nextSlotStartsAt ? new Date(b.nextSlotStartsAt).getTime() : Number.POSITIVE_INFINITY;
  return ta - tb;
}

function sortByTop(a: ServiceListingRecord, b: ServiceListingRecord): number {
  if (b.rating !== a.rating) return b.rating - a.rating;
  return b.reviewsCount - a.reviewsCount;
}

/** Мастера с мало отзывами — блок «Новые» (пока нет createdAt в API). */
function isLikelyNew(m: ServiceListingRecord): boolean {
  return m.reviewsCount <= 2 && m.rating < 4.8;
}

export function buildMasterFeed(
  masters: ServiceListingRecord[],
  opts: {
    hasGeo: boolean;
    userLat: number | null;
    userLng: number | null;
    flatMode: boolean;
  },
): MasterFeed {
  const total = masters.length;
  const freeTodayCount = masters.filter((m) => isSlotToday(m.nextSlotStartsAt)).length;

  if (total === 0) {
    return { total: 0, freeTodayCount: 0, sections: [], singleMaster: null };
  }

  if (total === 1) {
    return {
      total: 1,
      freeTodayCount: isSlotToday(masters[0].nextSlotStartsAt) ? 1 : 0,
      sections: [],
      singleMaster: masters[0],
    };
  }

  if (opts.flatMode) {
    return {
      total,
      freeTodayCount,
      sections: [
        {
          id: 'all',
          title: 'Найдено',
          subtitle: `${total} ${total === 1 ? 'мастер' : total < 5 ? 'мастера' : 'мастеров'}`,
          items: masters,
          layout: 'list',
        },
      ],
      singleMaster: null,
    };
  }

  const used = new Set<string>();
  const sections: MasterFeedSection[] = [];

  const todayPool = masters.filter((m) => isSlotToday(m.nextSlotStartsAt)).sort(sortBySoonest);
  const today = takeUnique(todayPool, used, 12);
  if (today.length > 0) {
    sections.push({
      id: 'today',
      title: 'Свободны сегодня',
      subtitle: 'Можно записаться на сегодня',
      items: today,
      layout: 'carousel',
    });
  }

  if (opts.hasGeo && opts.userLat != null && opts.userLng != null) {
    const withDist = masters
      .map((m) => ({ m, km: listingDistanceKm(m, opts.userLat, opts.userLng) }))
      .filter((x) => x.km != null)
      .sort((a, b) => (a.km ?? 0) - (b.km ?? 0))
      .map((x) => x.m);
    const nearby = takeUnique(withDist, used, 10);
    if (nearby.length > 0) {
      sections.push({
        id: 'nearby',
        title: 'Мастера рядом',
        subtitle: 'Ближе к вам',
        items: nearby,
        layout: 'carousel',
      });
    }
  } else {
    const cityPool = sortMastersByDistance([...masters], null, null);
    const inCity = takeUnique(cityPool, used, 8);
    if (inCity.length > 0) {
      sections.push({
        id: 'nearby',
        title: 'В Минске',
        subtitle: 'Укажите геолокацию — покажем точнее',
        items: inCity,
        layout: 'carousel',
      });
    }
  }

  const topPool = masters.filter((m) => m.rating >= 4.5 || m.reviewsCount >= 10).sort(sortByTop);
  const topFallback = [...masters].sort(sortByTop);
  const top = takeUnique(topPool.length >= 2 ? topPool : topFallback, used, 8);
  if (top.length >= 1) {
    sections.push({
      id: 'top',
      title: 'Топ мастера',
      subtitle: 'Высокий рейтинг и отзывы',
      items: top,
      layout: 'top',
    });
  }

  const newPool = masters.filter(isLikelyNew);
  const newest = takeUnique(newPool.length > 0 ? newPool : [...masters].reverse(), used, 8);
  if (newest.length >= 2) {
    sections.push({
      id: 'new',
      title: 'Новые мастера',
      subtitle: 'Недавно на SLOTTY',
      items: newest,
      layout: 'carousel',
    });
  }

  const allSorted = [...masters].sort((a, b) => sortByTop(a, b));
  sections.push({
    id: 'all',
    title: 'Все мастера',
    subtitle: `${total} в каталоге`,
    items: allSorted,
    layout: 'list',
  });

  return { total, freeTodayCount, sections, singleMaster: null };
}
