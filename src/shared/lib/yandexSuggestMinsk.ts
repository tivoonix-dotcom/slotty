/**
 * Подсказки адреса без ключей Яндекса.
 *
 * Яндекс.Карта используется только для отображения карты.
 * Поиск адресов идет через OpenStreetMap / Nominatim.
 *
 * Логика:
 * ввод -> Nominatim search -> список подсказок -> выбор -> координаты уже есть
 */

import { isMinskAreaCoords, type GeocodeSuggestHit } from './minskAddressSuggest';

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * viewbox для Минска:
 * left, top, right, bottom
 */
const MINSK_VIEWBOX = '27.35,54.05,27.72,53.75';

export type YandexSuggestItem = GeocodeSuggestHit & {
  /**
   * Строка, которую показываем пользователю.
   */
  displayLine: string;

  /**
   * Оставлено для совместимости со старым кодом.
   * Тут будет та же строка, что и displayLine.
   */
  geocodeQuery: string;

  /**
   * Первая строка в красивом списке.
   * Например: "улица Рафиева, 55"
   */
  title?: string;

  /**
   * Вторая строка в красивом списке.
   * Например: "Минск"
   */
  subtitle?: string;
};

export type YmapsSuggestApi = {
  suggest?: (
    request: string,
    options?: { boundedBy?: [[number, number], [number, number]]; results?: number },
  ) => Promise<Array<{ displayName?: string; value?: string }>>;
};

type NominatimRawHit = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  importance?: number;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    footway?: string;
    path?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ');
}

function cleanDisplayName(value: string): string {
  return value
    .replace(/, Беларусь$/i, '')
    .replace(/, Белоруссия$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStreetName(address?: NominatimRawHit['address']): string {
  if (!address) return '';

  return (
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.path ||
    ''
  ).trim();
}

function getDistrictName(address?: NominatimRawHit['address']): string {
  if (!address) return '';

  return (
    address.city_district ||
    address.suburb ||
    address.quarter ||
    address.neighbourhood ||
    ''
  ).trim();
}

function getCityName(address?: NominatimRawHit['address'], fallback = 'Минск'): string {
  if (!address) return fallback;

  return (
    address.city ||
    address.town ||
    address.village ||
    fallback
  ).trim();
}

function buildPrettyItem(hit: NominatimRawHit, fallbackCity: string): YandexSuggestItem | null {
  const lat = Number.parseFloat(hit.lat || '');
  const lon = Number.parseFloat(hit.lon || '');

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (!isMinskAreaCoords(lat, lon)) return null;

  const address = hit.address;
  const city = getCityName(address, fallbackCity);
  const street = getStreetName(address);
  const house = address?.house_number?.trim() || '';
  const district = getDistrictName(address);

  let title = '';
  let subtitle = '';
  let displayLine = '';

  if (street && house) {
    title = `${street}, ${house}`;
    subtitle = district ? `${city}, ${district}` : city;
    displayLine = `${city}, ${title}`;
  } else if (street) {
    title = street;
    subtitle = district ? `${city}, ${district}` : city;
    displayLine = `${city}, ${street}`;
  } else {
    const fallback = cleanDisplayName(hit.display_name || city);

    const parts = fallback
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    title = parts[0] || fallback;
    subtitle = parts.slice(1, 3).join(', ') || city;
    displayLine = fallback;
  }

  return {
    displayLine,
    geocodeQuery: displayLine,
    title,
    subtitle,
    lat,
    lon,
  };
}

function scoreItem(item: YandexSuggestItem, query: string): number {
  const q = normalizeKey(query);
  const title = normalizeKey(item.title || '');
  const subtitle = normalizeKey(item.subtitle || '');
  const displayLine = normalizeKey(item.displayLine);
  const full = `${title} ${subtitle} ${displayLine}`;

  let score = 0;

  if (title === q) score += 300;
  if (displayLine === q) score += 250;

  if (title.startsWith(q)) score += 180;
  if (displayLine.startsWith(q)) score += 140;

  if (title.includes(q)) score += 120;
  if (displayLine.includes(q)) score += 90;

  const queryParts = q.split(' ').filter(Boolean);

  for (const part of queryParts) {
    if (title.includes(part)) score += 35;
    else if (full.includes(part)) score += 20;
  }

  // Дом с номером выше в списке.
  if ((item.title || '').includes(',')) score += 25;

  // Минск выше.
  if (normalizeKey(item.subtitle || '').includes('минск')) score += 20;
  if (normalizeKey(item.displayLine).includes('минск')) score += 20;

  return score;
}

function dedupeItems(items: YandexSuggestItem[]): YandexSuggestItem[] {
  const seen = new Set<string>();
  const out: YandexSuggestItem[] = [];

  for (const item of items) {
    const key = normalizeKey(
      `${item.displayLine}|${item.lat.toFixed(5)}|${item.lon.toFixed(5)}`,
    );

    if (seen.has(key)) continue;

    seen.add(key);
    out.push(item);
  }

  return out;
}

async function fetchNominatim(
  city: string,
  query: string,
  signal: AbortSignal,
): Promise<NominatimRawHit[]> {
  const q = query.trim();

  if (q.length < 2) return [];

  const url = new URL(NOMINATIM_SEARCH_URL);

  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '12');
  url.searchParams.set('countrycodes', 'by');
  url.searchParams.set('accept-language', 'ru');

  /**
   * Ограничиваем Минском.
   */
  url.searchParams.set('bounded', '1');
  url.searchParams.set('viewbox', MINSK_VIEWBOX);

  /**
   * Так лучше ищет именно адреса Минска.
   */
  url.searchParams.set('q', `${city}, ${q}`);

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as unknown;

  if (!Array.isArray(data)) return [];

  return data as NominatimRawHit[];
}

function rawHitsToSuggestItems(
  rawHits: NominatimRawHit[],
  query: string,
  city: string,
): YandexSuggestItem[] {
  const items: YandexSuggestItem[] = [];

  for (const hit of rawHits) {
    const item = buildPrettyItem(hit, city);
    if (!item) continue;

    items.push(item);
  }

  return dedupeItems(items)
    .map((item) => ({
      item,
      score: scoreItem(item, query),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((row) => row.item);
}

/**
 * Оставлено для совместимости.
 * Теперь ключ Яндекса не нужен.
 */
export function hasYandexSuggestKey(): boolean {
  return false;
}

/**
 * Главная функция поиска подсказок.
 * Название оставлено старое, чтобы не ломать импорты.
 *
 * На самом деле использует не Yandex Suggest, а OpenStreetMap / Nominatim.
 */
export async function yandexSuggestMinskHttp(
  city: string,
  localQuery: string,
  signal: AbortSignal,
): Promise<YandexSuggestItem[]> {
  const q = localQuery.trim();

  if (q.length < 2) return [];

  try {
    const rawHits = await fetchNominatim(city, q, signal);

    if (signal.aborted) return [];

    return rawHitsToSuggestItems(rawHits, q, city);
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'AbortError') return [];
    return [];
  }
}

/**
 * Оставлено для совместимости со старым кодом.
 * ymaps тут не используется, потому что Яндекс только для отображения карты.
 */
export async function yandexSuggestMinskViaYmaps(
  _ymaps: YmapsSuggestApi,
  city: string,
  localQuery: string,
): Promise<YandexSuggestItem[]> {
  const ac = new AbortController();
  return yandexSuggestMinskHttp(city, localQuery, ac.signal);
}

/**
 * Удобный общий экспорт.
 * Лучше использовать именно его в компоненте.
 */
export async function searchMinskAddressSuggestions(
  city: string,
  localQuery: string,
  signal: AbortSignal,
): Promise<YandexSuggestItem[]> {
  return yandexSuggestMinskHttp(city, localQuery, signal);
}