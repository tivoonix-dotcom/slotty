import { apiFetch } from '../../../shared/api/backendClient';

export type FavoriteMasterDto = {
  masterId: string;
  createdAt: string;
  displayName: string;
  photoUrl: string | null;
  slug: string | null;
  rating: number;
  reviewsCount: number;
};

export async function fetchMyFavorites(): Promise<FavoriteMasterDto[]> {
  const res = await apiFetch('/api/me/favorites');
  if (!res.ok) {
    throw new Error(`FAVORITES_HTTP_${res.status}`);
  }
  const data = (await res.json()) as { favorites?: FavoriteMasterDto[] };
  return data.favorites ?? [];
}

export async function addMyFavoriteMaster(masterId: string): Promise<void> {
  const res = await apiFetch(`/api/me/favorites/${encodeURIComponent(masterId)}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`FAVORITES_ADD_${res.status}`);
  }
}

export async function removeMyFavoriteMaster(masterId: string): Promise<void> {
  const res = await apiFetch(`/api/me/favorites/${encodeURIComponent(masterId)}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`FAVORITES_REMOVE_${res.status}`);
  }
}
