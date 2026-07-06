import { fetchPublishedMasters } from '../../services/api/publishedMastersApi';
import { getApiBaseUrl, getStoredAuthToken } from '../../../shared/api/backendClient';
import {
  addMyFavoriteMaster,
  fetchMyFavoriteMasterIds,
  fetchMyFavorites,
  syncMyFavoriteMasters,
  type FavoriteMasterDto,
} from '../api/clientFavorites';
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

/** Обновить локальный кэш id после успешной загрузки с API. */
export function mirrorApiFavoritesToLocalCache(favorites: FavoriteMasterDto[]): void {
  replaceFavoriteMasterIds(favorites.map((f) => f.masterId));
}

/** Отправляет id из localStorage на сервер (после входа). */
let favoritesSyncedThisSession = false;

export function resetFavoritesSyncSessionForTests(): void {
  favoritesSyncedThisSession = false;
}

export async function syncLocalFavoritesToServer(opts?: { force?: boolean }): Promise<void> {
  if (!opts?.force && favoritesSyncedThisSession) return;
  if (!getApiBaseUrl() || !getStoredAuthToken()) return;
  const ids = getFavoriteMasterIds();
  if (!ids.length) {
    favoritesSyncedThisSession = true;
    return;
  }
  try {
    await syncMyFavoriteMasters(ids);
  } catch {
    for (const masterId of ids) {
      try {
        await addMyFavoriteMaster(masterId);
      } catch {
        /* мастер не опубликован или уже в избранном */
      }
    }
  }
  try {
    await refreshFavoriteMasterIdsFromApi();
  } catch {
    /* кэш обновится при следующем открытии профиля */
  }
  favoritesSyncedThisSession = true;
}

/** Загружает id избранного с API и кладёт в localStorage (для карточек мастеров). */
export async function refreshFavoriteMasterIdsFromApi(): Promise<string[]> {
  if (!getApiBaseUrl() || !getStoredAuthToken()) return [];
  const ids = await fetchMyFavoriteMasterIds();
  mirrorApiFavoritesToLocalCache(ids.map((masterId) => placeholderFavorite(masterId)));
  return ids;
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

/** Полный список избранного с сервера + синхронизация кэша. */
export async function fetchFavoritesForDisplay(): Promise<FavoriteMasterDto[]> {
  const rows = await fetchMyFavorites();
  mirrorApiFavoritesToLocalCache(rows);
  return rows;
}

/** Подгружает id избранного с API в localStorage (после входа). */
export function preloadFavoriteMasterIds(): void {
  if (!getApiBaseUrl() || !getStoredAuthToken()) return;
  void refreshFavoriteMasterIdsFromApi().catch(() => {
    /* ignore */
  });
}
