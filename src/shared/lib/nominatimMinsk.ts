/**
 * Поиск адресов через Nominatim (OSM), смещение к Беларуси / Минску — как в анкете мастера.
 */

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

const NOMINATIM_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Accept-Language': 'ru',
};

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  house_number?: string;
};

export type NominatimMinskHit = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

/** Короткая строка для поля из ответа Nominatim (как при вводе адреса мастером). */
export function nominatimLineForForm(hit: NominatimMinskHit): string {
  const a = hit.address;
  if (a?.road && a.house_number) return `${a.road}, ${a.house_number}`;
  if (a?.pedestrian && a.house_number) return `${a.pedestrian}, ${a.house_number}`;
  if (a?.road) return a.road;
  if (a?.pedestrian) return a.pedestrian;
  const parts = hit.display_name.split(',').map((s) => s.trim());
  return parts.slice(0, 2).join(', ') || 'Адрес в Минске';
}

/**
 * Прямой геокодинг: `streetPart` — то, что вводит пользователь; к запросу добавляется город.
 */
export async function nominatimSearchMinsk(
  city: string,
  streetPart: string,
  signal: AbortSignal,
): Promise<NominatimMinskHit[]> {
  const q = streetPart.trim();
  if (q.length < 2) return [];

  const cityPart = city.trim() || 'Минск';
  const fullQ = `${cityPart}, ${q}`;

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', fullQ);
  url.searchParams.set('limit', '10');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'by');
  url.searchParams.set('viewbox', '27.38,53.95,27.72,53.82');
  url.searchParams.set('bounded', '0');

  const res = await fetch(url.toString(), { signal, headers: NOMINATIM_HEADERS });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as NominatimMinskHit[]) : [];
}

export async function nominatimReverseMinsk(
  lat: number,
  lon: number,
  signal: AbortSignal,
): Promise<NominatimMinskHit | null> {
  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), { signal, headers: NOMINATIM_HEADERS });
  if (!res.ok) throw new Error(`nominatim reverse ${res.status}`);
  const data = (await res.json()) as NominatimMinskHit & { error?: string };
  if (data?.error) return null;
  return data;
}
