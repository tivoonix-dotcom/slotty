import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLocationSuggestions, type LocationSuggestionDto } from '../../features/services/api/catalogListingsApi';

type Props = {
  locationId: string | null;
  addressLine: string;
  onChange: (next: { locationId: string | null; addressLine: string }) => void;
  id?: string;
};

/** Подсказки адреса только из БД (опубликованные мастера). */
export function ServicesDbLocationField({ locationId, addressLine, onChange, id }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LocationSuggestionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSuggest = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < 2) {
      setItems([]);
      setHint(null);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setHint(null);
    try {
      const list = await fetchLocationSuggestions(q, 12);
      if (ac.signal.aborted) return;
      setItems(list);
      setOpen(list.length > 0);
      if (list.length === 0) setHint('По этому адресу пока нет мастеров');
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return;
      console.warn('[SLOTTY] location suggest', err);
      setItems([]);
      setHint('Не удалось загрузить подсказки');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (locationId) {
      setItems([]);
      setOpen(false);
      setHint(null);
      return;
    }
    if (addressLine.trim().length < 2) {
      setItems([]);
      setOpen(false);
      setHint(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSuggest(addressLine);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [addressLine, locationId, runSuggest]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const w = wrapRef.current;
      if (!w || !(e.target instanceof Node)) return;
      if (!w.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const clear = () => {
    onChange({ locationId: null, addressLine: '' });
    setItems([]);
    setOpen(false);
    setHint(null);
  };

  return (
    <div ref={wrapRef} className="relative z-[70]">
      <div className="flex items-stretch gap-2">
        <input
          id={id}
          type="text"
          value={addressLine}
          onChange={(e) => onChange({ locationId: null, addressLine: e.target.value })}
          onFocus={() => {
            if (items.length > 0) setOpen(true);
            else if (!locationId && addressLine.trim().length >= 2) void runSuggest(addressLine);
          }}
          placeholder="Например, Немига или центр"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-[24px] bg-[#F1EFEF] px-4 py-3.5 text-[16px] font-semibold text-neutral-950 outline-none ring-0 placeholder:font-medium placeholder:text-neutral-400"
        />
        {locationId || addressLine.trim() ? (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-[24px] bg-[#F1EFEF] px-3 text-[13px] font-semibold text-neutral-600 transition hover:bg-neutral-200/80 active:scale-[0.98]"
          >
            Сброс
          </button>
        ) : null}
      </div>

      {locationId ? (
        <p className="mt-1.5 text-[12px] text-neutral-500">Выбран адрес из каталога — точная локация.</p>
      ) : null}

      {open && items.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] max-h-[min(220px,38dvh)] overflow-auto rounded-[18px] bg-white py-1 shadow-[0_12px_40px_rgba(17,17,17,0.12)]"
          role="listbox"
        >
          {items.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                role="option"
                className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-neutral-50 active:bg-[#EAE8E8]"
                onClick={() => {
                  onChange({ locationId: hit.id, addressLine: hit.title });
                  setOpen(false);
                  setHint(null);
                  setItems([]);
                }}
              >
                <span className="text-[14px] font-semibold text-neutral-900">{hit.title}</span>
                <span className="text-[12px] text-neutral-500">{hit.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {hint ? <p className="mt-2 text-[12px] leading-snug text-[#B66A24]">{hint}</p> : null}
      {loading ? <p className="mt-1.5 text-[12px] text-neutral-400">Загрузка…</p> : null}
    </div>
  );
}
