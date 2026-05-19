const DISPLAY_TZ = 'Europe/Minsk';

/** Дата и время для сообщений (ru-RU, часовой пояс Минск). */
export function formatAppointmentDateTime(startsAt: string | Date): { date: string; time: string } {
  const d = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  const date = d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: DISPLAY_TZ,
  });
  const time = d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DISPLAY_TZ,
  });
  return { date, time };
}
