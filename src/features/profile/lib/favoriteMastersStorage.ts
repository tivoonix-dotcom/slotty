const STORAGE_KEY = 'slotty_favorite_master_ids_v1';

export const FAVORITE_MASTERS_CHANGED = 'slotty:favorite-masters-changed';

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(FAVORITE_MASTERS_CHANGED));
}

export function getFavoriteMasterIds(): string[] {
  return readIds();
}

export function isFavoriteMasterId(masterId: string): boolean {
  return readIds().includes(masterId);
}

/** Возвращает новое состояние: мастер в избранном после переключения. */
export function toggleFavoriteMasterId(masterId: string): boolean {
  const ids = readIds();
  const i = ids.indexOf(masterId);
  if (i >= 0) {
    writeIds(ids.filter((_, idx) => idx !== i));
    return false;
  }
  writeIds([...ids, masterId]);
  return true;
}

export function removeFavoriteMasterId(masterId: string): void {
  writeIds(readIds().filter((id) => id !== masterId));
}

export function setFavoriteMasterId(masterId: string, favored: boolean): void {
  const ids = readIds();
  if (favored) {
    if (!ids.includes(masterId)) writeIds([...ids, masterId]);
    return;
  }
  removeFavoriteMasterId(masterId);
}

export function subscribeFavoriteMasterIds(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  const onCustom = () => listener();
  window.addEventListener('storage', onStorage);
  window.addEventListener(FAVORITE_MASTERS_CHANGED, onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(FAVORITE_MASTERS_CHANGED, onCustom);
  };
}
