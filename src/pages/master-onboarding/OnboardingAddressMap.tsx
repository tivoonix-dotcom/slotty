import { useCallback, useEffect, useRef, useState } from 'react';

/** Центр Минска, порядок координат по умолчанию API: [широта, долгота] (latlong). */
const DEFAULT_CENTER: [number, number] = [53.9025, 27.5615];

type YmapsEvent = { get: (name: string) => unknown };

type GeoObjectLike = {
  geometry: { getCoordinates: () => number[] };
  getAddressLine?: () => string;
  properties?: { get: (key: string) => unknown };
};

type GeocodeResult = {
  geoObjects: {
    get: (index: number) => GeoObjectLike | undefined;
  };
};

type YmapsMap = {
  events: { add: (type: string, handler: (e: YmapsEvent) => void) => void };
  geoObjects: { add: (o: unknown) => void; remove: (o: unknown) => void };
  setCenter: (coords: number[], zoom?: number, opts?: Record<string, unknown>) => void;
  destroy: () => void;
};

type SuggestViewInstance = {
  destroy: () => void;
  events: { add: (type: string, handler: (e: YmapsEvent) => void) => void };
};

type YmapsGlobal = {
  ready: (cb: () => void) => void;
  Map: new (el: HTMLElement, state: Record<string, unknown>, options?: Record<string, unknown>) => YmapsMap;
  geocode: (request: unknown, options?: Record<string, unknown>) => Promise<GeocodeResult>;
  Placemark: new (geometry: number[], props?: Record<string, unknown>, options?: Record<string, unknown>) => unknown;
  SuggestView?: new (element: HTMLElement | string, options?: Record<string, unknown>) => SuggestViewInstance;
};

export type MapPickResult = {
  addressLine: string;
  lat: number;
  lng: number;
};

function buildScriptUrl(): string {
  const mapKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
  const suggestKey =
    (import.meta.env.VITE_YANDEX_SUGGEST_API_KEY as string | undefined) || mapKey;
  const keyQs = mapKey ? `&apikey=${encodeURIComponent(mapKey)}` : '';
  const suggestQs = suggestKey ? `&suggest_apikey=${encodeURIComponent(suggestKey)}` : '';
  return `https://api-maps.yandex.ru/2.1/?lang=ru_RU${keyQs}${suggestQs}`;
}

function loadYandexMapsScript(): Promise<void> {
  const w = window as Window & { ymaps?: YmapsGlobal };
  if (w.ymaps) {
    return new Promise((resolve) => {
      w.ymaps!.ready(() => resolve());
    });
  }

  const existing = document.querySelector<HTMLScriptElement>('script[data-slotty-ymaps="1"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      const done = () => {
        const y = (window as Window & { ymaps?: YmapsGlobal }).ymaps;
        if (y) y.ready(() => resolve());
        else reject(new Error('ymaps missing'));
      };
      if (existing.dataset.loaded === '1') {
        done();
        return;
      }
      existing.addEventListener('load', done);
      existing.addEventListener('error', () => reject(new Error('ymaps script')));
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = buildScriptUrl();
    s.async = true;
    s.dataset.slottyYmaps = '1';
    s.onload = () => {
      s.dataset.loaded = '1';
      const y = (window as Window & { ymaps?: YmapsGlobal }).ymaps;
      if (y) y.ready(() => resolve());
      else reject(new Error('ymaps missing'));
    };
    s.onerror = () => reject(new Error('ymaps script'));
    document.head.appendChild(s);
  });
}

/** Адрес из результата геокодера (getAddressLine не всегда есть на обёртках). */
function addressFromGeoObject(obj: GeoObjectLike): string {
  try {
    const line = obj.getAddressLine?.();
    if (typeof line === 'string' && line.trim()) return line.trim();
  } catch {
    /* ignore */
  }
  try {
    const props = obj.properties;
    if (props && typeof props.get === 'function') {
      const meta = props.get('metaDataProperty') as { GeocoderMetaData?: { text?: string } } | undefined;
      const t = meta?.GeocoderMetaData?.text;
      if (typeof t === 'string' && t.trim()) return t.trim();
      const text = props.get('text');
      if (typeof text === 'string' && text.trim()) return text.trim();
      const name = props.get('name');
      if (typeof name === 'string' && name.trim()) return name.trim();
    }
  } catch {
    /* ignore */
  }
  return '';
}

type Props = {
  /** Текущая строка адреса с карты */
  addressLine: string;
  onPick: (res: MapPickResult) => void;
};

export function OnboardingAddressMap({ addressLine, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<YmapsMap | null>(null);
  const placemarkRef = useRef<unknown>(null);
  const suggestRef = useRef<SuggestViewInstance | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const setQueryRef = useRef<(q: string) => void>(() => {});
  const [query, setQuery] = useState('');
  setQueryRef.current = setQuery;

  const [mapError, setMapError] = useState<string | null>(null);
  const [suggestHint, setSuggestHint] = useState<string | null>(null);

  const applyGeocodeObject = useCallback((ymaps: YmapsGlobal, map: YmapsMap, obj: GeoObjectLike) => {
    let coords: number[];
    try {
      coords = obj.geometry.getCoordinates();
    } catch {
      return;
    }
    if (!Array.isArray(coords) || coords.length < 2) return;

    const lat = coords[0];
    const lng = coords[1];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const line = addressFromGeoObject(obj);
    const addressLineOut = line || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    map.setCenter([lat, lng], 17, { duration: 200 } as Record<string, unknown>);
    if (placemarkRef.current) {
      try {
        map.geoObjects.remove(placemarkRef.current);
      } catch {
        /* ignore */
      }
    }
    /** iconColor совместим только с частью preset; redDotIcon + iconColor может не рисоваться. */
    const pm = new ymaps.Placemark(
      [lat, lng],
      {},
      { preset: 'islands#dotIcon', iconColor: '#E29595' },
    );
    placemarkRef.current = pm;
    map.geoObjects.add(pm);
    onPickRef.current({ addressLine: addressLineOut, lat, lng });
  }, []);

  const geocodeRequest = useCallback(
    (ymaps: YmapsGlobal, map: YmapsMap, request: string) => {
      const q = request.trim();
      if (!q) return;
      void ymaps
        .geocode(q, { results: 1 })
        .then((res: GeocodeResult) => {
          const obj = res.geoObjects.get(0);
          if (obj) applyGeocodeObject(ymaps, map, obj);
        })
        .catch((err: unknown) => {
          console.warn('[SLOTTY] geocode failed', err);
        });
    },
    [applyGeocodeObject],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await loadYandexMapsScript();
        if (cancelled) return;
        const ymaps = (window as Window & { ymaps?: YmapsGlobal }).ymaps;
        const mapEl = containerRef.current;
        const inputEl = inputRef.current;
        if (!ymaps || !mapEl) return;

        const map = new ymaps.Map(mapEl, {
          center: DEFAULT_CENTER,
          zoom: 11,
          controls: ['zoomControl'],
        });
        mapRef.current = map;

        map.events.add('click', (e: YmapsEvent) => {
          const coords = e.get('coords') as number[] | undefined;
          if (!coords || coords.length < 2) return;
          void ymaps
            .geocode(coords, { results: 1 })
            .then((res: GeocodeResult) => {
              const obj = res.geoObjects.get(0);
              if (obj) applyGeocodeObject(ymaps, map, obj);
            })
            .catch((err: unknown) => {
              console.warn('[SLOTTY] reverse geocode failed', err);
            });
        });

        if (inputEl && ymaps.SuggestView) {
          try {
            const suggestView = new ymaps.SuggestView(inputEl, {
              results: 7,
              zIndex: 65000,
            });
            suggestRef.current = suggestView;
            suggestView.events.add('select', (e: YmapsEvent) => {
              const item = e.get('item') as { value?: string; displayName?: string } | undefined;
              const value = typeof item?.value === 'string' ? item.value : '';
              const display = typeof item?.displayName === 'string' ? item.displayName : value;
              if (display) setQueryRef.current(display);
              if (value) geocodeRequest(ymaps, map, value);
            });
            setSuggestHint(null);
          } catch (err) {
            console.warn('[SLOTTY] SuggestView init failed', err);
            setSuggestHint('Подсказки адреса недоступны — укажите ключ Geosuggest (suggest_apikey) в .env.');
          }
        } else if (inputEl) {
          setSuggestHint('Подсказки недоступны в этой сборке API (нет SuggestView).');
        }

        if (!import.meta.env.VITE_YANDEX_MAPS_API_KEY && !import.meta.env.VITE_YANDEX_SUGGEST_API_KEY) {
          setSuggestHint((h) => h ?? 'Добавьте VITE_YANDEX_MAPS_API_KEY и при необходимости VITE_YANDEX_SUGGEST_API_KEY в .env.');
        }

        setMapError(null);
      } catch (err) {
        console.warn('[SLOTTY] Карта не загрузилась', err);
        setMapError('Карта недоступна — введите адрес вручную в поле ниже.');
      }
    })();

    return () => {
      cancelled = true;
      if (suggestRef.current) {
        try {
          suggestRef.current.destroy();
        } catch {
          /* ignore */
        }
        suggestRef.current = null;
      }
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch {
          /* ignore */
        }
        mapRef.current = null;
      }
      placemarkRef.current = null;
    };
  }, [applyGeocodeObject, geocodeRequest]);

  const onSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    const ymaps = (window as Window & { ymaps?: YmapsGlobal }).ymaps;
    const map = mapRef.current;
    if (!ymaps || !map) return;
    geocodeRequest(ymaps, map, q);
  }, [geocodeRequest, query]);

  return (
    <div className="space-y-2">
      <p className="text-[12px] leading-snug text-neutral-500">
        Начните вводить адрес — появятся подсказки Яндекса. Можно нажать «Найти» или кликнуть по зданию на карте:
        подставится адрес и метка.
      </p>
      <div className="relative z-[120] flex gap-2">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearch();
            }
          }}
          placeholder="Например: Немига 5 Минск"
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 rounded-full bg-[#F1EFEF] px-4 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          type="button"
          onClick={onSearch}
          className="shrink-0 rounded-full bg-[#E29595] px-4 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(226,149,149,0.25)] transition active:scale-[0.97]"
        >
          Найти
        </button>
      </div>
      {suggestHint ? <p className="text-[12px] leading-snug text-[#B66A24]">{suggestHint}</p> : null}
      {addressLine ? (
        <p className="text-[13px] font-medium text-neutral-700">
          Выбрано: <span className="text-neutral-900">{addressLine}</span>
        </p>
      ) : null}
      {mapError ? <p className="text-[13px] text-[#B66A24]">{mapError}</p> : null}
      <div
        ref={containerRef}
        className="relative z-0 h-[min(240px,42dvh)] w-full min-h-[180px] overflow-hidden rounded-[22px] bg-[#F1EFEF]"
      />
    </div>
  );
}
