import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  nominatimLineForForm,
  nominatimSearchMinsk,
  type NominatimMinskHit,
} from '../../shared/lib/nominatimMinsk';

const FILTER_CITY = 'Минск';

const DEFAULT_PLACEHOLDER = 'Например, Немига или центр';

const INPUT_BASE =
  'w-full bg-[#F1EFEF] px-4 outline-none ring-0 placeholder:font-medium placeholder:text-neutral-400';

export type ServicesFilterAddressInputProps = {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  placeholder?: string;
  /** Если задан — полностью задаёт вид поля (кроме w-full / outline / ring). */
  inputClassName?: string;
  /**
   * Список подсказок в `document.body` с position:fixed — нужно внутри sheet/модалки
   * с overflow-y-auto, иначе выпадающий список обрезается.
   */
  viewportDropdown?: boolean;
};

/**
 * Поле «район / адрес» с подсказками Nominatim по Минску (как при вводе адреса мастером).
 */
export function ServicesFilterAddressInput({
  value,
  onChange,
  id,
  placeholder = DEFAULT_PLACEHOLDER,
  inputClassName = '',
  viewportDropdown = false,
}: ServicesFilterAddressInputProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NominatimMinskHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null);

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

  useLayoutEffect(() => {
    if (!viewportDropdown || !open || items.length === 0) {
      setDropRect(null);
      return;
    }
    const input = wrapRef.current?.querySelector('input');
    if (!input) {
      setDropRect(null);
      return;
    }
    const measure = () => {
      const r = input.getBoundingClientRect();
      setDropRect({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [viewportDropdown, open, items]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      const inWrap = wrapRef.current?.contains(t);
      const inList = listRef.current?.contains(t);
      if (!inWrap && !inList) setOpen(false);
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

  const listClass =
    'scrollbar-hidden max-h-[min(220px,38dvh)] overflow-auto rounded-[18px] bg-white py-1 shadow-[0_12px_40px_rgba(17,17,17,0.12)]';

  const listContent = items.map((hit) => (
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
  ));

  const inputClasses =
    inputClassName.trim().length > 0
      ? `${inputClassName.trim()} w-full outline-none ring-0`
      : `${INPUT_BASE} rounded-[24px] py-3.5 text-[16px] font-semibold text-neutral-950`;

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
        placeholder={placeholder}
        autoComplete="off"
        className={inputClasses}
      />

      {open && items.length > 0 ? (
        viewportDropdown && dropRect ? (
          createPortal(
            <ul
              ref={listRef}
              role="listbox"
              className={listClass}
              style={{
                position: 'fixed',
                top: dropRect.top,
                left: dropRect.left,
                width: dropRect.width,
                zIndex: 10000,
              }}
            >
              {listContent}
            </ul>,
            document.body,
          )
        ) : !viewportDropdown ? (
          <ul
            ref={listRef}
            className={`absolute left-0 right-0 top-[calc(100%+6px)] z-[80] ${listClass}`}
            role="listbox"
          >
            {listContent}
          </ul>
        ) : null
      ) : null}

      {hint ? <p className="mt-2 text-[12px] leading-snug text-[#B66A24]">{hint}</p> : null}
      {loading ? <p className="mt-1.5 text-[12px] text-neutral-400">Поиск…</p> : null}
    </div>
  );
}
