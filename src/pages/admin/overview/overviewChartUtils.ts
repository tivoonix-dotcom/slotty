import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';

export type OverviewChartMode = 'revenue' | 'visits';

export function chartValue(stat: OverviewDayStat, mode: OverviewChartMode): number {
  return mode === 'revenue' ? stat.completedRevenue : stat.activeVisits;
}

/** Округлённый верх шкалы — без дублей «1, 1, 0, 0». */
export function niceChartAxisMax(rawMax: number, mode: OverviewChartMode): number {
  if (rawMax <= 0) return mode === 'revenue' ? 100 : 1;
  if (mode === 'visits') {
    if (rawMax <= 1) return 1;
    if (rawMax <= 5) return Math.ceil(rawMax);
    const step = rawMax <= 10 ? 2 : rawMax <= 20 ? 5 : 10;
    return Math.ceil(rawMax / step) * step;
  }
  if (rawMax <= 50) return 50;
  if (rawMax <= 100) return 100;
  if (rawMax <= 200) return Math.ceil(rawMax / 50) * 50;
  if (rawMax <= 500) return Math.ceil(rawMax / 100) * 100;
  if (rawMax <= 1000) return Math.ceil(rawMax / 200) * 200;
  return Math.ceil(rawMax / 400) * 400;
}

export function buildChartYTicks(axisMax: number, mode: OverviewChartMode): number[] {
  if (axisMax <= 1) return [0, 1];
  if (mode === 'visits' && axisMax <= 6) {
    return Array.from({ length: axisMax + 1 }, (_, i) => i);
  }
  const tickCount = 4;
  const ticks = new Set<number>();
  for (let i = 0; i <= tickCount; i += 1) {
    ticks.add(Math.round((axisMax * i) / tickCount));
  }
  return [...ticks].sort((a, b) => a - b);
}

export function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  if (n <= 7) return Array.from({ length: n }, (_, i) => i);
  const mid = Math.floor((n - 1) / 2);
  return [0, mid, n - 1];
}

/** При редких визитах сжимаем ось X к активным дням — столбцы читаются. */
export function focusChartStats(stats: OverviewDayStat[], mode: OverviewChartMode): OverviewDayStat[] {
  if (stats.length <= 7) return stats;

  const values = stats.map((s) => chartValue(s, mode));
  const firstActive = values.findIndex((v) => v > 0);
  if (firstActive < 0) return stats.slice(-7);

  let lastActive = values.length - 1;
  while (lastActive > firstActive && values[lastActive]! <= 0) {
    lastActive -= 1;
  }

  const activeSpan = lastActive - firstActive + 1;
  if (activeSpan >= stats.length * 0.55) return stats;

  const pad = Math.max(1, Math.min(3, Math.floor(activeSpan * 0.2)));
  const start = Math.max(0, firstActive - pad);
  const end = Math.min(stats.length - 1, lastActive + pad);
  const slice = stats.slice(start, end + 1);
  return slice.length >= 2 ? slice : stats;
}

export type TrendLineBounds = { minY: number; maxY: number };

function clampTrendY(y: number, bounds?: TrendLineBounds): number {
  if (!bounds) return y;
  return Math.min(bounds.maxY, Math.max(bounds.minY, y));
}

export function buildTrendLinePath(
  points: { x: number; y: number }[],
  bounds?: TrendLineBounds,
): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0]!;
    const y = clampTrendY(p.y, bounds);
    return `M ${(p.x - 8).toFixed(2)} ${y.toFixed(2)} L ${(p.x + 8).toFixed(2)} ${y.toFixed(2)}`;
  }
  // На коротких рядах сплайн «ныряет» ниже нуля — только прямые сегменты.
  if (points.length <= 4) {
    return points
      .map((p, i) => {
        const y = clampTrendY(p.y, bounds);
        return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }

  let d = `M ${points[0]!.x.toFixed(2)} ${clampTrendY(points[0]!.y, bounds).toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clampTrendY(p1.y + (p2.y - p0.y) / 6, bounds);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clampTrendY(p2.y - (p3.y - p1.y) / 6, bounds);
    const endY = clampTrendY(p2.y, bounds);
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${endY.toFixed(2)}`;
  }
  return d;
}

export function formatVisitsCount(n: number): string {
  const v = Math.round(n);
  const mod10 = v % 10;
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${v} записей`;
  if (mod10 === 1) return `${v} запись`;
  if (mod10 >= 2 && mod10 <= 4) return `${v} записи`;
  return `${v} записей`;
}
