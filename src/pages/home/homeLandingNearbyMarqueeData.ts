import { getServiceCategoryPath, SERVICES_PATH } from '../../app/paths';
import { SERVICE_CATEGORY_LABELS } from '../../features/catalog/serviceCategoryLabels';
import { formatDistanceKm } from '../client/lib/catalogFormat';
import {
  catalogItemToListingRecord,
  fetchCatalogListings,
} from '../../features/services/api/catalogListingsApi';
import {
  DEMO_MASTER_PROFILES,
  type ServiceListingRecord,
} from '../../features/services/model/demoMasters';
import { getApiBaseUrl } from '../../shared/api/backendClient';

export type NearbyMarqueeChip = {
  id: string;
  label: string;
  to: string;
};

const LABEL_TO_CATEGORY_CODE = Object.fromEntries(
  Object.entries(SERVICE_CATEGORY_LABELS).map(([code, label]) => [label, code]),
);

const DEMO_DISTANCES_KM = [
  0.1, 0.12, 0.15, 0.18, 0.22, 0.25, 0.28, 0.32, 0.35, 0.4, 0.45, 0.5, 0.55, 0.62, 0.68, 0.75,
  0.82, 0.9, 0.95, 1.05, 1.15, 1.25, 1.35, 1.45,
];

const GENERIC_SERVICE_TITLES = new Set([
  'базовая процедура',
  'индивидуальная запись',
  'популярная услуга',
  'услуга',
  'запись',
  'консультация',
]);

function resolveCategoryCode(listing: Pick<ServiceListingRecord, 'category' | 'categoryCode'>): string | null {
  const code = listing.categoryCode?.trim();
  if (code) return code;
  const label = listing.category.trim();
  return LABEL_TO_CATEGORY_CODE[label] ?? null;
}

function resolveDisplayTitle(listing: Pick<ServiceListingRecord, 'serviceName' | 'category'>): string {
  const name = listing.serviceName.trim();
  const category = listing.category.trim();
  const normalized = name.toLowerCase();

  if (!name || GENERIC_SERVICE_TITLES.has(normalized)) {
    return category || name || 'Услуга';
  }

  return name;
}

function listingToChip(listing: ServiceListingRecord, index: number): NearbyMarqueeChip {
  const title = resolveDisplayTitle(listing);
  const distance = formatDistanceKm(
    listing.distanceKm ?? DEMO_DISTANCES_KM[index % DEMO_DISTANCES_KM.length],
  );
  const label = distance ? `${title} · ${distance} от вас` : `${title} рядом с вами`;
  const categoryCode = resolveCategoryCode(listing);
  const to = categoryCode ? getServiceCategoryPath(categoryCode) : SERVICES_PATH;

  return { id: `${listing.masterId}-${title}`, label, to };
}

function dedupeNearbyChips(chips: NearbyMarqueeChip[]): NearbyMarqueeChip[] {
  const seen = new Set<string>();
  return chips.filter((chip) => {
    const key = chip.label.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildDemoNearbyMarqueeChips(): NearbyMarqueeChip[] {
  let index = 0;
  const chips = DEMO_MASTER_PROFILES.flatMap((master) =>
    master.services.map((service) => {
      const chip = listingToChip(
        {
          id: `${master.masterId}-${service.id}`,
          masterId: master.masterId,
          masterName: master.masterName,
          category: master.category,
          categoryCode: master.categoryCode ?? LABEL_TO_CATEGORY_CODE[master.category],
          serviceName: service.title,
          rating: master.rating,
          reviewsCount: master.reviewsCount,
          location: master.location,
          priceFrom: service.price,
          photoUrl: master.photoUrl,
          distanceKm: DEMO_DISTANCES_KM[index % DEMO_DISTANCES_KM.length],
        },
        index,
      );
      index += 1;
      return chip;
    }),
  );

  return dedupeNearbyChips(chips);
}

/** Чётные / нечётные — чтобы ряды не повторяли одни и те же услуги рядом. */
export function splitMarqueeRows<T>(items: T[]): [T[], T[]] {
  const rowA: T[] = [];
  const rowB: T[] = [];
  items.forEach((item, index) => {
    if (index % 2 === 0) rowA.push(item);
    else rowB.push(item);
  });
  return [rowA, rowB];
}

export function buildMarqueeTrack(items: NearbyMarqueeChip[]): NearbyMarqueeChip[] {
  if (items.length === 0) return items;
  return [...items, ...items];
}

export async function loadNearbyMarqueeChips(): Promise<NearbyMarqueeChip[]> {
  const demo = buildDemoNearbyMarqueeChips();

  if (!getApiBaseUrl()) {
    return demo;
  }

  try {
    const res = await fetchCatalogListings({ limit: 80, sortBy: 'recommended' });
    const listings = res.items.map(catalogItemToListingRecord);
    if (listings.length === 0) return demo;

    const apiChips = dedupeNearbyChips(listings.map((listing, index) => listingToChip(listing, index)));

    if (apiChips.length >= demo.length) return apiChips;

    const merged = dedupeNearbyChips([...apiChips, ...demo]);
    return merged;
  } catch {
    return demo;
  }
}
