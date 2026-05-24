import { useMemo } from 'react';
import type { DemoBookingGridDay } from '../../features/booking/model/demoBookingSlotGrid';
import { buildCalendarMonths } from './bookingCalendar';
import { bookingSlotActive, bookingSlotIdle } from './bookingUi';

type Props = {
  slotDays: DemoBookingGridDay[];
  selectedDate: string | null;
  onPickDate: (dateIso: string) => void;
  className?: string;
};

export function BookingInlineCalendar({
  slotDays,
  selectedDate,
  onPickDate,
  className = '',
}: Props) {
  const calendarMonths = useMemo(() => buildCalendarMonths(slotDays), [slotDays]);

  if (!calendarMonths.length) return null;

  return (
    <div className={className}>
      {calendarMonths.map((month) => (
        <section key={month.key} className="mb-5 last:mb-0">
          <h3 className="mb-3 text-[16px] font-semibold capitalize text-[#111827] lg:text-[17px]">
            {month.title}
          </h3>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#9CA3AF] lg:text-[11px]">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 lg:gap-2">
            {month.cells.map((day, index) => {
              if (!day) return <div key={`e-${month.key}-${index}`} aria-hidden />;
              const active = day.date === selectedDate;
              const disabled = day.times.length === 0;
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPickDate(day.date)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-[10px] text-[14px] font-semibold transition lg:text-[15px] ${
                    active
                      ? bookingSlotActive
                      : disabled
                        ? 'cursor-not-allowed bg-[#FAFAFA] text-[#D1D5DB]'
                        : bookingSlotIdle
                  }`}
                >
                  {day.dayNumber}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
