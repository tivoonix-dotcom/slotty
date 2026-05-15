import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';

import { isMinskAreaCoords } from '../../shared/lib/minskAddressSuggest';

import { subscribeTelegramViewportLayout } from '../../shared/lib/telegramWebApp';

import {
  computeViewportListPlacement,
  type ViewportListPlacement,
} from '../../shared/lib/viewportListPlacement';

import {
  searchMinskAddressSuggestions,
  type YandexSuggestItem,
} from '../../shared/lib/yandexSuggestMinsk';

const MINSK_CENTER: [number, number] = [53.9025, 27.5615];
const DEFAULT_ZOOM = 12;

const INPUT_CLASS =
  'mt-1.5 w-full rounded-[24px] bg-white px-4 py-3.5 text-[16px] font-semibold text-neutral-950 outline-none ring-0 placeholder:font-medium placeholder:text-neutral-400 transition';

export type MapPickResult = {
  addressLine: string;
  lat: number;
  lng: number;
};

/** Разбор строки «улица, дом» в поля формы fallback. */
export function splitReferenceLabelToStreetBuilding(label: string): {
  street: string;
  building: string;
} {
  const t = label.trim();
  const m = t.match(/^(.+?),\s*([^,]{1,40})\s*$/);

  if (m && m[1].trim() && m[2].trim()) {
    return {
      street: m[1].trim(),
      building: m[2].trim(),
    };
  }

  return {
    street: t,
    building: 'б/н',
  };
}

function localGeocodePart(street: string): string {
  return street.trim();
}

function yandexMapsPointUrl(lat: number, lng: number): string {
  const ll = `${lng},${lat}`;
  return `https://yandex.ru/maps/?ll=${encodeURIComponent(ll)}&z=16&pt=${encodeURIComponent(
    ll,
  )},pm2rdm`;
}

type YMapsGlobal = {
  ready: (cb: () => void) => void;
  Map: new (
    el: HTMLElement,
    state: {
      center: number[];
      zoom: number;
      controls?: string[];
    },
    options?: {
      searchControlProvider?: string;
    },
  ) => YMap;
  Placemark: new (
    geometry: number[],
    properties?: Record<string, unknown>,
    options?: {
      draggable?: boolean;
      preset?: string;
    },
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
  events: {
    add: (ev: string, fn: (e: { get: (k: string) => number[] }) => void) => void;
  };
  container?: {
    fitToViewport?: () => void;
  };
};

type YPlacemark = {
  geometry: {
    setCoordinates: (c: number[]) => void;
    getCoordinates: () => number[];
  };
  events: {
    add: (ev: string, fn: () => void) => void;
  };
};

function getYmaps(): YMapsGlobal | undefined {
  return (window as unknown as { ymaps?: YMapsGlobal }).ymaps;
}

function loadYandexScript(apiKey?: string): Promise<void> {
  const id = 'slotty-yandex-maps-2.1';

  const params = new URLSearchParams({
    lang: 'ru_RU',
  });

  if (apiKey && apiKey.trim().length > 0) {
    params.set('apikey', apiKey.trim());
  }

  const src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;

  if (document.getElementById(id)) {
    return new Promise((resolve, reject) => {
      const y = getYmaps();

      if (y) {
        y.ready(() => resolve());
        return;
      }

      const el = document.getElementById(id) as HTMLScriptElement | null;

      if (!el) {
        reject(new Error('ymaps'));
        return;
      }

      el.addEventListener('load', () => {
        getYmaps()?.ready(() => resolve());
      });

      el.addEventListener('error', () => {
        reject(new Error('ymaps'));
      });
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');

    s.id = id;
    s.async = true;
    s.src = src;

    s.onload = () => {
      getYmaps()?.ready(() => resolve());
    };

    s.onerror = () => {
      reject(new Error('ymaps'));
    };

    document.head.appendChild(s);
  });
}

type Props = {
  city: string;
  onPick: (res: MapPickResult) => void;
  visitType?: 'studio' | 'at_home';
  coordsError?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onMapAvailabilityChange?: (available: boolean) => void;
  addressSummary?: string | null;

  /** Поле «улица / адрес» внутри блока. */
  street?: string;
  onStreetChange?: (value: string) => void;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputError?: string;
  onInputBlur?: () => void;
  inputMaxLength?: number;
  viewportDropdown?: boolean;

  /** Без поля ввода — только строка адреса. */
  addressLine?: string;
};

export function OnboardingAddressMap({
  city,
  onPick,
  visitType: _visitType = 'studio',
  coordsError,
  initialLat,
  initialLng,
  onMapAvailabilityChange,
  addressSummary = null,
  street,
  onStreetChange,
  inputLabel,
  inputPlaceholder = 'Адрес',
  inputError,
  onInputBlur,
  inputMaxLength = 200,
  viewportDropdown = false,
  addressLine: addressLineLegacy = '',
}: Props) {
  const hasIntegratedInput = onStreetChange != null;
  const streetValue = hasIntegratedInput ? street ?? '' : addressLineLegacy;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const mapRef = useRef<YMap | null>(null);
  const placemarkRef = useRef<YPlacemark | null>(null);

  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const onMapAvailabilityChangeRef = useRef(onMapAvailabilityChange);
  onMapAvailabilityChangeRef.current = onMapAvailabilityChange;

  const lineRef = useRef('');
  const streetRef = useRef(streetValue);
  streetRef.current = streetValue;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<YandexSuggestItem[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [mapHint, setMapHint] = useState<string | null>(null);
  const [hasPoint, setHasPoint] = useState(false);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [layoutTick, setLayoutTick] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortSearchRef = useRef<AbortController | null>(null);

  const yandexMapsApiKey =
    (import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY as string | undefined)?.trim();

  const searchLocalPart = useMemo(() => localGeocodePart(streetValue), [streetValue]);

  useEffect(() => {
    if (streetValue.trim()) {
      lineRef.current = streetValue.trim();
    }
  }, [streetValue]);

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
        map.setCenter([lat, lng], Math.max(map.getZoom(), 15), {
          duration: 200,
        });
      }

      pushCoords(lat, lng, line);
    },
    [pushCoords],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    void (async () => {
      try {
        await loadYandexScript(yandexMapsApiKey);

        if (cancelled) return;

        const ymaps = getYmaps();
        if (!ymaps || !containerRef.current) return;

        const map = new ymaps.Map(containerRef.current, {
          center: MINSK_CENTER,
          zoom: DEFAULT_ZOOM,
          controls: ['zoomControl', 'geolocationControl'],
        });

        const placemark = new ymaps.Placemark(
          [MINSK_CENTER[0], MINSK_CENTER[1]],
          {},
          {
            draggable: true,
            preset: 'islands#pinkCircleDotIcon',
          },
        );

        map.geoObjects.add(placemark);

        mapRef.current = map;
        placemarkRef.current = placemark;

        placemark.events.add('dragend', () => {
          const c = placemark.geometry.getCoordinates();
          const la = c[0];
          const ln = c[1];

          const line = lineRef.current || streetRef.current || 'Выбранная точка на карте';

          pushCoords(la, ln, line);
          setHint(null);
        });

        map.events.add('click', (e) => {
          const coords = e.get('coords') as number[];
          const la = coords[0];
          const ln = coords[1];

          placemark.geometry.setCoordinates([la, ln]);

          const line = lineRef.current || streetRef.current || 'Выбранная точка на карте';

          applyPick(la, ln, line);
          setHint(null);
        });

        requestAnimationFrame(() => {
          try {
            map.container?.fitToViewport?.();
          } catch {
            // ignore
          }
        });

        setMapReady(true);
        setMapHint(null);
        onMapAvailabilityChangeRef.current?.(true);
      } catch {
        if (!cancelled) {
          setMapHint('Не удалось загрузить карту. Укажите адрес текстом.');
          onMapAvailabilityChangeRef.current?.(false);
        }
      }
    })();

    return () => {
      cancelled = true;

      if (abortSearchRef.current) {
        abortSearchRef.current.abort();
      }

      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }

      placemarkRef.current = null;
      setMapReady(false);
    };
  }, [applyPick, pushCoords, yandexMapsApiKey]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    const pm = placemarkRef.current;

    if (!map || !pm) return;

    if (
      initialLat != null &&
      initialLng != null &&
      Number.isFinite(initialLat) &&
      Number.isFinite(initialLng)
    ) {
      pm.geometry.setCoordinates([initialLat, initialLng]);
      map.setCenter([initialLat, initialLng], Math.max(map.getZoom(), 15), {
        duration: 0,
      });

      setHasPoint(true);
      setPoint({
        lat: initialLat,
        lng: initialLng,
      });
    } else if (!searchLocalPart) {
      pm.geometry.setCoordinates([MINSK_CENTER[0], MINSK_CENTER[1]]);
      map.setCenter(MINSK_CENTER, DEFAULT_ZOOM, {
        duration: 0,
      });

      setHasPoint(false);
      setPoint(null);
    }
  }, [initialLat, initialLng, mapReady, searchLocalPart]);

  const runSearch = useCallback(
    async (raw: string) => {
      const q = raw.trim();

      if (q.length < 2) {
        setItems([]);
        setOpen(false);
        setHint(null);
        setLoading(false);
        return;
      }

      if (abortSearchRef.current) {
        abortSearchRef.current.abort();
      }

      const ac = new AbortController();
      abortSearchRef.current = ac;

      setLoading(true);
      setHint(null);

      try {
        const list = await searchMinskAddressSuggestions(city, q, ac.signal);

        if (ac.signal.aborted) return;

        setItems(list);
        setOpen(list.length > 0);

        if (list.length === 0) {
          setHint('Адрес не найден — уточните запрос или выберите точку на карте');
        } else {
          setHint(null);
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name === 'AbortError') return;

        setItems([]);
        setOpen(false);
        setHint('Не удалось выполнить поиск адреса');
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [city],
  );

  const scheduleSearch = useCallback(
    (localPart: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const q = localPart.trim();

      if (q.length < 2) {
        if (abortSearchRef.current) {
          abortSearchRef.current.abort();
        }

        setItems([]);
        setOpen(false);
        setHint(null);
        setLoading(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        void runSearch(q);
      }, 500);
    },
    [runSearch],
  );

  useEffect(() => {
    scheduleSearch(searchLocalPart);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchLocalPart, scheduleSearch]);

  const dropPlacement = useMemo((): ViewportListPlacement | null => {
    if (!viewportDropdown || !open || items.length === 0) return null;

    const input = inputWrapRef.current?.querySelector('input');

    return input instanceof HTMLElement ? computeViewportListPlacement(input) : null;
  }, [viewportDropdown, open, items, streetValue, layoutTick]);

  useLayoutEffect(() => {
    if (!viewportDropdown || !open || items.length === 0) return;

    const input = inputWrapRef.current?.querySelector('input');
    if (!input) return;

    const bump = () => setLayoutTick((n) => n + 1);

    bump();

    const unsubTg = subscribeTelegramViewportLayout(bump);

    window.addEventListener('scroll', bump, true);
    window.addEventListener('resize', bump);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', bump);
      window.visualViewport.addEventListener('scroll', bump);
    }

    return () => {
      unsubTg();

      window.removeEventListener('scroll', bump, true);
      window.removeEventListener('resize', bump);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', bump);
        window.visualViewport.removeEventListener('scroll', bump);
      }
    };
  }, [viewportDropdown, open, items]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target;

      if (!(t instanceof Node)) return;

      const inInput = inputWrapRef.current?.contains(t);
      const inList = listRef.current?.contains(t);

      if (!inInput && !inList) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDoc);

    return () => {
      document.removeEventListener('mousedown', onDoc);
    };
  }, []);

  const onSelectHit = (hit: YandexSuggestItem) => {
    const lat = hit.lat;
    const lng = hit.lon;

    setOpen(false);
    setItems([]);
    setHint(null);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setHint('Не удалось определить координаты — выберите точку на карте');
      return;
    }

    if (!isMinskAreaCoords(lat, lng)) {
      setHint('Адрес находится вне Минска — уточните запрос');
      return;
    }

    const line = hit.displayLine;

    applyPick(lat, lng, line);

    if (onStreetChange) {
      onStreetChange(line);
    }
  };

  const listClass =
    'scrollbar-hidden max-h-[min(260px,42dvh)] overflow-y-auto rounded-[18px] bg-white py-1 shadow-[0_12px_40px_rgba(17,17,17,0.12)]';

  const listContent = items.map((hit, i) => {
    const title = hit.title?.trim() || hit.displayLine;
    const subtitle = hit.subtitle?.trim() || city;

    return (
      <li key={`${hit.displayLine}|${hit.lat}|${hit.lon}|${i}`}>
        <button
          type="button"
          role="option"
          className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[#F8F6F6] active:bg-[#EAE8E8]"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectHit(hit)}
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-neutral-100 text-neutral-500">
            <span className="text-[15px] leading-none">📍</span>
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold leading-snug text-neutral-900">
              {title}
            </span>

            <span className="mt-0.5 block truncate text-[13px] font-medium leading-snug text-neutral-500">
              {subtitle}
            </span>
          </span>
        </button>
      </li>
    );
  });

  const portalListStyle: CSSProperties | null =
    dropPlacement && viewportDropdown && open && items.length > 0
      ? dropPlacement.mode === 'down'
        ? {
            position: 'fixed',
            top: dropPlacement.top,
            left: dropPlacement.left,
            width: dropPlacement.width,
            maxHeight: dropPlacement.maxHeight,
            zIndex: 10000,
          }
        : {
            position: 'fixed',
            bottom: dropPlacement.bottom,
            left: dropPlacement.left,
            width: dropPlacement.width,
            maxHeight: dropPlacement.maxHeight,
            zIndex: 10000,
          }
      : null;

  return (
    <div className="space-y-3">
      {hasIntegratedInput ? (
        <div ref={inputWrapRef} className="relative z-[120]">
          {inputLabel ? (
            <span className="text-[13px] font-semibold text-neutral-500">{inputLabel}</span>
          ) : null}

          <input
            type="text"
            value={streetValue}
            onChange={(e) => onStreetChange?.(e.target.value)}
            onBlur={onInputBlur}
            onFocus={() => {
              if (items.length > 0) {
                setOpen(true);
                return;
              }

              const q = searchLocalPart.trim();

              if (q.length >= 2) {
                void runSearch(q);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            placeholder={inputPlaceholder}
            maxLength={inputMaxLength}
            autoComplete="off"
            className={INPUT_CLASS}
          />

          {open && items.length > 0 ? (
            viewportDropdown && portalListStyle ? (
              createPortal(
                <ul ref={listRef} role="listbox" className={listClass} style={portalListStyle}>
                  {listContent}
                </ul>,
                document.body,
              )
            ) : (
              <ul
                ref={listRef}
                role="listbox"
                className={`absolute left-0 right-0 top-[calc(100%+6px)] z-[130] ${listClass}`}
              >
                {listContent}
              </ul>
            )
          ) : null}

          {inputError ? (
            <p className="mt-1.5 text-[12px] font-medium leading-snug text-red-600">
              {inputError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="min-h-[1.25rem]">
          {loading && searchLocalPart.length >= 2 ? (
            <p className="text-[12px] font-medium text-neutral-500">Ищем адрес…</p>
          ) : null}

          {!loading && hint && searchLocalPart.length >= 2 ? (
            <p className="text-[12px] leading-snug text-[#B66A24]">{hint}</p>
          ) : null}
        </div>

        {coordsError ? (
          <p className="text-[12px] leading-snug text-[#B66A24]">{coordsError}</p>
        ) : null}

        {mapHint ? (
          <p className="text-[12px] leading-snug text-neutral-500">{mapHint}</p>
        ) : null}

        <div className="overflow-hidden rounded-[18px] bg-white shadow-[inset_0_0_0_1px_rgba(17,17,17,0.04)]">
          <div
            ref={containerRef}
            className={`relative z-0 h-[min(220px,42dvh)] min-h-[200px] w-full overflow-hidden rounded-[18px] bg-[#E4E2E2] sm:h-[min(240px,36dvh)] ${
              mapReady ? '' : 'animate-pulse'
            }`}
          />
        </div>
      </div>

      {addressSummary?.trim() ? (
        <p className="text-[13px] font-medium text-neutral-700">
          Выбрано: <span className="text-neutral-900">{addressSummary.trim()}</span>
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