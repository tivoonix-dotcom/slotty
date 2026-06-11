import type { AggregatedServiceCard } from './aggregateServices';

export type ServiceCatalogChip = 'popular' | 'promo' | 'today' | 'new';

/** Фильтрация выполняется на сервере (catalog_search_listings); клиент сохраняет порядок API. */
export function filterServicesForCatalog(
  services: AggregatedServiceCard[],
  _opts: {
    search: string;
    chips: Set<ServiceCatalogChip>;
    onlineBookingOnly?: boolean;
    categoryCode?: string | null;
  },
): AggregatedServiceCard[] {
  return services;
}
