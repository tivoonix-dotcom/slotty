import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';

const MINSK_CENTER: L.LatLngExpression = [53.9025, 27.5615];
const DEFAULT_ZOOM = 12;

/** Wikimedia OSM — часто стабильнее во встроенных WebView, чем tile.openstreetmap.org. */
const TILE_URL = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · Wikimedia';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

const NOMINATIM_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Accept-Language': 'ru',
};

export type MapPickResult = {
  addressLine: string;
  lat: number;
  lng: number;
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

type NominatimHit = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#E29595;border:3px solid #fff;box-shadow:0 2px 12px rgba(17,17,17,0.2);pointer-events:none"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** Короткая строка для формы из ответа Nominatim. */
export function nominatimLineForForm(hit: NominatimHit): string {
  const a = hit.address;
  if (a?.road && a.house_number) return `${a.road}, ${a.house_number}`;
  if (a?.pedestrian && a.house_number) return `${a.pedestrian}, ${a.house_number}`;
  if (a?.road) return a.road;
  if (a?.pedestrian) return a.pedestrian;
  const parts = hit.display_name.split(',').map((s) => s.trim());
  return parts.slice(0, 2).join(', ') || 'Точка на карте';
}

/** Разбор строки «улица, дом» в поля формы (fallback). */
export function splitReferenceLabelToStreetBuilding(label: string): { street: string; building: string } {
  const t = label.trim();
  const m = t.match(/^(.+?),\s*([^,]{1,40})\s*$/);
  if (m && m[1].trim() && m[2].trim()) {
    return { street: m[1].trim(), building: m[2].trim() };
  }
  return { street: t, building: 'б/н' };
}

function yandexMapsPointUrl(lat: number, lng: number): string {
  const ll = `${lng},${lat}`;
  return `https://yandex.ru/maps/?ll=${encodeURIComponent(ll)}&z=16&pt=${encodeURIComponent(ll)},pm2rdm`;
}

async function nominatimSearch(q: string, signal: AbortSignal): Promise<NominatimHit[]> {
  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '10');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'by');
  url.searchParams.set('viewbox', '27.38,53.95,27.72,53.82');
  url.searchParams.set('bounded', '0');

  const res = await fetch(url.toString(), { signal, headers: NOMINATIM_HEADERS });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as NominatimHit[]) : [];
}

async function nominatimReverse(lat: number, lon: number, signal: AbortSignal): Promise<NominatimHit | null> {
  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), { signal, headers: NOMINATIM_HEADERS });
  if (!res.ok) throw new Error(`nominatim reverse ${res.status}`);
  const data = (await res.json()) as NominatimHit & { error?: string };
  if (data?.error) return null;
  return data;
}

type Props = {
  city: string;
  addressLine: string;
  onPick: (res: MapPickResult) => void;
  visitType?: 'studio' | 'at_home';
  coordsError?: string;
};

export function OnboardingAddressMap({ city, addressLine, onPick, visitType = 'studio', coordsError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const lineRef = useRef('');
  const addressLinePropRef = useRef(addressLine);
  addressLinePropRef.current = addressLine;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NominatimHit[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [hasPoint, setHasPoint] = useState(false);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortSearchRef = useRef<AbortController | null>(null);
  const abortReverseRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (addressLine.trim()) lineRef.current = addressLine.trim();
  }, [addressLine]);

  const pushCoords = useCallback((lat: number, lng: number, line: string) => {
    lineRef.current = line;
    setPoint({ lat, lng });
    setHasPoint(true);
    onPickRef.current({ addressLine: line, lat, lng });
  }, []);

  const attachDragHandler = useCallback(
    (marker: L.Marker) => {
      marker.off('dragend');
      marker.on('dragend', () => {
        const ll = marker.getLatLng();
        const line = lineRef.current || addressLinePropRef.current || 'Минск';
        pushCoords(ll.lat, ll.lng, line);
      });
    },
    [pushCoords],
  );

  const ensureMarker = useCallback(
    (map: L.Map, lat: number, lng: number) => {
      const latlng: L.LatLngExpression = [lat, lng];
      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
        attachDragHandler(markerRef.current);
        return markerRef.current;
      }
      const m = L.marker(latlng, { draggable: true, icon: pinIcon }).addTo(map);
      attachDragHandler(m);
      markerRef.current = m;
      return m;
    },
    [attachDragHandler],
  );

  const applyPick = useCallback(
    (lat: number, lng: number, line: string) => {
      const map = mapRef.current;
      if (map) {
        map.setView([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
        ensureMarker(map, lat, lng);
      }
      pushCoords(lat, lng, line);
    },
    [ensureMarker, pushCoords],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    }).setView(MINSK_CENTER, DEFAULT_ZOOM);

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19, maxNativeZoom: 19 }).addTo(map);
    mapRef.current = map;

    const bumpSize = () => {
      map.invalidateSize({ animate: false });
    };

    map.whenReady(() => {
      bumpSize();
      requestAnimationFrame(() => {
        bumpSize();
        window.setTimeout(bumpSize, 120);
        window.setTimeout(bumpSize, 400);
      });
    });
    setMapReady(true);

    const onMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (abortReverseRef.current) abortReverseRef.current.abort();
      const ac = new AbortController();
      abortReverseRef.current = ac;
      void nominatimReverse(lat, lng, ac.signal)
        .then((hit) => {
          const line = hit ? nominatimLineForForm(hit) : lineRef.current || addressLinePropRef.current || 'Минск';
          applyPick(lat, lng, line);
          setHint(null);
        })
        .catch((err: unknown) => {
          if ((err as { name?: string }).name === 'AbortError') return;
          console.warn('[SLOTTY] reverse geocode', err);
          applyPick(lat, lng, lineRef.current || addressLinePropRef.current || 'Минск');
        });
    };
    map.on('click', onMapClick);

    const ro = new ResizeObserver(() => bumpSize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.off('click', onMapClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    };
  }, [applyPick]);

  const runSearch = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (q.length < 2) {
        setItems([]);
        setHint(null);
        return;
      }
      const cityPart = city.trim() || 'Минск';
      const fullQ = `${cityPart}, ${q}`;

      if (abortSearchRef.current) abortSearchRef.current.abort();
      const ac = new AbortController();
      abortSearchRef.current = ac;

      setLoading(true);
      setHint(null);
      try {
        const list = await nominatimSearch(fullQ, ac.signal);
        setItems(list);
        setOpen(list.length > 0);
        if (list.length === 0) {
          setHint('Ничего не нашли — уточните запрос, кликните по карте или перетащите метку.');
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name === 'AbortError') return;
        console.warn('[SLOTTY] nominatim search', err);
        setItems([]);
        setHint('Поиск временно недоступен. Укажите адрес вручную ниже или поставьте метку на карте.');
      } finally {
        setLoading(false);
      }
    },
    [city],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setItems([]);
      setOpen(false);
      setHint(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const w = wrapRef.current;
      if (!w || !(e.target instanceof Node)) return;
      if (!w.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const onSelectHit = (hit: NominatimHit) => {
    const lat = Number.parseFloat(hit.lat);
    const lng = Number.parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const line = nominatimLineForForm(hit);
    setQuery(line);
    setOpen(false);
    applyPick(lat, lng, line);
    setHint(null);
  };

  return (
    <div className="space-y-2">
      <p className="text-[12px] leading-snug text-neutral-500">
        {visitType === 'at_home'
          ? 'Подсказки, клик по карте или перетаскивание метки. Город — Минск. Клиентам точка показывается на Яндекс.Картах.'
          : 'Подсказки, клик по карте или перетаскивание метки. Точка сохранится для клиентов (Яндекс.Карты).'}
      </p>

      <div ref={wrapRef} className="relative z-[120]">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (items.length > 0) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch(query);
                setOpen(true);
              }
            }}
            placeholder="Улица, дом, ТЦ, метро…"
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={() => {
              void runSearch(query);
              setOpen(true);
            }}
            className="shrink-0 rounded-full bg-[#E29595] px-4 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(226,149,149,0.25)] transition active:scale-[0.97]"
          >
            {loading ? '…' : 'Найти'}
          </button>
        </div>

        {open && items.length > 0 ? (
          <ul
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-[130] max-h-[min(220px,38dvh)] overflow-auto rounded-[18px] bg-white py-1 shadow-[0_12px_40px_rgba(17,17,17,0.1)]"
            role="listbox"
          >
            {items.map((hit) => (
              <li key={hit.place_id}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full px-3 py-2.5 text-left text-[13px] leading-snug text-neutral-900 transition hover:bg-white/80 active:bg-[#EAE8E8]"
                  onClick={() => onSelectHit(hit)}
                >
                  <span className="line-clamp-2">{hit.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {hint ? <p className="text-[12px] leading-snug text-[#B66A24]">{hint}</p> : null}
      {coordsError ? <p className="text-[12px] leading-snug text-[#B66A24]">{coordsError}</p> : null}

      <div className="overflow-hidden rounded-[22px] bg-neutral-200 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.04)]">
        <p className="px-2 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Карта (клик — метка)
        </p>
        <div className="px-2 pb-2">
          <div
            ref={containerRef}
            className={`relative z-0 h-[min(260px,48dvh)] w-full min-h-[220px] overflow-hidden rounded-[18px] bg-[#E4E2E2] sm:h-[min(280px,42dvh)] ${
              mapReady ? '' : 'animate-pulse'
            }`}
            style={{ minHeight: 200 }}
          />
        </div>
      </div>

      {addressLine ? (
        <p className="text-[13px] font-medium text-neutral-700">
          Выбрано: <span className="text-neutral-900">{addressLine}</span>
        </p>
      ) : null}

      {hasPoint && point && Number.isFinite(point.lat) && Number.isFinite(point.lng) ? (
        <a
          href={yandexMapsPointUrl(point.lat, point.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-[13px] font-semibold text-[#E29595] underline-offset-2 hover:underline"
        >
          Открыть в Яндекс.Картах
        </a>
      ) : null}
    </div>
  );
}
