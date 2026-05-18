import {
  formatMonthTitle,
  toIsoDate,
  type DemoBookingGridDay as BookingSlotDay,
} from '../../features/booking/model/demoBookingSlotGrid';

export type CalendarMonth = {
  key: string;
  title: string;
  cells: Array<BookingSlotDay | null>;
};

export function buildCalendarMonths(slotDays: BookingSlotDay[]): CalendarMonth[] {
  const byDate = new Map(slotDays.map((day) => [day.date, day]));
  const monthKeys = Array.from(new Set(slotDays.map((day) => day.date.slice(0, 7))));

  return monthKeys.map((monthKey) => {
    const [yearRaw, monthRaw] = monthKey.split('-');
    const year = Number(yearRaw);
    const monthIndex = Number(monthRaw) - 1;
    const firstDate = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const leadingEmptyCells = (firstDate.getDay() + 6) % 7;

    const cells: Array<BookingSlotDay | null> = Array.from(
      { length: leadingEmptyCells },
      () => null,
    );

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, monthIndex, day);
      const iso = toIsoDate(date);
      cells.push(byDate.get(iso) ?? null);
    }

    return {
      key: monthKey,
      title: formatMonthTitle(firstDate),
      cells,
    };
  });
}
