/**
 * Демо-сетка слотов для экрана записи и карточек «быстрых окон».
 * Должна совпадать с логикой `/zapis`, иначе `slot` в URL не матчится.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEMO_BOOKING_GRID_DAY_COUNT = 62;

export type DemoBookingGridSlot = {
  slotId: string;
  timeLabel: string;
};

export type DemoBookingGridDay = {
  id: string;
  date: string;
  dateLabel: string;
  fullDateLabel: string;
  monthLabel: string;
  dayNumber: string;
  weekdayLabel: string;
  times: DemoBookingGridSlot[];
};

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDaysDiff(date: Date, anchor: Date): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(anchor).getTime()) / DAY_MS);
}

export function formatDateLabel(date: Date, anchor: Date): string {
  const diff = getDaysDiff(date, anchor);

  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Завтра';

  const weekday = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
  }).format(date);

  const dayMonth = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(date);

  return `${capitalize(weekday.replace('.', ''))}, ${dayMonth.replace('.', '')}`;
}

export function formatFullDateLabel(date: Date, anchor: Date): string {
  const diff = getDaysDiff(date, anchor);

  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Завтра';

  return capitalize(
    new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date),
  );
}

export function formatMonthTitle(date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat('ru-RU', {
      month: 'long',
      year: 'numeric',
    }).format(date),
  );
}

function getDemoTimesForDate({
  date,
  dayIndex,
  masterId,
  serviceId,
  duration,
}: {
  date: Date;
  dayIndex: number;
  masterId: string;
  serviceId: string;
  duration: number;
}): string[] {
  const weekday = date.getDay();

  if ((dayIndex + masterId.length + serviceId.length) % 11 === 0) {
    return [];
  }

  const variants = [
    ['09:30', '12:00', '14:30', '17:00'],
    ['10:00', '13:30', '16:00', '18:30'],
    ['11:00', '15:30', '18:00'],
    ['09:00', '11:30', '14:00', '19:00'],
    ['10:30', '12:30', '16:30'],
  ];

  const sunday = ['12:00', '15:00'];
  const base = weekday === 0 ? sunday : variants[dayIndex % variants.length];

  if (duration >= 120) return base.slice(0, 2);
  if (duration >= 90) return base.slice(0, 3);

  return base;
}

export function buildBookingSlotDays({
  anchorDate,
  masterId,
  serviceId,
  duration,
}: {
  anchorDate: Date;
  masterId: string;
  serviceId: string;
  duration: number;
}): DemoBookingGridDay[] {
  return Array.from({ length: DEMO_BOOKING_GRID_DAY_COUNT }, (_, index) => {
    const date = addDays(anchorDate, index);
    const iso = toIsoDate(date);

    const times = getDemoTimesForDate({
      date,
      dayIndex: index,
      masterId,
      serviceId,
      duration,
    }).map((time) => ({
      slotId: `${serviceId}_${iso}_${time.replace(':', '')}`,
      timeLabel: time,
    }));

    return {
      id: `day_${iso}`,
      date: iso,
      dateLabel: formatDateLabel(date, anchorDate),
      fullDateLabel: formatFullDateLabel(date, anchorDate),
      monthLabel: formatMonthTitle(date),
      dayNumber: String(date.getDate()),
      weekdayLabel: capitalize(
        new Intl.DateTimeFormat('ru-RU', {
          weekday: 'short',
        })
          .format(date)
          .replace('.', ''),
      ),
      times,
    };
  });
}

export function pickFirstSlot(slotDays: DemoBookingGridDay[]): {
  day: DemoBookingGridDay;
  slot: DemoBookingGridSlot;
} | null {
  for (const day of slotDays) {
    const slot = day.times[0];

    if (slot) {
      return {
        day,
        slot,
      };
    }
  }

  return null;
}
