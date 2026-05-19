import { fetchPublishedMasters } from '../../services/api/publishedMastersApi';
import { getApiBaseUrl, getStoredAuthToken } from '../../../shared/api/backendClient';
import { addMyFavoriteMaster, type FavoriteMasterDto } from '../api/clientFavorites';
import { hasApiBackend } from './favoriteMastersPolicy';
import { getFavoriteMasterIds, replaceFavoriteMasterIds } from './favoriteMastersStorage';

function placeholderFavorite(masterId: string): FavoriteMasterDto {
  return {
    masterId,
    createdAt: new Date().toISOString(),
    displayName: 'Мастер',
    photoUrl: null,
    slug: null,
    rating: 0,
    reviewsCount: 0,
  };
}

/** Отправляет id из localStorage на сервер (после входа в Telegram). */
export async function syncLocalFavoritesToServer(): Promise<void> {
  if (!getApiBaseUrl() || !getStoredAuthToken()) return;
  const ids = getFavoriteMasterIds();
  for (const masterId of ids) {
    try {
      await addMyFavoriteMaster(masterId);
    } catch {
      /* мастер не опубликован или уже в избранном */
    }
  }
}

/** Список избранного только для dev без VITE_API_URL. */
export async function resolveLocalFavoritesForDisplay(): Promise<FavoriteMasterDto[]> {
  if (hasApiBackend()) return [];

  const ids = getFavoriteMasterIds();
  if (!ids.length) return [];

  if (!getApiBaseUrl()) {
    return ids.map(placeholderFavorite);
  }

  try {
    const masters = await fetchPublishedMasters({ limit: 500 });
    const byId = new Map(masters.map((m) => [m.masterId, m]));
    return ids.map((masterId) => {
      const m = byId.get(masterId);
      if (!m) return placeholderFavorite(masterId);
      return {
        masterId: m.masterId,
        createdAt: new Date().toISOString(),
        displayName: m.displayName,
        photoUrl: m.photoUrl,
        slug: m.slug,
        rating: m.rating,
        reviewsCount: m.reviewsCount,
      };
    });
  } catch {
    return ids.map(placeholderFavorite);
  }
}

/** Обновить локальный кэш id после успешной загрузки с API. */
export function mirrorApiFavoritesToLocalCache(favorites: FavoriteMasterDto[]): void {
  replaceFavoriteMasterIds(favorites.map((f) => f.masterId));
}
