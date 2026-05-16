import { useEffect, useMemo, useState } from 'react';
import type { ScheduleWindowView } from './scheduleTypes';
import { ScheduleWindowCard } from './ScheduleWindowCard';
import { cardClass } from './scheduleUi';
import {
  addMonths,
  buildMonthGrid,
  formatGroupHeader,
  formatMonthYearLabel,
  indexWindowsByDate,
  isTodayIso,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from './scheduleUtils';

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  onWindowClick: (w: ScheduleWindowView) => void;
};

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

function todayIso(): string {
  return toIsoDate(new Date());
}

export function ScheduleCalendar({ windows, loading, onWindowClick }: Props) {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [selectedIso, setSelectedIso] = useState(todayIso);

  const monthCells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const statsByDate = useMemo(() => indexWindowsByDate(windows), [windows]);

  const windowsByDate = useMemo(() => {
    const map = new Map<string, ScheduleWindowView[]>();
    for (const w of windows) {
      const list = map.get(w.dateIso) ?? [];
      list.push(w);
      map.set(w.dateIso, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [windows]);

  const selectedWindows = windowsByDate.get(selectedIso) ?? [];

  useEffect(() => {
    const today = todayIso();
    const selectedInMonth = monthCells.some((c) => c.dateIso === selectedIso && c.inCurrentMonth);
    if (selectedInMonth) return;
    const todayInMonth = monthCells.some((c) => c.dateIso === today && c.inCurrentMonth);
    setSelectedIso(todayInMonth ? today : toIsoDate(monthAnchor));
  }, [monthAnchor, monthCells, selectedIso]);

  const monthLabel = formatMonthYearLabel(monthAnchor);
  const selectedDate = parseIsoDate(selectedIso);
  const todayStart = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const goToday = () => {
    const now = new Date();
    setMonthAnchor(startOfMonth(now));
    setSelectedIso(todayIso());
  };

  return (
    <section className="space-y-4">
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMonthAnchor((m) => addMonths(m, -1))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[20px] font-semibold text-neutral-700 transition active:scale-[0.97]"
            aria-label="Предыдущий месяц"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[17px] font-semibold capitalize tracking-[-0.03em] text-neutral-950">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={goToday}
              className="mt-0.5 text-[13px] font-semibold text-[#C97B7B] transition active:opacity-70"
            >
              Сегодня
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMonthAnchor((m) => addMonths(m, 1))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[20px] font-semibold text-neutral-700 transition active:scale-[0.97]"
            aria-label="Следующий месяц"
          >
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((wd) => (
            <div
              key={wd}
              className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400"
            >
              {wd}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="mt-2 grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }, (_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-[14px] bg-[#F1EFEF]" />
            ))}
          </div>
        ) : (
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthCells.map((cell) => {
              const stats = statsByDate.get(cell.dateIso);
              const isToday = isTodayIso(cell.dateIso);
              const isSelected = selectedIso === cell.dateIso;
              const dayNum = parseIsoDate(cell.dateIso).getDate();

              return (
                <button
                  key={cell.dateIso}
                  type="button"
                  onClick={() => setSelectedIso(cell.dateIso)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-[14px] transition active:scale-[0.96] ${
                    isSelected
                      ? 'bg-[#E29595] text-white shadow-[0_6px_18px_rgba(226,149,149,0.28)]'
                      : isToday
                        ? 'bg-[#FFF5F5] text-[#C97B7B] ring-2 ring-[#E29595]/40'
                        : cell.inCurrentMonth
                          ? 'bg-[#F1EFEF] text-neutral-900'
                          : 'bg-transparent text-neutral-300'
                  }`}
                  aria-label={`${dayNum}, окон: ${stats?.total ?? 0}`}
                  aria-pressed={isSelected}
                >
                  <span
                    className={`text-[15px] font-semibold tabular-nums leading-none ${
                      !cell.inCurrentMonth && !isSelected ? 'opacity-50' : ''
                    }`}
                  >
                    {dayNum}
                  </span>
                  {stats && stats.total > 0 ? (
                    <span className="mt-1 flex items-center gap-0.5" aria-hidden>
                      {stats.booked > 0 ? (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-[#E29595]'
                          }`}
                        />
                      ) : null}
                      {stats.free > 0 ? (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? 'bg-white/70' : 'bg-[#E29595]/45'
                          }`}
                        />
                      ) : null}
                      {stats.total > 2 ? (
                        <span
                          className={`ml-0.5 text-[9px] font-bold leading-none ${
                            isSelected ? 'text-white/90' : 'text-[#C97B7B]'
                          }`}
                        >
                          +{stats.total - 2}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="mt-1 h-1.5" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h3 className="text-[16px] font-semibold tracking-[-0.03em] text-neutral-950">
          {formatGroupHeader(selectedDate, todayStart)}
        </h3>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          {selectedWindows.length === 0
            ? 'На этот день окна не добавлены'
            : `${selectedWindows.length} ${
                selectedWindows.length === 1
                  ? 'окно'
                  : selectedWindows.length < 5
                    ? 'окна'
                    : 'окон'
              }`}
        </p>

        {loading ? (
          <div className="mt-4 space-y-2">
            <div className="h-16 animate-pulse rounded-[18px] bg-[#F1EFEF]" />
            <div className="h-16 animate-pulse rounded-[18px] bg-[#F1EFEF]" />
          </div>
        ) : selectedWindows.length === 0 ? (
          <p className="mt-4 rounded-[20px] bg-[#F1EFEF] px-4 py-5 text-center text-[14px] font-medium leading-snug text-neutral-600">
            {windows.length === 0
              ? 'Пока нет добавленных окон. Добавь первое окно во вкладке «Добавить окно».'
              : 'Выберите другой день в календаре или добавьте новое окно.'}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {selectedWindows.map((w) => (
              <li key={w.id}>
                <ScheduleWindowCard window={w} onClick={() => onWindowClick(w)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
