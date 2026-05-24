import { derivePromotionStatus } from './servicesFormat';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle, ServicePromotion } from './servicesTypes';

export type ServicesTabMetrics = {
  catalog: {
    total: number;
    visible: number;
    hidden: number;
    avgPrice: number;
  };
  price: {
    total: number;
    visible: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
  };
  bundles: {
    total: number;
    published: number;
    drafts: number;
    catalogServices: number;
  };
  promotions: {
    total: number;
    active: number;
    scheduled: number;
    drafts: number;
  };
};

function priceStats(services: ManagedService[]) {
  const prices = services
    .map((s) => (Number.isFinite(s.priceByn) ? s.priceByn : 0))
    .filter((p) => p >= 0);

  const total = services.length;
  const visible = services.filter((s) => s.isActive !== false).length;
  const avg =
    prices.length > 0 ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length) : 0;
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  const max = prices.length > 0 ? Math.max(...prices) : 0;

  return { total, visible, hidden: total - visible, avg, min, max };
}

export function computeServicesTabMetrics(
  services: ManagedService[],
  bundles: ServiceBundle[],
  promotions: ServicePromotion[],
): ServicesTabMetrics {
  const { total, visible, hidden, avg, min, max } = priceStats(services);

  const publishedBundles = bundles.filter((b) => b.status !== 'draft').length;
  const draftBundles = bundles.filter((b) => b.status === 'draft').length;

  let activePromos = 0;
  let scheduledPromos = 0;
  let draftPromos = 0;

  for (const promo of promotions) {
    const status = derivePromotionStatus(promo);
    if (status === 'active') activePromos += 1;
    else if (status === 'scheduled') scheduledPromos += 1;
    else if (status === 'draft') draftPromos += 1;
  }

  return {
    catalog: { total, visible, hidden, avgPrice: avg },
    price: { total, visible, avgPrice: avg, minPrice: min, maxPrice: max },
    bundles: {
      total: bundles.length,
      published: publishedBundles,
      drafts: draftBundles,
      catalogServices: total,
    },
    promotions: {
      total: promotions.length,
      active: activePromos,
      scheduled: scheduledPromos,
      drafts: draftPromos,
    },
  };
}
