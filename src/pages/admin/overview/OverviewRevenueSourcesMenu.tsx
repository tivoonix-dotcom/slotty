import { useEffect, useId, useRef, useState } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import {
  overviewFilterChipActive,
  overviewFilterChipIdle,
} from './adminOverviewTheme';
import type { RevenueServiceSource } from './overviewAnalytics';
import { REVENUE_SOURCE_ALL_KEY } from './overviewAnalytics';
import { formatBynRu } from './overviewFormat';

type Props = {
  sources: RevenueServiceSource[];
  value: string;
  onChange: (key: string) => void;
};

export function OverviewRevenueSourcesMenu({ sources, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedLabel =
    value === REVENUE_SOURCE_ALL_KEY
      ? 'Все источники'
      : (sources.find((s) => s.key === value)?.label ?? 'Все источники');

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const pick = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full bg-[#f6f7fb] px-4 py-2 text-[12px] font-bold text-[#6B7280] transition hover:bg-[#EEF0F5] hover:text-[#374151] active:scale-[0.98]"
      >
        <span className="max-w-[10rem] truncate sm:max-w-[14rem]">{selectedLabel}</span>
        <HiChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-50 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Источники дохода"
          className="absolute right-0 z-30 mt-2 max-h-[min(18rem,50vh)] min-w-[min(100%,16rem)] overflow-y-auto rounded-[20px] border border-[#EEF0F5] bg-white p-2 shadow-[0_18px_50px_rgba(17,24,39,0.12)] sm:min-w-[18rem]"
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={value === REVENUE_SOURCE_ALL_KEY}
              onClick={() => pick(REVENUE_SOURCE_ALL_KEY)}
              className={`w-full rounded-[14px] px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                value === REVENUE_SOURCE_ALL_KEY ? overviewFilterChipActive : overviewFilterChipIdle
              }`}
            >
              Все источники
            </button>
          </li>

          {sources.map((source) => (
            <li key={source.key} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === source.key}
                onClick={() => pick(source.key)}
                className={`flex w-full flex-col gap-0.5 rounded-[14px] px-3 py-2.5 text-left transition ${
                  value === source.key ? overviewFilterChipActive : overviewFilterChipIdle
                }`}
              >
                <span className="truncate text-[13px] font-semibold">{source.label}</span>
                <span className="text-[11px] font-bold tabular-nums text-[#9CA3AF]">
                  {formatBynRu(source.revenue)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
