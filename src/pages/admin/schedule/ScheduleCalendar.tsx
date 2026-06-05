import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiArrowDownTray, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { downloadScheduleMonthWordReport } from './exportScheduleWordReport';
import type { ScheduleWindowView } from './scheduleTypes';
import { ScheduleWindowCard } from './ScheduleWindowCard';
import {
  scheduleBusyDayChipClass,
  scheduleBusyDaysStrip,
  scheduleCalendarCard,
  scheduleCalendarDayPanel,
  scheduleCalendarIconBtn,
} from './adminScheduleTheme';
import { ScheduleCalendarTabStats } from './ScheduleCalendarTabStats';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';
import { sheetChipClass } from '../profile/adminProfileCabinetTheme';
import {
  addMonths,
  buildMonthGrid,
  formatGroupHeader,
  formatMonthYearLabel,
  indexWindowsByDate,
  isLocalDateIsoBeforeToday,
  isTodayIso,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
  windowsCountRu,
  type DayWindowStats,
} from './scheduleUtils';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  calendarMetrics: ScheduleTabMetrics['calendar'];
  onWindowClick: (w: ScheduleWindowView) => void;
  onCreateForDay?: (dateIso: string) => void;
  canCreateForDay?: boolean;
  createForDayDisabledTitle?: string;
  masterName?: string;
};

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

const COMPACT_DAY_THRESHOLD = 5;
const BUSY_DAYS_SECTION_THRESHOLD = 5;

function daysCountRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} дней`;
  if (mod10 === 1) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} дня`;
  return `${n} дней`;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function formatCountBadge(n: number): string {
  if (n > 99) return '99+';
  return String(n);
}

function DayLoadBar({ stats, inverted }: { stats: DayWindowStats; inverted?: boolean }) {
  const { total, booked, free, blocked } = stats;
  if (total <= 0) return null;

  const segments = [
    { n: booked, class: inverted ? 'bg-white' : 'bg-[#3B4CCA]' },
    { n: free, class: inverted ? 'bg-white/70' : 'bg-[#B8BEE8]' },
    { n: blocked, class: inverted ? 'bg-white/40' : 'bg-[#EAECEF]' },
  ].filter((s) => s.n > 0);

  return (
    <div
      className={`mt-1 flex h-1 w-full max-w-[2.25rem] overflow-hidden rounded-full ${
        inverted ? 'bg-white/25' : 'bg-[#D8DCF5]'
      }`}
      aria-hidden
    >
      {segments.map((s, i) => (
        <span key={i} className={s.class} style={{ flex: s.n }} />
      ))}
    </div>
  );
}

function CalendarDayCell({
  dayNum,
  cell,
  stats,
  isToday,
  isPast,
  isSelected,
  onSelect,
}: {
  dayNum: number;
  cell: { dateIso: string; inCurrentMonth: boolean };
  stats: DayWindowStats | undefined;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasSlots = (stats?.total ?? 0) > 0;
  const dense = (stats?.total ?? 0) >= 6;
  const pastMuted = isPast && !isSelected;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-center rounded-[12px] px-0.5 transition active:scale-[0.96] ${
        pastMuted ? 'min-h-[2.35rem] py-1 opacity-70 sm:min-h-[2.5rem]' : 'min-h-[3.25rem] py-1.5 sm:min-h-[3.5rem]'
      } ${
        isSelected
          ? 'bg-[#3B4CCA] text-white'
          : isToday
            ? 'bg-[#EEF0FC] text-[#3B4CCA]'
            : pastMuted
              ? hasSlots
                ? 'bg-[#EBEBEB] text-[#6B7280] hover:bg-[#E4E4E4]'
                : 'bg-transparent text-[#9CA3AF] hover:bg-[#EBEBEB]/60'
              : hasSlots
                ? 'bg-white text-[#111827] hover:bg-[#EEF0FC]'
                : cell.inCurrentMonth
                  ? 'bg-[#F6F7FB] text-[#374151] ring-1 ring-inset ring-[#EEEEEE] hover:bg-[#EEF0FC]'
                  : 'bg-transparent text-[#D1D5DB]'
      }`}
      aria-label={`${dayNum}, ${windowsCountRu(stats?.total ?? 0)}`}
      aria-pressed={isSelected}
    >
      <span
        className={`font-black tabular-nums leading-none ${
          pastMuted ? 'text-[12px] sm:text-[13px]' : 'text-[14px] sm:text-[15px]'
        } ${!cell.inCurrentMonth && !isSelected ? 'opacity-45' : ''}`}
      >
        {dayNum}
      </span>

      {hasSlots && stats ? (
        <div className={`flex w-full flex-col items-center px-1 ${pastMuted ? 'mt-0.5' : 'mt-1'}`}>
          <span
            className={`font-black leading-none tabular-nums ${
              pastMuted ? 'text-[9px]' : 'text-[10px]'
            } ${isSelected ? 'text-white' : dense ? 'text-[#3B4CCA]' : 'text-[#6B7280]'}`}
          >
            {formatCountBadge(stats.total)}
          </span>
          {!dense ? <DayLoadBar stats={stats} inverted={isSelected} /> : null}
        </div>
      ) : (
        <span className="mt-1 h-3" aria-hidden />
      )}
    </button>
  );
}

const STATUS_SHORT: Record<ScheduleWindowView['status'], string> = {
  free: 'Свободно',
  booked: 'Запись',
  blocked: 'Закрыто',
};

function ScheduleWindowRowCompact({ window: w, onClick }: { window: ScheduleWindowView; onClick: () => void }) {
  const booked = w.status === 'booked';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left transition active:scale-[0.99] ${
        booked
          ? 'bg-[#EEF0FC] text-[#111827]'
          : w.status === 'blocked'
            ? 'bg-[#EBEBEB] text-[#6B7280]'
            : 'bg-white text-[#111827]'
      }`}
    >
      <span
        className="shrink-0 text-[13px] font-black tabular-nums tracking-[-0.03em] text-[#3B4CCA]"
      >
        {w.startTime}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#111827]">
        {w.serviceName}
      </span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          booked ? 'bg-[#3B4CCA] text-white' : 'bg-[#EBEBEB] text-[#6B7280]'
        }`}
      >
        {STATUS_SHORT[w.status]}
      </span>
    </button>
  );
}

export function ScheduleCalendar({
  windows,
  loading,
  calendarMetrics,
  onWindowClick,
  onCreateForDay,
  canCreateForDay = true,
  createForDayDisabledTitle,
  masterName = 'Мастер',
}: Props) {
  const [exportingWord, setExportingWord] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [selectedIso, setSelectedIso] = useState(todayIso);
  const [dayFilter, setDayFilter] = useState<'all' | ScheduleWindowView['status']>('all');
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

  const monthIsoSet = useMemo(
    () => new Set(monthCells.filter((c) => c.inCurrentMonth).map((c) => c.dateIso)),
    [monthCells],
  );

  const monthWindowCount = useMemo(
    () => windows.filter((w) => monthIsoSet.has(w.dateIso)).length,
    [monthIsoSet, windows],
  );

  const busyDaysInMonth = useMemo(() => {
    const days: Array<{ dateIso: string; stats: DayWindowStats }> = [];
    for (const cell of monthCells) {
      if (!cell.inCurrentMonth) continue;
      const stats = statsByDate.get(cell.dateIso);
      if (stats && stats.total > 0) days.push({ dateIso: cell.dateIso, stats });
    }
    return days;
  }, [monthCells, statsByDate]);

  const selectedWindowsAll = windowsByDate.get(selectedIso) ?? [];

  const selectedWindows = useMemo(() => {
    if (dayFilter === 'all') return selectedWindowsAll;
    return selectedWindowsAll.filter((w) => w.status === dayFilter);
  }, [dayFilter, selectedWindowsAll]);

  const selectedDayStats = statsByDate.get(selectedIso);

  useEffect(() => {
    setDayFilter('all');
  }, [selectedIso]);

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

  const useCompactList = selectedWindows.length >= COMPACT_DAY_THRESHOLD;
  const selectedIsPast = isLocalDateIsoBeforeToday(selectedIso);
  const showCreateForDayLink =
    Boolean(onCreateForDay) && !selectedIsPast && selectedWindowsAll.length === 0;

  const handleWordExport = useCallback(async () => {
    setExportError(null);
    setExportingWord(true);
    try {
      await downloadScheduleMonthWordReport({
        windows,
        monthAnchor,
        masterName,
      });
    } catch {
      setExportError('Не удалось сформировать отчёт Word');
    } finally {
      setExportingWord(false);
    }
  }, [masterName, monthAnchor, windows]);

  return (
    <section className="space-y-4 lg:space-y-6">
      <header className="min-w-0">
        <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#111827] lg:text-[24px] lg:tracking-[-0.05em]">
          Календарь
        </h2>

      </header>

      <ScheduleCalendarTabStats metrics={calendarMetrics} />

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
        <div className={`${scheduleCalendarCard} lg:sticky lg:top-[calc(var(--slotty-admin-desktop-topbar-h,4.75rem)+7rem)]`}>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMonthAnchor((m) => addMonths(m, -1))}
              className={scheduleCalendarIconBtn}
              aria-label="Предыдущий месяц"
            >
              <HiChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[18px] font-black capitalize tracking-[-0.04em] text-[#111827] lg:text-[20px]">
                {monthLabel}
              </p>
              <button
                type="button"
                onClick={goToday}
                className="mt-1 text-[13px] font-bold text-[#3B4CCA] transition active:opacity-70"
              >
                Сегодня
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMonthAnchor((m) => addMonths(m, 1))}
              className={scheduleCalendarIconBtn}
              aria-label="Следующий месяц"
            >
              <HiChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {!loading ? (
            <p className="mt-3 text-center text-[12px] font-semibold text-[#6B7280]">
              В месяце:{' '}
              <span className="font-black text-[#3B4CCA]">{windowsCountRu(monthWindowCount)}</span>
              {busyDaysInMonth.length > 0 ? (
                <span className="text-[#9CA3AF]"> · {busyDaysInMonth.length} дн. с окнами</span>
              ) : null}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEKDAY_LABELS.map((wd) => (
              <div
                key={wd}
                className="pb-1 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] sm:text-[11px]"
              >
                {wd}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="mt-4 flex justify-center py-8">
              <LoadingVideo size="sm" label="Загрузка календаря…" />
            </div>
          ) : (
            <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
              {monthCells.map((cell) => {
                const stats = statsByDate.get(cell.dateIso);
                const isToday = isTodayIso(cell.dateIso);
                const isPast = isLocalDateIsoBeforeToday(cell.dateIso);
                const isSelected = selectedIso === cell.dateIso;
                const dayNum = parseIsoDate(cell.dateIso).getDate();

                return (
                  <CalendarDayCell
                    key={cell.dateIso}
                    dayNum={dayNum}
                    cell={cell}
                    stats={stats}
                    isToday={isToday}
                    isPast={isPast}
                    isSelected={isSelected}
                    onSelect={() => setSelectedIso(cell.dateIso)}
                  />
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-[#6B7280]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#3B4CCA]" aria-hidden />
              Запись
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#B8BEE8]" aria-hidden />
              Свободно
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#EAECEF]" aria-hidden />
              Закрыто
            </span>
          </div>

          {busyDaysInMonth.length >= BUSY_DAYS_SECTION_THRESHOLD ? (
            <div className="mt-4 border-t border-[#EBEBEB] pt-4 pb-1 lg:hidden">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  Дни с окнами
                </p>
                <span className="text-[11px] font-semibold text-[#9CA3AF]">
                  {daysCountRu(busyDaysInMonth.length)}
                </span>
              </div>
              <div className={scheduleBusyDaysStrip} role="list" aria-label="Быстрый выбор дня">
                {busyDaysInMonth.map(({ dateIso, stats }) => {
                  const selected = selectedIso === dateIso;
                  const d = parseIsoDate(dateIso);
                  const label = new Intl.DateTimeFormat('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  }).format(d);
                  return (
                    <button
                      key={dateIso}
                      type="button"
                      role="listitem"
                      onClick={() => setSelectedIso(dateIso)}
                      className={scheduleBusyDayChipClass(selected)}
                      aria-pressed={selected}
                    >
                      <span className="text-[11px] font-semibold leading-tight">{label}</span>
                      <span
                        className={`mt-0.5 text-[12px] font-bold tabular-nums ${
                          selected ? 'text-white/90' : 'text-[#6B7280]'
                        }`}
                      >
                        {stats.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className={scheduleCalendarDayPanel}>
          <div className="flex flex-wrap items-start justify-between gap-3 max-lg:pb-1">
            <div className="min-w-0">
              <h3 className="text-[18px] font-bold leading-snug tracking-[-0.04em] text-[#111827] lg:text-[20px] lg:font-black">
                {formatGroupHeader(selectedDate, todayStart)}
              </h3>
              <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
                {selectedWindowsAll.length === 0
                  ? selectedIsPast
                    ? 'День завершён — окон не было'
                    : 'На этот день окна не добавлены'
                  : windowsCountRu(selectedWindowsAll.length)}
                {selectedWindowsAll.length > 0 && dayFilter !== 'all'
                  ? ` · показано ${selectedWindows.length}`
                  : null}
              </p>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              {selectedDayStats && selectedDayStats.total > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedDayStats.free > 0 ? (
                    <span className="rounded-full bg-[#EBEBEB] px-2.5 py-1 text-[11px] font-semibold text-[#111827] lg:bg-[#EEF0FC] lg:font-bold lg:text-[#3B4CCA]">
                      {selectedDayStats.free} св.
                    </span>
                  ) : null}
                  {selectedDayStats.booked > 0 ? (
                    <span className="rounded-full bg-[#EBEBEB] px-2.5 py-1 text-[11px] font-semibold text-[#111827] lg:bg-[#3B4CCA] lg:font-bold lg:text-white">
                      {selectedDayStats.booked} зап.
                    </span>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void handleWordExport()}
                disabled={exportingWord || loading}
                title="Скачать отчёт Word за месяц"
                aria-label="Скачать отчёт Word за месяц"
                className={`${scheduleCalendarIconBtn} text-[#3B4CCA]`}
              >
                <HiArrowDownTray className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>

          {exportError ? (
            <p className="mt-2 text-[13px] font-semibold text-[#B45309]">{exportError}</p>
          ) : null}

          {selectedWindowsAll.length > 2 ? (
            <div
              className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:gap-2"
              role="tablist"
              aria-label="Фильтр дня"
            >
              {(
                [
                  { id: 'all' as const, label: 'Все' },
                  { id: 'free' as const, label: 'Свободные' },
                  { id: 'booked' as const, label: 'С записью' },
                  { id: 'blocked' as const, label: 'Закрытые' },
                ] as const
              ).map((opt) => {
                const count =
                  opt.id === 'all'
                    ? selectedWindowsAll.length
                    : selectedWindowsAll.filter((w) => w.status === opt.id).length;
                if (opt.id !== 'all' && count === 0) return null;
                const selected = dayFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setDayFilter(opt.id)}
                    className={`${sheetChipClass(selected)} w-full text-center text-[12px] lg:w-auto lg:shrink-0`}
                  >
                    {opt.label}
                    {count > 0 ? ` · ${count}` : ''}
                  </button>
                );
              })}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 flex justify-center py-8">
              <LoadingVideo size="sm" />
            </div>
          ) : selectedWindows.length === 0 ? (
            <div className="mt-4 rounded-[16px] bg-[#EBEBEB]/60 px-4 py-6 text-center lg:bg-white">
              <p className="text-[14px] font-semibold leading-snug text-[#6B7280]">
                {selectedWindowsAll.length === 0
                  ? selectedIsPast
                    ? 'На этот день окон не было. Выберите другой день в календаре.'
                    : 'Окон на этот день пока нет.'
                  : 'Нет окон с таким статусом — смените фильтр.'}
              </p>
              {showCreateForDayLink ? (
                <button
                  type="button"
                  disabled={!canCreateForDay}
                  title={!canCreateForDay ? createForDayDisabledTitle : undefined}
                  onClick={() => onCreateForDay?.(selectedIso)}
                  className="mt-3 text-[14px] font-bold text-[#3B4CCA] underline decoration-[#B8BEE8] underline-offset-2 transition hover:text-[#4558D4] disabled:cursor-not-allowed disabled:text-[#9CA3AF] disabled:no-underline"
                >
                  Создать окно на этот день
                </button>
              ) : null}
            </div>
          ) : (
            <ul
              className={`mt-4 flex flex-col gap-2 ${
                useCompactList
                  ? 'max-h-[min(52dvh,32rem)] overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]'
                  : ''
              }`}
            >
              {selectedWindows.map((w) => (
                <li key={w.id}>
                  {useCompactList ? (
                    <ScheduleWindowRowCompact window={w} onClick={() => onWindowClick(w)} />
                  ) : (
                    <ScheduleWindowCard flat window={w} onClick={() => onWindowClick(w)} />
                  )}
                </li>
              ))}
            </ul>
          )}

          {useCompactList && selectedWindows.length > 0 ? (
            <p className="mt-3 text-center text-[12px] font-semibold text-[#9CA3AF]">
              Компактный список — прокрутите, чтобы увидеть все {selectedWindows.length} окон
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
