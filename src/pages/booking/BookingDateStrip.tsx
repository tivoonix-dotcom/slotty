import { useCallback, useEffect, useRef } from 'react';
import { HiCalendarDays, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import type { DemoBookingGridDay } from '../../features/booking/model/demoBookingSlotGrid';
import {
  bookingDateCalendarBtn,
  bookingDateCalendarBtnIdle,
  bookingDateCalendarBtnOpen,
  bookingDateCardActive,
  bookingDateCardDisabled,
  bookingDateCardIdle,
  bookingDateStripArrowBtn,
} from './bookingDateTimeUi';

function bottomLabel(day: DemoBookingGridDay): string {
  if (day.dateLabel === 'Сегодня') return 'сегодня';
  if (day.dateLabel === 'Завтра') return 'завтра';

  const [year, month] = day.date.split('-').map(Number);
  if (!year || !month) return day.dateLabel;

  return new Intl.DateTimeFormat('ru-RU', { month: 'short' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '');
}

type Props = {
  days: DemoBookingGridDay[];
  selectedDate: string | null;
  calendarOpen?: boolean;
  onPickDate: (dateIso: string) => void;
  onOpenCalendar: () => void;
};

export function BookingDateStrip({
  days,
  selectedDate,
  calendarOpen = false,
  onPickDate,
  onOpenCalendar,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByCards = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-booking-date="${selectedDate}"]`);
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDate]);

  return (
    <div className="flex min-w-0 items-stretch gap-1.5">
      <button
        type="button"
        aria-label="Прокрутить даты назад"
        onClick={() => scrollByCards(-1)}
        className={bookingDateStripArrowBtn}
      >
        <HiChevronLeft className="h-5 w-5" aria-hidden />
      </button>

      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((day) => {
          const hasTimes = day.times.length > 0;
          const active = day.date === selectedDate;
          const bottom = bottomLabel(day);

          return (
            <button
              key={day.id}
              type="button"
              data-booking-date={day.date}
              disabled={!hasTimes}
              aria-pressed={active}
              onClick={() => onPickDate(day.date)}
              className={`flex h-[5.25rem] w-[4.5rem] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-[14px] border px-1 transition active:scale-[0.98] disabled:pointer-events-none ${
                !hasTimes
                  ? bookingDateCardDisabled
                  : active
                    ? bookingDateCardActive
                    : bookingDateCardIdle
              }`}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide ${
                  active && hasTimes ? 'text-white/95' : 'text-[#6B7280]'
                }`}
              >
                {day.weekdayLabel}
              </span>
              <span
                className={`text-[22px] font-bold leading-none ${
                  active && hasTimes ? 'text-white' : 'text-[#111827]'
                }`}
              >
                {day.dayNumber}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  active && hasTimes ? 'text-white/90' : 'text-[#9CA3AF]'
                }`}
              >
                {bottom}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Прокрутить даты вперёд"
        onClick={() => scrollByCards(1)}
        className={bookingDateStripArrowBtn}
      >
        <HiChevronRight className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        aria-label="Полный календарь"
        aria-expanded={calendarOpen}
        onClick={onOpenCalendar}
        className={`${bookingDateCalendarBtn} ${
          calendarOpen ? bookingDateCalendarBtnOpen : bookingDateCalendarBtnIdle
        }`}
      >
        <HiCalendarDays className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}
