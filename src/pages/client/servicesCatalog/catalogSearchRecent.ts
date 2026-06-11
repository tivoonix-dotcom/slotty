const STORAGE_KEY = 'slotty:catalog-search-recent';
const MAX_RECENT = 5;

function writeCatalogSearchRecent(items: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
  } catch {
    /* ignore quota */
  }
}

export function clearCatalogSearchRecent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function removeCatalogSearchRecent(query: string): string[] {
  const q = query.trim();
  const next = readCatalogSearchRecent().filter((item) => item.toLowerCase() !== q.toLowerCase());
  writeCatalogSearchRecent(next);
  return next;
}

export function readCatalogSearchRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim())
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushCatalogSearchRecent(query: string): string[] {
  const q = query.trim();
  if (!q) return readCatalogSearchRecent();
  const prev = readCatalogSearchRecent().filter((item) => item.toLowerCase() !== q.toLowerCase());
  const next = [q, ...prev].slice(0, MAX_RECENT);
  writeCatalogSearchRecent(next);
  return next;
}
