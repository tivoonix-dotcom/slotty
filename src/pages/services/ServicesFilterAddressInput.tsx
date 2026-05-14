import { useCallback, useEffect, useRef, useState } from 'react';
import {
  nominatimLineForForm,
  nominatimSearchMinsk,
  type NominatimMinskHit,
} from '../../shared/lib/nominatimMinsk';

const FILTER_CITY = 'Минск';

export type ServicesFilterAddressInputProps = {
  value: string;
  onChange: (next: string) => void;
  id?: string;
};

/**
 * Поле «район / адрес» с подсказками Nominatim по Минску (как при вводе адреса мастером).
 */
export function ServicesFilterAddressInput({ value, onChange, id }: ServicesFilterAddressInputProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NominatimMinskHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortSearchRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < 2) {
      setItems([]);
      setHint(null);
      return;
    }

    if (abortSearchRef.current) abortSearchRef.current.abort();
    const ac = new AbortController();
    abortSearchRef.current = ac;

    setLoading(true);
    setHint(null);
    try {
      const list = await nominatimSearchMinsk(FILTER_CITY, q, ac.signal);
      setItems(list);
      setOpen(list.length > 0);
      if (list.length === 0) {
        setHint('Ничего не нашли — уточните улицу, район или ориентир в Минске.');
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return;
      console.warn('[SLOTTY] services filter nominatim', err);
      setItems([]);
      setHint('Поиск адреса временно недоступен. Можно ввести район вручную.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setItems([]);
      setOpen(false);
      setHint(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(value);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, runSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const w = wrapRef.current;
      if (!w || !(e.target instanceof Node)) return;
      if (!w.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const onSelectHit = (hit: NominatimMinskHit) => {
    onChange(nominatimLineForForm(hit));
    setOpen(false);
    setHint(null);
    setItems([]);
  };

  return (
    <div ref={wrapRef} className="relative z-[70]">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (items.length > 0) {
            setOpen(true);
            return;
          }
          if (value.trim().length >= 2) void runSearch(value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter') {
            e.preventDefault();
            void runSearch(value);
            setOpen(true);
          }
        }}
        placeholder="Например, Немига или центр"
        autoComplete="off"
        className="w-full rounded-[24px] bg-[#F1EFEF] px-4 py-3.5 text-[16px] font-semibold text-neutral-950 outline-none ring-0 placeholder:font-medium placeholder:text-neutral-400"
      />

      {open && items.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] max-h-[min(220px,38dvh)] overflow-auto rounded-[18px] bg-white py-1 shadow-[0_12px_40px_rgba(17,17,17,0.12)]"
          role="listbox"
        >
          {items.map((hit) => (
            <li key={hit.place_id}>
              <button
                type="button"
                role="option"
                className="flex w-full px-3 py-2.5 text-left text-[13px] leading-snug text-neutral-900 transition hover:bg-neutral-50 active:bg-[#EAE8E8]"
                onClick={() => onSelectHit(hit)}
              >
                <span className="line-clamp-2">{hit.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {hint ? <p className="mt-2 text-[12px] leading-snug text-[#B66A24]">{hint}</p> : null}
      {loading ? <p className="mt-1.5 text-[12px] text-neutral-400">Поиск…</p> : null}
    </div>
  );
}
