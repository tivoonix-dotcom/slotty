import { useCallback, useEffect, useState } from 'react';
import { isoDateLocal } from '../../../features/master/model/demoMasterAppointments';
import { AdminBottomSheet } from './AdminBottomSheet';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

type Cell = { iso: string; inMonth: boolean };

function buildMonthGrid(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const cells: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - pad + i);
    cells.push({
      iso: isoDateLocal(d),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

function formatMonthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function nextMonth(year: number, month: number): { y: number; m: number } {
  if (month === 11) return { y: year + 1, m: 0 };
  return { y: year, m: month + 1 };
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** Текущее значение при открытии */
  valueIso: string;
  onSelect: (iso: string) => void;
};

function MonthGrid({
  year,
  month,
  valueIso,
  onPick,
  titleClassName,
}: {
  year: number;
  month: number;
  valueIso: string;
  onPick: (iso: string) => void;
  titleClassName: string;
}) {
  const cells = buildMonthGrid(year, month);

  return (
    <>
      <p className={`text-center text-[15px] font-semibold tracking-[-0.02em] text-neutral-950 ${titleClassName}`}>
        {formatMonthTitle(year, month)}
      </p>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((c) => {
          const selected = c.iso === valueIso;
          return (
            <button
              key={`${year}-${month}-${c.iso}`}
              type="button"
              onClick={() => onPick(c.iso)}
              className={`
                  flex aspect-square max-h-11 min-h-9 w-full items-center justify-center rounded-[14px] text-[14px] font-semibold tabular-nums transition active:scale-[0.95]
                  ${selected ? 'bg-[#E29595] text-white' : ''}
                  ${!selected && c.inMonth ? 'bg-[#F1EFEF] text-neutral-900 hover:bg-neutral-200/80' : ''}
                  ${!selected && !c.inMonth ? 'bg-transparent text-neutral-300' : ''}
                `}
            >
              {new Date(`${c.iso}T12:00:00`).getDate()}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function AdminCalendarSheet({ open, onClose, valueIso, onSelect }: Props) {
  const [anchor, setAnchor] = useState(() => {
    const d = new Date(`${valueIso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;
    const d = new Date(`${valueIso}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      setAnchor(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [open, valueIso]);

  const y0 = anchor.getFullYear();
  const m0 = anchor.getMonth();
  const { y: y1, m: m1 } = nextMonth(y0, m0);

  const goPrev = useCallback(() => {
    setAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const goNext = useCallback(() => {
    setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const pickToday = useCallback(() => {
    const t = new Date();
    onSelect(isoDateLocal(t));
    onClose();
  }, [onClose, onSelect]);

  const onPick = useCallback(
    (iso: string) => {
      onSelect(iso);
      onClose();
    },
    [onClose, onSelect],
  );

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Выберите дату">
      <div className="max-h-[min(58dvh,520px)] overflow-y-auto overscroll-contain pb-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[18px] font-semibold text-neutral-800 transition active:scale-[0.96]"
            aria-label="Предыдущие месяцы"
          >
            ‹
          </button>
          <p className="min-w-0 flex-1 text-center text-[13px] font-medium text-neutral-500">Два месяца · листайте</p>
          <button
            type="button"
            onClick={goNext}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[18px] font-semibold text-neutral-800 transition active:scale-[0.96]"
            aria-label="Следующие месяцы"
          >
            ›
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <MonthGrid year={y0} month={m0} valueIso={valueIso} onPick={onPick} titleClassName="mt-4" />
        <MonthGrid year={y1} month={m1} valueIso={valueIso} onPick={onPick} titleClassName="mt-6" />

        <button
          type="button"
          onClick={pickToday}
          className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-[#F1EFEF] text-[14px] font-semibold text-neutral-800 transition active:scale-[0.98]"
        >
          Сегодня
        </button>
      </div>
    </AdminBottomSheet>
  );
}

/** ДД.ММ.ГГГГ для кнопок периода */
export function formatRuDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
