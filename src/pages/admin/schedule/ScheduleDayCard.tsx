import { addDays, formatWeekdayShort, parseIsoDate, startOfLocalDay, toIsoDate } from './scheduleUtils';
import type { ScheduleWindowView } from './scheduleTypes';
import { ScheduleWindowCard } from './ScheduleWindowCard';

type Props = {
  dateIso: string;
  windows: ScheduleWindowView[];
  isToday: boolean;
  onWindowClick: (w: ScheduleWindowView) => void;
};

export function ScheduleDayCard({ dateIso, windows, isToday, onWindowClick }: Props) {
  const d = parseIsoDate(dateIso);
  const dayNum = d.getDate();

  return (
    <article
      className={`min-w-[5.5rem] shrink-0 rounded-[22px] p-2.5 ${
        isToday ? 'bg-[#FFF5F5] ring-2 ring-[#E29595]/35' : 'bg-[#F1EFEF]/80'
      }`}
    >
      <div className="mb-2 text-center">
        <p className="text-[11px] font-semibold uppercase text-neutral-500">{formatWeekdayShort(d)}</p>
        <p
          className={`mt-0.5 text-[18px] font-bold tabular-nums ${
            isToday ? 'text-[#C97B7B]' : 'text-neutral-900'
          }`}
        >
          {dayNum}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {windows.length === 0 ? (
          <p className="px-1 py-2 text-center text-[10px] text-neutral-400">—</p>
        ) : (
          windows.map((w) => <ScheduleWindowCard key={w.id} window={w} onClick={() => onWindowClick(w)} />)
        )}
      </div>
    </article>
  );
}

/** Helper for week grid: list of 7 date ISO strings from week start Monday */
export function weekDateIsos(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(weekStart, i)));
}

export function isTodayIso(dateIso: string): boolean {
  return startOfLocalDay(parseIsoDate(dateIso)).getTime() === startOfLocalDay(new Date()).getTime();
}
