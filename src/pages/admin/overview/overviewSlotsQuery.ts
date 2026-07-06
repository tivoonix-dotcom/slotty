/** Слоты с начала сегодняшнего дня — достаточно для overview и profile completion. */
export function overviewSlotsQueryFromToday(): { from: string; limit: number } {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return { from: d.toISOString(), limit: 300 };
}
