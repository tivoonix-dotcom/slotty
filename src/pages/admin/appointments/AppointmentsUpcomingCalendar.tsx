import { useEffect, useMemo, useState } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { isRequiresAttentionAppointment } from '../../../features/appointments/masterAppointmentLifecycle';
import {
  addMonths,
  buildMonthGrid,
  formatMonthYearLabel,
  isLocalDateIsoBeforeToday,
  isTodayIso,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from '../schedule/scheduleUtils';
import {
  apptCalendarDayChipClass,
  apptCalendarIconBtn,
  apptCalendarPanel,
  apptGroupLabel,
  apptListGap,
  apptMonthLabel,
} from './adminAppointmentsTheme';
import { AppointmentsUpcomingCalendarDayCell } from './AppointmentsUpcomingCalendarDayCell';
import { AppointmentsUpcomingRow } from './AppointmentsUpcomingRow';
import {
  appointmentsCountRu,
  compareAppointmentsByDateAsc,
  formatDayGroupLabel,
  indexAppointmentsByDate,
} from './appointmentsFormat';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;
const BUSY_DAYS_SECTION_THRESHOLD = 3;

type Props = {
  appointments: DemoMasterAppointment[];
  nearestId?: string | null;
  onOpen: (appointment: DemoMasterAppointment) => void;
};

function todayIso(): string {
  return toIsoDate(new Date());
}

function sortDayAppointments(
  rows: DemoMasterAppointment[],
  nearestId?: string | null,
): DemoMasterAppointment[] {
  return [...rows].sort((a, b) => {
    const aAttention = isRequiresAttentionAppointment(a) ? 0 : 1;
    const bAttention = isRequiresAttentionAppointment(b) ? 0 : 1;
    if (aAttention !== bAttention) return aAttention - bAttention;
    if (nearestId) {
      if (a.id === nearestId) return -1;
      if (b.id === nearestId) return 1;
    }
    return compareAppointmentsByDateAsc(a, b);
  });
}

export function AppointmentsUpcomingCalendar({ appointments, nearestId, onOpen }: Props) {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [selectedIso, setSelectedIso] = useState(todayIso);

  const byDate = useMemo(() => indexAppointmentsByDate(appointments), [appointments]);
  const monthCells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const monthLabel = formatMonthYearLabel(monthAnchor);

  const monthIsoSet = useMemo(
    () => new Set(monthCells.filter((c) => c.inCurrentMonth).map((c) => c.dateIso)),
    [monthCells],
  );

  const monthAppointmentCount = useMemo(
    () => appointments.filter((a) => monthIsoSet.has(a.date)).length,
    [appointments, monthIsoSet],
  );

  const busyDaysInMonth = useMemo(() => {
    const days: Array<{ dateIso: string; count: number; hasAttention: boolean }> = [];
    for (const cell of monthCells) {
      if (!cell.inCurrentMonth) continue;
      const dayRows = byDate.get(cell.dateIso);
      if (!dayRows?.length) continue;
      days.push({
        dateIso: cell.dateIso,
        count: dayRows.length,
        hasAttention: dayRows.some((row) => isRequiresAttentionAppointment(row)),
      });
    }
    return days;
  }, [byDate, monthCells]);

  useEffect(() => {
    const today = todayIso();
    const selectedInMonth = monthCells.some((c) => c.dateIso === selectedIso && c.inCurrentMonth);
    if (selectedInMonth) return;
    const todayInMonth = monthCells.some((c) => c.dateIso === today && c.inCurrentMonth);
    setSelectedIso(todayInMonth ? today : toIsoDate(monthAnchor));
  }, [monthAnchor, monthCells, selectedIso]);

  const selectedDayRows = useMemo(
    () => sortDayAppointments(byDate.get(selectedIso) ?? [], nearestId),
    [byDate, nearestId, selectedIso],
  );

  const selectedDayLabel = formatDayGroupLabel(selectedIso);
  const selectedDayHasAttention = selectedDayRows.some((row) => isRequiresAttentionAppointment(row));

  const goToday = () => {
    const now = new Date();
    setMonthAnchor(startOfMonth(now));
    setSelectedIso(todayIso());
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className={apptCalendarPanel}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMonthAnchor((d) => addMonths(d, -1))}
            className={apptCalendarIconBtn}
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
              className="mt-2 inline-flex rounded-[10px] bg-[#EBEBEB] px-3.5 py-1.5 text-[12px] font-bold text-[#F47C8C] transition hover:bg-[#E4E4E4] active:scale-[0.98] lg:text-[13px]"
            >
              Сегодня
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMonthAnchor((d) => addMonths(d, 1))}
            className={apptCalendarIconBtn}
            aria-label="Следующий месяц"
          >
            <HiChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-4 rounded-[10px] bg-[#EBEBEB] px-3 py-2.5 text-center">
          <p className="text-[13px] font-semibold text-[#374151]">
            <span className="font-black text-[#F47C8C]">{appointmentsCountRu(monthAppointmentCount)}</span>
            {busyDaysInMonth.length > 0 ? (
              <span className="text-[#6B7280]">
                {' '}
                · {busyDaysInMonth.length}{' '}
                {busyDaysInMonth.length === 1
                  ? 'день'
                  : busyDaysInMonth.length < 5
                    ? 'дня'
                    : 'дней'}{' '}
                с визитами
              </span>
            ) : (
              <span className="text-[#9CA3AF]"> · в этом месяце пока нет визитов</span>
            )}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAY_LABELS.map((wd) => (
            <div
              key={wd}
              className="pb-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7280] sm:text-[12px]"
            >
              {wd}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1.5 sm:gap-2">
          {monthCells.map((cell) => {
            const dayRows = byDate.get(cell.dateIso) ?? [];
            const count = dayRows.length;
            const hasAttention = dayRows.some((row) => isRequiresAttentionAppointment(row));

            return (
              <AppointmentsUpcomingCalendarDayCell
                key={cell.dateIso}
                dayNum={parseIsoDate(cell.dateIso).getDate()}
                inCurrentMonth={cell.inCurrentMonth}
                count={count}
                hasAttention={hasAttention}
                isToday={isTodayIso(cell.dateIso)}
                isPast={isLocalDateIsoBeforeToday(cell.dateIso)}
                isSelected={selectedIso === cell.dateIso}
                onSelect={() => setSelectedIso(cell.dateIso)}
              />
            );
          })}
        </div>

        {busyDaysInMonth.length >= BUSY_DAYS_SECTION_THRESHOLD ? (
          <div className="mt-4 border-t border-[#EEEEEE] pt-4 pb-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Дни с визитами
              </p>
              <span className="text-[11px] font-semibold text-[#9CA3AF]">
                {busyDaysInMonth.length}{' '}
                {busyDaysInMonth.length === 1
                  ? 'день'
                  : busyDaysInMonth.length < 5
                    ? 'дня'
                    : 'дней'}
              </span>
            </div>
            <div
              className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="list"
              aria-label="Быстрый выбор дня"
            >
              {busyDaysInMonth.map(({ dateIso, count, hasAttention }) => {
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
                    className={apptCalendarDayChipClass(selected)}
                    aria-pressed={selected}
                  >
                    <span className="text-[11px] font-semibold leading-tight">{label}</span>
                    <span
                      className={`mt-0.5 text-[12px] font-bold tabular-nums ${
                        selected ? 'text-white/90' : hasAttention ? 'text-[#B91C1C]' : 'text-[#F47C8C]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <section>
        <h3
          className={
            selectedDayHasAttention
              ? `${apptGroupLabel} !text-[#B91C1C] before:bg-[#F47C8C]`
              : apptMonthLabel
          }
        >
          {selectedDayLabel}
        </h3>

        {selectedDayRows.length ? (
          <ul className={`mt-2 ${apptListGap}`}>
            {selectedDayRows.map((appointment) => {
              const overdue = isRequiresAttentionAppointment(appointment);
              const nearest = Boolean(nearestId && appointment.id === nearestId);
              return (
                <li key={appointment.id}>
                  <AppointmentsUpcomingRow
                    appointment={appointment}
                    onOpen={() => onOpen(appointment)}
                    overdue={overdue}
                    nearest={nearest}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={`${apptCalendarPanel} mt-2 text-center`}>
            <p className="text-[15px] font-semibold text-[#111827]">На этот день записей нет</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#6B7280]">
              Выберите другой день в календаре или измените фильтры
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
