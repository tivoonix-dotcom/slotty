import { useCallback, useEffect, useRef, useState } from 'react';
import {
  hasYandexGeocoderKey,
  yandexGeocodeMinsk,
  yandexReverseMinsk,
  type YandexGeocodeHit,
} from '../../shared/lib/yandexGeocodeMinsk';

const MINSK_CENTER: [number, number] = [53.9025, 27.5615];
const DEFAULT_ZOOM = 12;

export type MapPickResult = {
  addressLine: string;
  lat: number;
  lng: number;
};

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

type YMapsGlobal = {
  ready: (cb: () => void) => void;
  Map: new (
    el: HTMLElement,
    state: { center: number[]; zoom: number; controls?: string[] },
    options?: { searchControlProvider?: string },
  ) => YMap;
  Placemark: new (
    geometry: number[],
    properties?: Record<string, unknown>,
    options?: { draggable?: boolean; preset?: string },
  ) => YPlacemark;
};

type YMap = {
  destroy: () => void;
  setCenter: (c: number[], z?: number, opts?: { duration?: number }) => void;
  getZoom: () => number;
  geoObjects: {
    add: (o: YPlacemark) => void;
    remove: (o: YPlacemark) => void;
  };
  events: { add: (ev: string, fn: (e: { get: (k: string) => number[] }) => void) => void };
  container?: { fitToViewport?: () => void };
};

type YPlacemark = {
  geometry: { setCoordinates: (c: number[]) => void; getCoordinates: () => number[] };
  events: { add: (ev: string, fn: () => void) => void };
};

function getYmaps(): YMapsGlobal | undefined {
  return (window as unknown as { ymaps?: YMapsGlobal }).ymaps;
}

function loadYandexScript(apiKey: string): Promise<void> {
  const id = 'slotty-yandex-maps-2.1';
  if (document.getElementById(id)) {
    return new Promise((resolve, reject) => {
      const y = getYmaps();
      if (y) {
        y.ready(() => resolve());
        return;
      }
      const el = document.getElementById(id) as HTMLScriptElement | null;
      if (el) {
        el.addEventListener('load', () => {
          getYmaps()?.ready(() => resolve());
        });
        el.addEventListener('error', () => reject(new Error('ymaps')));
      } else reject(new Error('ymaps'));
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    s.onload = () => {
      getYmaps()?.ready(() => resolve());
    };
    s.onerror = () => reject(new Error('ymaps'));
    document.head.appendChild(s);
  });
}

type Props = {
  city: string;
  addressLine: string;
  onPick: (res: MapPickResult) => void;
  visitType?: 'studio' | 'at_home';
  coordsError?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onMapAvailabilityChange?: (available: boolean) => void;
};

export function OnboardingAddressMap({
  city,
  addressLine,
  onPick,
  visitType: _visitType = 'studio',
  coordsError,
  initialLat,
  initialLng,
  onMapAvailabilityChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMap | null>(null);
  const placemarkRef = useRef<YPlacemark | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const lineRef = useRef('');
  const addressLinePropRef = useRef(addressLine);
  addressLinePropRef.current = addressLine;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<YandexGeocodeHit[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [mapHint, setMapHint] = useState<string | null>(null);
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

  const applyPick = useCallback(
    (lat: number, lng: number, line: string) => {
      const map = mapRef.current;
      const pm = placemarkRef.current;
      if (map && pm) {
        pm.geometry.setCoordinates([lat, lng]);
        map.setCenter([lat, lng], Math.max(map.getZoom(), 15), { duration: 200 });
      }
      pushCoords(lat, lng, line);
    },
    [pushCoords],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const key =
      (import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined)?.trim() ||
      (import.meta.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY as string | undefined)?.trim();

    if (!key) {
      setMapHint('Карта недоступна: задайте VITE_YANDEX_MAPS_API_KEY. Адрес можно указать текстом.');
      onMapAvailabilityChange?.(false);
      return () => {};
    }

    let cancelled = false;

    void (async () => {
      try {
        await loadYandexScript(key);
        if (cancelled) return;
        const ymaps = getYmaps();
        if (!ymaps || !containerRef.current) return;

        const map = new ymaps.Map(containerRef.current, {
          center: MINSK_CENTER,
          zoom: DEFAULT_ZOOM,
          controls: ['zoomControl', 'geolocationControl'],
        });

        const startLat =
          initialLat != null && Number.isFinite(initialLat) ? initialLat : MINSK_CENTER[0];
        const startLng =
          initialLng != null && Number.isFinite(initialLng) ? initialLng : MINSK_CENTER[1];

        const placemark = new ymaps.Placemark(
          [startLat, startLng],
          {},
          { draggable: true, preset: 'islands#pinkCircleDotIcon' },
        );
        map.geoObjects.add(placemark);
        mapRef.current = map;
        placemarkRef.current = placemark;

        if (initialLat != null && initialLng != null && Number.isFinite(initialLat) && Number.isFinite(initialLng)) {
          map.setCenter([initialLat, initialLng], 15);
          setHasPoint(true);
          setPoint({ lat: initialLat, lng: initialLng });
        }

        placemark.events.add('dragend', () => {
          const c = placemark.geometry.getCoordinates();
          const la = c[0];
          const ln = c[1];
          if (abortReverseRef.current) abortReverseRef.current.abort();
          const ac = new AbortController();
          abortReverseRef.current = ac;
          void yandexReverseMinsk(la, ln, ac.signal)
            .then((txt) => {
              const line = txt?.trim() || lineRef.current || addressLinePropRef.current || 'Минск';
              pushCoords(la, ln, line);
              setHint(null);
            })
            .catch(() => {
              pushCoords(la, ln, lineRef.current || addressLinePropRef.current || 'Минск');
            });
        });

        map.events.add('click', (e) => {
          const coords = e.get('coords') as number[];
          const la = coords[0];
          const ln = coords[1];
          placemark.geometry.setCoordinates([la, ln]);
          if (abortReverseRef.current) abortReverseRef.current.abort();
          const ac = new AbortController();
          abortReverseRef.current = ac;
          void yandexReverseMinsk(la, ln, ac.signal)
            .then((txt) => {
              const line = txt?.trim() || lineRef.current || addressLinePropRef.current || 'Минск';
              applyPick(la, ln, line);
              setHint(null);
            })
            .catch(() => {
              applyPick(la, ln, lineRef.current || addressLinePropRef.current || 'Минск');
            });
        });

        requestAnimationFrame(() => {
          try {
            map.container?.fitToViewport?.();
          } catch {
            /* ignore */
          }
        });
        setMapReady(true);
        setMapHint(null);
        onMapAvailabilityChange?.(true);
      } catch {
        if (!cancelled) {
          setMapHint('Не удалось загрузить карту. Укажите адрес текстом.');
          onMapAvailabilityChange?.(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (abortSearchRef.current) abortSearchRef.current.abort();
      if (abortReverseRef.current) abortReverseRef.current.abort();
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      placemarkRef.current = null;
      setMapReady(false);
    };
  }, [applyPick, initialLat, initialLng, onMapAvailabilityChange, pushCoords]);

  const runSearch = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (q.length < 1) {
        setItems([]);
        setHint(null);
        return;
      }
      if (!hasYandexGeocoderKey()) {
        setItems([]);
        setHint('Нет ключа API для поиска.');
        return;
      }
      if (abortSearchRef.current) abortSearchRef.current.abort();
      const ac = new AbortController();
      abortSearchRef.current = ac;

      setLoading(true);
      setHint(null);
      try {
        const list = await yandexGeocodeMinsk(`${city}, ${q}`, ac.signal);
        setItems(list);
        setOpen(list.length > 0);
        if (list.length === 0) {
          setHint('Адрес не найден');
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setItems([]);
        setHint('Адрес не найден');
      } finally {
        setLoading(false);
      }
    },
    [city],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) {
      setItems([]);
      setOpen(false);
      setHint(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 280);
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

  const onSelectHit = (hit: YandexGeocodeHit) => {
    const lat = hit.lat;
    const lng = hit.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const line = hit.displayLine;
    setQuery(line.replace(/^Минск,\s*/i, '').trim() || line);
    setOpen(false);
    applyPick(lat, lng, line);
    setHint(null);
  };

  return (
    <div className="space-y-2">
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
            placeholder="Улица, дом, ТЦ или метро"
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
            {items.map((hit, idx) => (
              <li key={`${hit.lon}-${hit.lat}-${idx}`}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full px-3 py-2.5 text-left text-[13px] leading-snug text-neutral-900 transition hover:bg-white/80 active:bg-[#EAE8E8]"
                  onClick={() => onSelectHit(hit)}
                >
                  <span className="line-clamp-2">{hit.displayLine}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {hint ? <p className="text-[12px] leading-snug text-[#B66A24]">{hint}</p> : null}
      {coordsError ? <p className="text-[12px] leading-snug text-[#B66A24]">{coordsError}</p> : null}
      {mapHint ? <p className="text-[12px] leading-snug text-neutral-500">{mapHint}</p> : null}

      <div className="overflow-hidden rounded-[22px] bg-neutral-200 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.04)]">
        <div className="px-2 pb-2 pt-2">
          <div
            ref={containerRef}
            className={`relative z-0 h-[min(220px,42dvh)] w-full min-h-[200px] overflow-hidden rounded-[18px] bg-[#E4E2E2] sm:h-[min(240px,36dvh)] ${
              mapReady ? '' : 'animate-pulse'
            }`}
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
