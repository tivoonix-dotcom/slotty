import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchServiceCategories, type ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import {
  catalogItemToListingRecord,
  fetchCatalogListings,
  type CatalogListingsParams,
} from '../../../features/services/api/catalogListingsApi';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { getApiBaseUrl } from '../../../shared/api/backendClient';

export type CatalogLoadState = {
  listings: ServiceListingRecord[];
  categories: ServiceCategoryDto[];
  loading: boolean;
  error: string | null;
};

function paramsKey(params: CatalogListingsParams): string {
  return JSON.stringify(params);
}

export function useCatalogData(params: CatalogListingsParams = {}) {
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const key = paramsKey(params);

  const [state, setState] = useState<CatalogLoadState>({
    listings: [],
    categories: [],
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    if (!getApiBaseUrl()) {
      setState({
        listings: [],
        categories: [],
        loading: false,
        error: 'Сервер не настроен. Укажите VITE_API_URL в окружении.',
      });
      return;
    }
    try {
      const p = paramsRef.current;
      const [catRes, listRes] = await Promise.all([
        fetchServiceCategories(),
        fetchCatalogListings({ limit: 80, sortBy: 'recommended', ...p }),
      ]);
      const listings = listRes.items.map(catalogItemToListingRecord);
      setState({
        listings,
        categories: catRes.sort((a, b) => a.sortOrder - b.sortOrder),
        loading: false,
        error: null,
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Не удалось загрузить каталог',
      }));
    }
  }, [key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
