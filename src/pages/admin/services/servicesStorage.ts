import type { ServiceBundle, ServicePromotion } from './servicesTypes';

const BUNDLES_KEY = 'slotty_master_service_bundles_v1';
const PROMOTIONS_KEY = 'slotty_master_service_promotions_v1';

function readJson<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, rows: T[]) {
  window.localStorage.setItem(key, JSON.stringify(rows));
}

export function loadServiceBundles(): ServiceBundle[] {
  return readJson<ServiceBundle>(BUNDLES_KEY);
}

export function saveServiceBundles(rows: ServiceBundle[]) {
  writeJson(BUNDLES_KEY, rows);
}

export function loadServicePromotions(): ServicePromotion[] {
  return readJson<ServicePromotion>(PROMOTIONS_KEY);
}

export function saveServicePromotions(rows: ServicePromotion[]) {
  writeJson(PROMOTIONS_KEY, rows);
}

export function newBundleId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `bundle-${Date.now()}`;
}

export function newPromotionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `promo-${Date.now()}`;
}
