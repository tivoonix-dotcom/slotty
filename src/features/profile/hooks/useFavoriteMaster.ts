import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import {
  addMyFavoriteMaster,
  removeMyFavoriteMaster,
} from '../api/clientFavorites';
import {
  favoritesRequireAuth,
  hasApiBackend,
  isPersistableMasterId,
} from '../lib/favoriteMastersPolicy';
import {
  FAVORITE_MASTERS_CHANGED,
  isFavoriteMasterId,
  setFavoriteMasterId,
  subscribeFavoriteMasterIds,
  toggleFavoriteMasterId,
} from '../lib/favoriteMastersStorage';

type FavoriteErrorHandler = (message: string) => void;

/**
 * Избранное мастера: при VITE_API_URL — сервер + JWT; без API — localStorage.
 */
export function useFavoriteMaster(
  masterId: string | undefined,
  onError: FavoriteErrorHandler,
) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const apiMode = hasApiBackend();
  const persistable = isPersistableMasterId(masterId);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const id = masterId?.trim();
    if (!id || !persistable) {
      setFav(false);
      return;
    }

    if (apiMode) {
      if (authLoading) return;
      if (!isAuthenticated) {
        setFav(false);
        return;
      }
      setFav(isFavoriteMasterId(id));
      return subscribeFavoriteMasterIds(() => setFav(isFavoriteMasterId(id)));
    }

    setFav(isFavoriteMasterId(id));
    return subscribeFavoriteMasterIds(() => setFav(isFavoriteMasterId(id)));
  }, [apiMode, authLoading, isAuthenticated, masterId, persistable]);

  const notifyFavoritesChanged = useCallback(() => {
    window.dispatchEvent(new CustomEvent(FAVORITE_MASTERS_CHANGED));
  }, []);

  const toggleFavorite = useCallback(async () => {
    const id = masterId?.trim();
    if (!id || !persistable) {
      if (apiMode) {
        onError('Этого мастера нельзя сохранить в избранное.');
      }
      return;
    }

    if (favoritesRequireAuth() && !isAuthenticated) {
      onError('Войдите в аккаунт, чтобы сохранять избранное.');
      return;
    }

    if (apiMode && isAuthenticated) {
      const wasFavorite = fav;
      const next = !wasFavorite;
      setFav(next);
      setFavoriteMasterId(id, next);
      try {
        if (next) await addMyFavoriteMaster(id);
        else await removeMyFavoriteMaster(id);
        notifyFavoritesChanged();
      } catch (e) {
        setFavoriteMasterId(id, wasFavorite);
        setFav(wasFavorite);
        onError(e instanceof Error ? e.message : 'Не удалось обновить избранное');
      }
      return;
    }

    const actual = toggleFavoriteMasterId(id);
    setFav(actual);
    notifyFavoritesChanged();
  }, [apiMode, fav, isAuthenticated, masterId, notifyFavoritesChanged, onError, persistable]);

  const toggleFavoriteFromEvent = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      await toggleFavorite();
    },
    [toggleFavorite],
  );

  const favoriteDisabled =
    !persistable || (favoritesRequireAuth() && (authLoading || !isAuthenticated));

  return {
    isFavorite: fav,
    toggleFavorite,
    toggleFavoriteFromEvent,
    favoriteDisabled,
    favoritesRequireAuth: favoritesRequireAuth() && !isAuthenticated,
  };
}
