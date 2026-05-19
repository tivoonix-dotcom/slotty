/** Даты/время для мастеров Slotty (Беларусь). */

const TZ = 'Europe/Minsk';

export function dateKeyMinsk(iso: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
}

export function formatHmMinsk(iso: Date | string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function formatDayLabelMinsk(dayKey: string, todayKey: string, tomorrowKey: string): string {
  if (dayKey === todayKey) return 'сегодня';
  if (dayKey === tomorrowKey) return 'завтра';
  const d = new Date(`${dayKey}T12:00:00`);
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
  }).format(d);
}

export function addDaysToDateKey(dayKey: string, days: number): string {
  const d = new Date(`${dayKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dateKeyMinsk(d);
}
