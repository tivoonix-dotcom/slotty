import type { CatalogViewMode } from './ServicesCatalogViewToggle';

const KEY_PREFIX = 'slotty_services_catalog_prefs_v1';

export type ServicesCatalogPrefs = {
  viewMode: CatalogViewMode;
};

const DEFAULT_PREFS: ServicesCatalogPrefs = {
  viewMode: 'list',
};

function storageKey(masterId?: string | null): string {
  return `${KEY_PREFIX}_${masterId?.trim() || 'local'}`;
}

export function loadServicesCatalogPrefs(masterId?: string | null): ServicesCatalogPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(storageKey(masterId));
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ServicesCatalogPrefs>;
    const viewMode = parsed.viewMode === 'grid' ? 'grid' : 'list';
    return { viewMode };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveServicesCatalogPrefs(
  masterId: string | null | undefined,
  prefs: ServicesCatalogPrefs,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(masterId), JSON.stringify(prefs));
  } catch {
    // ignore quota / private mode
  }
}
