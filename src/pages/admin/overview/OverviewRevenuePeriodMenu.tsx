import { useEffect, useId, useRef, useState } from 'react';
import { HiChevronDown, HiWallet } from 'react-icons/hi2';
import type { OverviewPeriodPreset } from './overviewAnalytics';

const PERIOD_OPTIONS: Array<{ id: OverviewPeriodPreset; label: string }> = [
  { id: 'today', label: 'Доход за сегодня' },
  { id: 'week', label: 'Доход за неделю' },
  { id: 'month', label: 'Доход за месяц' },
  { id: 'all', label: 'Доход за всё время' },
];

type Props = {
  value: OverviewPeriodPreset;
  onChange: (preset: OverviewPeriodPreset) => void;
};

export function OverviewRevenuePeriodMenu({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selectedLabel = PERIOD_OPTIONS.find((o) => o.id === value)?.label ?? PERIOD_OPTIONS[2]!.label;

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

  const pick = (preset: OverviewPeriodPreset) => {
    onChange(preset);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-[13px] font-bold text-white/90 backdrop-blur transition hover:bg-white/22 active:scale-[0.98]"
      >
        <HiWallet className="h-4 w-4 shrink-0" aria-hidden />
        <span>{selectedLabel}</span>
        <HiChevronDown
          className={`h-4 w-4 shrink-0 opacity-60 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Период дохода"
          className="absolute left-0 z-30 mt-2 min-w-[14rem] overflow-hidden rounded-[20px] border border-[#EEF0F5] bg-white p-2 shadow-[0_18px_50px_rgba(17,24,39,0.18)]"
        >
          {PERIOD_OPTIONS.map((option) => {
            const selected = value === option.id;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(option.id)}
                  className={`w-full rounded-[14px] px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                    selected
                      ? 'bg-[#FFF1F4] text-[#ff5f7a]'
                      : 'text-[#374151] hover:bg-[#FAFAFA]'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
