import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

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
    throw new Error(await readSlottyApiErrorMessage(res));
  }
  const data = (await res.json()) as { favorites?: FavoriteMasterDto[] };
  return data.favorites ?? [];
}

export async function fetchMyFavoriteMasterIds(): Promise<string[]> {
  const res = await apiFetch('/api/me/favorites/ids');
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
  const data = (await res.json()) as { masterIds?: string[] };
  return data.masterIds ?? [];
}

export async function syncMyFavoriteMasters(masterIds: string[]): Promise<void> {
  const res = await apiFetch('/api/me/favorites/sync', {
    method: 'PUT',
    body: JSON.stringify({ masterIds }),
  });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
}

export async function fetchFavoriteMasterStatus(masterId: string): Promise<boolean> {
  const res = await apiFetch(`/api/me/favorites/${encodeURIComponent(masterId)}/status`);
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
  const data = (await res.json()) as { favored?: boolean };
  return Boolean(data.favored);
}

export async function addMyFavoriteMaster(masterId: string): Promise<void> {
  const res = await apiFetch(`/api/me/favorites/${encodeURIComponent(masterId)}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
}

export async function removeMyFavoriteMaster(masterId: string): Promise<void> {
  const res = await apiFetch(`/api/me/favorites/${encodeURIComponent(masterId)}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
}
