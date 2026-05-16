import { useMemo, useState } from 'react';
import type { ScheduleWindowView } from './scheduleTypes';
import {
  addDays,
  formatWeekRangeLabel,
  startOfWeekMonday,
} from './scheduleUtils';
import { isTodayIso, ScheduleDayCard, weekDateIsos } from './ScheduleDayCard';

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  onWindowClick: (w: ScheduleWindowView) => void;
};

export function ScheduleCalendar({ windows, loading, onWindowClick }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  const dates = useMemo(() => weekDateIsos(weekStart), [weekStart]);

  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleWindowView[]>();
    for (const d of dates) map.set(d, []);
    for (const w of windows) {
      if (!map.has(w.dateIso)) continue;
      map.get(w.dateIso)!.push(w);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [dates, windows]);

  const hasAnyInWeek = useMemo(
    () => dates.some((d) => (byDate.get(d)?.length ?? 0) > 0),
    [byDate, dates],
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1EFEF] text-[18px] font-semibold text-neutral-700 active:scale-[0.97]"
          aria-label="Предыдущая неделя"
        >
          ‹
        </button>
        <p className="text-center text-[15px] font-semibold text-neutral-900">{formatWeekRangeLabel(weekStart)}</p>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1EFEF] text-[18px] font-semibold text-neutral-700 active:scale-[0.97]"
          aria-label="Следующая неделя"
        >
          ›
        </button>
      </div>

      <button
        type="button"
        onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
        className="mx-auto block text-[13px] font-semibold text-[#C97B7B]"
      >
        Сегодня
      </button>

      {loading ? (
        <p className="text-center text-[14px] text-neutral-500">Загрузка…</p>
      ) : !hasAnyInWeek && windows.length === 0 ? (
        <p className="rounded-[22px] bg-[#F1EFEF] px-4 py-6 text-center text-[14px] font-medium leading-snug text-neutral-600">
          Пока нет добавленных окон. Добавь первое окно, чтобы клиенты могли записаться.
        </p>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {dates.map((dateIso) => (
            <ScheduleDayCard
              key={dateIso}
              dateIso={dateIso}
              windows={byDate.get(dateIso) ?? []}
              isToday={isTodayIso(dateIso)}
              onWindowClick={onWindowClick}
            />
          ))}
        </div>
      )}

      {!loading && windows.length > 0 && !hasAnyInWeek ? (
        <p className="text-center text-[13px] text-neutral-500">На этой неделе окон нет. Листайте недели или добавьте окно.</p>
      ) : null}
    </section>
  );
}
