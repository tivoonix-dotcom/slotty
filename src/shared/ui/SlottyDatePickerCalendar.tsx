import type { SlottySelectTone } from './SlottySelect';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

const TONE_ACCENT: Record<SlottySelectTone, string> = {
  neutral: '#E29595',
  admin: '#F47C8C',
  catalog: '#F47C8C',
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function parseIsoDate(iso: string): Date {
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(y, (mo || 1) - 1, d || 1);
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getWeekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatMonthYearRu(year: number, month: number): string {
  const d = new Date(year, month, 1);
  const s = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildMonthCells(
  viewYear: number,
  viewMonth: number,
  minIso: string | undefined,
  maxIso: string | undefined,
) {
  const minDay = minIso ? startOfLocalDay(parseIsoDate(minIso)).getTime() : null;
  const maxDay = maxIso ? startOfLocalDay(parseIsoDate(maxIso)).getTime() : null;
  const firstWd = getWeekdayIndex(new Date(viewYear, viewMonth, 1));
  const len = daysInMonth(viewYear, viewMonth);
  const cells: { key: string; day: number; iso: string; muted: boolean; disabled: boolean }[] = [];

  const isDisabled = (iso: string) => {
    const t = startOfLocalDay(parseIsoDate(iso)).getTime();
    if (minDay != null && t < minDay) return true;
    if (maxDay != null && t > maxDay) return true;
    return false;
  };

  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
  const prevLen = daysInMonth(prevYear, prevMonth);
  for (let i = firstWd - 1; i >= 0; i -= 1) {
    const day = prevLen - i;
    const iso = toIsoDate(new Date(prevYear, prevMonth, day));
    cells.push({ key: `p-${iso}`, day, iso, muted: true, disabled: isDisabled(iso) });
  }

  for (let day = 1; day <= len; day += 1) {
    const iso = toIsoDate(new Date(viewYear, viewMonth, day));
    cells.push({ key: `c-${iso}`, day, iso, muted: false, disabled: isDisabled(iso) });
  }

  let nextDay = 1;
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  while (cells.length < 42) {
    const iso = toIsoDate(new Date(nextYear, nextMonth, nextDay));
    cells.push({ key: `n-${iso}`, day: nextDay, iso, muted: true, disabled: isDisabled(iso) });
    nextDay += 1;
  }

  return cells;
}

function isIsoDisabled(iso: string, minIso?: string, maxIso?: string): boolean {
  const t = startOfLocalDay(parseIsoDate(iso)).getTime();
  if (minIso && t < startOfLocalDay(parseIsoDate(minIso)).getTime()) return true;
  if (maxIso && t > startOfLocalDay(parseIsoDate(maxIso)).getTime()) return true;
  return false;
}

type Props = {
  value: string;
  viewYear: number;
  viewMonth: number;
  onViewYearChange: (y: number) => void;
  onViewMonthChange: (m: number) => void;
  min?: string;
  max?: string;
  allowClear?: boolean;
  tone?: SlottySelectTone;
  onPick: (iso: string) => void;
  className?: string;
};

export function SlottyDatePickerCalendar({
  value,
  viewYear,
  viewMonth,
  onViewYearChange,
  onViewMonthChange,
  min,
  max,
  allowClear = true,
  tone = 'neutral',
  onPick,
  className = '',
}: Props) {
  const accent = TONE_ACCENT[tone];
  const minIso = min?.trim() || undefined;
  const maxIso = max?.trim() || undefined;
  const cells = buildMonthCells(viewYear, viewMonth, minIso, maxIso);
  const todayIso = toIsoDate(new Date());
  const todayDisabled = isIsoDisabled(todayIso, minIso, maxIso);

  const minMonthKey = minIso ? parseIsoDate(minIso).getFullYear() * 12 + parseIsoDate(minIso).getMonth() : null;
  const viewMonthKey = viewYear * 12 + viewMonth;
  const canPrevMonth = minMonthKey == null || viewMonthKey > minMonthKey;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <p className="text-[17px] font-black capitalize tracking-[-0.03em] text-[#111827]">
          {formatMonthYearRu(viewYear, viewMonth)}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!canPrevMonth}
            onClick={() => {
              if (!canPrevMonth) return;
              if (viewMonth === 0) {
                onViewYearChange(viewYear - 1);
                onViewMonthChange(11);
              } else {
                onViewMonthChange(viewMonth - 1);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EAECEF] bg-white text-[#6B7280] transition hover:bg-[#f6f7fb] disabled:opacity-30"
            aria-label="Предыдущий месяц"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => {
              if (viewMonth === 11) {
                onViewYearChange(viewYear + 1);
                onViewMonthChange(0);
              } else {
                onViewMonthChange(viewMonth + 1);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EAECEF] bg-white text-[#6B7280] transition hover:bg-[#f6f7fb]"
            aria-label="Следующий месяц"
          >
            ▼
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-bold text-[#9CA3AF]">
        {WEEKDAYS.map((wd) => (
          <span key={wd} className="py-1">
            {wd}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell) => {
          const selected = value === cell.iso;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={cell.disabled}
              onClick={() => !cell.disabled && onPick(cell.iso)}
              className={`flex aspect-square min-h-10 w-full items-center justify-center rounded-[14px] text-[15px] font-bold tabular-nums transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30 ${
                selected
                  ? 'text-white shadow-[0_6px_18px_rgba(255,95,122,0.35)]'
                  : cell.muted
                    ? 'bg-transparent text-[#D1D5DB]'
                    : 'bg-[#f6f7fb] text-[#111827] hover:bg-[#FFF1F4]'
              }`}
              style={selected ? { backgroundColor: accent } : undefined}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className={`mt-4 flex border-t border-[#F3F4F6] pt-3 ${allowClear ? '' : 'justify-center'}`}>
        {allowClear ? (
          <button
            type="button"
            onClick={() => onPick('')}
            className="flex-1 py-2.5 text-[14px] font-bold text-[#ff5f7a]"
          >
            Очистить
          </button>
        ) : null}
        <button
          type="button"
          disabled={todayDisabled}
          onClick={() => {
            if (!todayDisabled) onPick(todayIso);
          }}
          className={`py-2.5 text-[14px] font-bold text-[#ff5f7a] disabled:opacity-40 ${allowClear ? 'flex-1' : 'min-w-[8rem]'}`}
        >
          Сегодня
        </button>
      </div>
    </div>
  );
}

export function formatDisplayRu(iso: string): string {
  if (!iso.trim()) return '';
  const d = parseIsoDate(iso);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}
