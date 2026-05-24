import type { AggregatedServiceCard } from './aggregateServices';

export type ServiceCatalogChip = 'popular' | 'promo' | 'today' | 'new';

export function filterServicesForCatalog(
  services: AggregatedServiceCard[],
  opts: {
    search: string;
    chips: Set<ServiceCatalogChip>;
    onlineBookingOnly?: boolean;
  },
): AggregatedServiceCard[] {
  let list = services;

  if (opts.search.trim()) {
    const q = opts.search.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q) ||
        s.categoryCode.toLowerCase().includes(q),
    );
  }

  if (opts.chips.has('popular')) {
    list = list.filter((s) => s.badge === 'popular' || s.badge === 'hit');
  }
  if (opts.chips.has('today')) {
    list = list.filter((s) => s.hasToday);
  }
  if (opts.chips.has('promo')) {
    list = list.filter((s) => s.badge === 'sale' || s.promotionOnly);
  }
  if (opts.chips.has('new')) {
    list = list.filter((s) => s.isNew);
  }
  if (opts.onlineBookingOnly) {
    list = list.filter((s) => Boolean(s.nearestSlotIso));
  }

  return list;
}
