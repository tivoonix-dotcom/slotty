/**
 * Геокодер Яндекса, ограниченный Минском (bbox).
 * Ключ в URL: VITE_YANDEX_MAPS_API_KEY / NEXT_PUBLIC_YANDEX_MAPS_API_KEY (без ключа HTTP-геокодинг недоступен; карта JS может работать без него).
 */

export type YandexGeocodeHit = {
  /** Текст для формы / подсказки */
  displayLine: string;
  lat: number;
  lon: number;
};

const MINSK_BBOX = '27.35,53.75~27.72,54.05';

function apiKey(): string | undefined {
  const vite = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
  if (vite && vite.trim()) return vite.trim();
  const next = import.meta.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY as string | undefined;
  if (next && next.trim()) return next.trim();
  return undefined;
}

function parseGeoObject(raw: unknown): YandexGeocodeHit | null {
  if (!raw || typeof raw !== 'object') return null;
  const go = raw as {
    metaDataProperty?: { GeocoderMetaData?: { text?: string } };
    Point?: { pos?: string };
  };
  const text = go.metaDataProperty?.GeocoderMetaData?.text?.trim();
  const pos = go.Point?.pos?.trim();
  if (!text || !pos) return null;
  const [lonS, latS] = pos.split(/\s+/);
  const latRaw = Number.parseFloat(latS ?? '');
  const lonRaw = Number.parseFloat(lonS ?? '');
  if (!Number.isFinite(latRaw) || !Number.isFinite(lonRaw)) return null;
  const { lat, lon } = normalizeGeocodeHitLatLon(latRaw, lonRaw);
  return { displayLine: text, lat, lon };
}

function collectMembers(node: unknown, out: unknown[]): void {
  if (!node || typeof node !== 'object') return;
  const o = node as Record<string, unknown>;
  if (Array.isArray(o.featureMember)) {
    for (const m of o.featureMember) {
      const g = (m as { GeoObject?: unknown })?.GeoObject;
      if (g) out.push(g);
    }
  }
  if (Array.isArray(o.member)) {
    for (const m of o.member) collectMembers(m, out);
  }
  if (o.GeoObjectCollection && typeof o.GeoObjectCollection === 'object') {
    collectMembers(o.GeoObjectCollection, out);
  }
}

export function hasYandexGeocoderKey(): boolean {
  return Boolean(apiKey());
}

/** Bias / limit area: south-west lat,lon — north-east lat,lon (Минск и окрестности). */
const MINSK_BOUNDED_BY: [[number, number], [number, number]] = [
  [53.75, 27.35],
  [54.05, 27.72],
];

export type YmapsGeocodeApi = {
  geocode: (
    request: string,
    options?: { results?: number; boundedBy?: [[number, number], [number, number]]; strictBounds?: boolean },
  ) => Promise<unknown>;
};

/** Минск и окрестности: lat ~53–56, lon ~23–34 (если перепутаны оси — поправляем). */
function belarusLikely(lat: number, lon: number): boolean {
  return lat >= 51 && lat <= 56.5 && lon >= 22 && lon <= 35;
}

function normalizeGeocodeHitLatLon(lat: number, lon: number): { lat: number; lon: number } {
  if (belarusLikely(lat, lon)) return { lat, lon };
  if (belarusLikely(lon, lat)) return { lat: lon, lon: lat };
  return { lat, lon };
}

function geocodeAddressLineFromGeoObject(o: {
  getAddressLine?: () => string;
  properties?: { get?: (k: string) => unknown };
}): string {
  const fromMethod = typeof o.getAddressLine === 'function' ? o.getAddressLine()?.trim() : '';
  if (fromMethod) return fromMethod;
  const props = o.properties;
  if (!props?.get) return '';
  const text = String(props.get('text') ?? '').trim();
  if (text) return text;
  const name = String(props.get('name') ?? '').trim();
  if (name) return name;
  const meta = props.get('metaDataProperty') as { GeocoderMetaData?: { text?: string } } | undefined;
  const metaText = meta?.GeocoderMetaData?.text?.trim();
  return metaText ?? '';
}

function hitsFromGeocodeResult(res: unknown): YandexGeocodeHit[] {
  if (!res || typeof res !== 'object') return [];
  const geoObjects = (res as { geoObjects?: { each?: (fn: (obj: unknown) => void) => void } }).geoObjects;
  if (!geoObjects) return [];

  const hits: YandexGeocodeHit[] = [];

  const pushFromObj = (obj: unknown) => {
    if (!obj || typeof obj !== 'object') return;
    const o = obj as {
      geometry?: { getCoordinates?: () => number[] };
      getAddressLine?: () => string;
      properties?: { get?: (k: string) => unknown };
    };
    const coords = o.geometry?.getCoordinates?.();
    if (!Array.isArray(coords) || coords.length < 2) return;
    let lat = coords[0];
    let lon = coords[1];
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    ({ lat, lon } = normalizeGeocodeHitLatLon(lat, lon));
    const line = geocodeAddressLineFromGeoObject(o);
    if (!line) return;
    hits.push({ displayLine: line, lat, lon });
  };

  if (typeof (geoObjects as { each?: (fn: (obj: unknown) => void) => void }).each === 'function') {
    (geoObjects as { each: (fn: (obj: unknown) => void) => void }).each(pushFromObj);
  } else if (typeof (geoObjects as { getLength?: () => number; get?: (i: number) => unknown }).getLength === 'function') {
    const col = geoObjects as { getLength: () => number; get: (i: number) => unknown };
    const n = col.getLength();
    for (let i = 0; i < n; i += 1) pushFromObj(col.get(i));
  }

  return hits;
}

/**
 * Геокодинг через уже загруженный JS API Яндекс.Карт (тот же сценарий, что и карта).
 * Полезно, когда HTTP-геокодер без ключа недоступен, а скрипт карты с `apikey` уже подключён.
 */
export async function yandexGeocodeMinskViaYmaps(ymaps: YmapsGeocodeApi, city: string, localQuery: string): Promise<YandexGeocodeHit[]> {
  const q = localQuery.trim();
  if (q.length < 1) return [];
  if (typeof ymaps.geocode !== 'function') return [];

  const request = `${city}, ${q}`;
  const opts = { results: 6, boundedBy: MINSK_BOUNDED_BY, strictBounds: true as const };

  let res = await ymaps.geocode(request, opts);
  let hits = hitsFromGeocodeResult(res);
  if (hits.length === 0) {
    res = await ymaps.geocode(request, { ...opts, strictBounds: false });
    hits = hitsFromGeocodeResult(res);
  }
  if (hits.length === 0) {
    res = await ymaps.geocode(request, { results: 10 });
    hits = hitsFromGeocodeResult(res);
  }
  return hits;
}

async function yandexGeocodeMinskHttp(
  geocode: string,
  signal: AbortSignal,
  opts: { bbox?: string; rspn?: '0' | '1' },
): Promise<YandexGeocodeHit[]> {
  const key = apiKey();
  if (!key) return [];
  const url = new URL('https://geocode-maps.yandex.ru/1.x/');
  url.searchParams.set('apikey', key);
  url.searchParams.set('geocode', geocode);
  url.searchParams.set('format', 'json');
  url.searchParams.set('results', '10');
  if (opts.bbox) {
    url.searchParams.set('bbox', opts.bbox);
    if (opts.rspn) url.searchParams.set('rspn', opts.rspn);
  }

  const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`geocoder ${res.status}`);
  const data = (await res.json()) as unknown;
  const root = (data as { response?: { GeoObjectCollection?: unknown } })?.response?.GeoObjectCollection;
  const members: unknown[] = [];
  collectMembers(root, members);

  const hits: YandexGeocodeHit[] = [];
  for (const m of members) {
    const h = parseGeoObject(m);
    if (h) hits.push(h);
  }
  return hits;
}

/** Прямой геокодинг (подсказки), с debounce вызывать снаружи. */
export async function yandexGeocodeMinsk(query: string, signal: AbortSignal): Promise<YandexGeocodeHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  let hits = await yandexGeocodeMinskHttp(q, signal, { bbox: MINSK_BBOX, rspn: '1' });
  if (hits.length === 0) {
    hits = await yandexGeocodeMinskHttp(q, signal, { bbox: MINSK_BBOX, rspn: '0' });
  }
  if (hits.length === 0) {
    hits = await yandexGeocodeMinskHttp(q, signal, {});
  }
  return hits;
}

/** Обратное геокодирование по координатам. */
export async function yandexReverseMinsk(lat: number, lon: number, signal: AbortSignal): Promise<string | null> {
  const key = apiKey();
  if (!key) return null;
  const url = new URL('https://geocode-maps.yandex.ru/1.x/');
  url.searchParams.set('apikey', key);
  url.searchParams.set('geocode', `${lon},${lat}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('results', '1');
  url.searchParams.set('bbox', MINSK_BBOX);
  url.searchParams.set('rspn', '1');

  const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = (await res.json()) as unknown;
  const root = (data as { response?: { GeoObjectCollection?: unknown } })?.response?.GeoObjectCollection;
  const members: unknown[] = [];
  collectMembers(root, members);
  const h = members[0] ? parseGeoObject(members[0]) : null;
  return h?.displayLine ?? null;
}
