import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import {
  addMyFavoriteMaster,
  fetchMyFavorites,
  removeMyFavoriteMaster,
} from '../api/clientFavorites';
import {
  favoritesRequireTelegramAuth,
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
 * Избранное мастера: при VITE_API_URL — только сервер (после входа в Telegram).
 * Без API — localStorage (локальная разработка).
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
      let cancelled = false;
      void (async () => {
        try {
          const list = await fetchMyFavorites();
          if (!cancelled) setFav(list.some((f) => f.masterId === id));
        } catch {
          if (!cancelled) setFav(false);
        }
      })();
      return () => {
        cancelled = true;
      };
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

    if (favoritesRequireTelegramAuth() && !isAuthenticated) {
      onError('Войдите через Telegram, чтобы сохранять избранное.');
      return;
    }

    if (apiMode && isAuthenticated) {
      const wasFavorite = fav;
      const next = !wasFavorite;
      setFav(next);
      try {
        if (next) await addMyFavoriteMaster(id);
        else await removeMyFavoriteMaster(id);
        setFavoriteMasterId(id, next);
        notifyFavoritesChanged();
      } catch (e) {
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
    !persistable || (favoritesRequireTelegramAuth() && (authLoading || !isAuthenticated));

  return {
    isFavorite: fav,
    toggleFavorite,
    toggleFavoriteFromEvent,
    favoriteDisabled,
    favoritesRequireAuth: favoritesRequireTelegramAuth() && !isAuthenticated,
  };
}
