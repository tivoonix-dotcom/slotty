/** Дата и время для сообщений (ru-RU). */
export function formatAppointmentDateTime(startsAt: string | Date): { date: string; time: string } {
  const d = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}
