/** Границы «сегодня» в локальном календаре для запроса слотов (ISO → сервер как timestamptz). */
export function getLocalTodayIsoRange(): { from: string; to: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}
