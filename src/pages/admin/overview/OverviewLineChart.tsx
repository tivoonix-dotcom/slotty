import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HiCloud } from 'react-icons/hi2';
import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';
import { formatBynRu, formatDdMm, formatDdMmYyyy } from './overviewFormat';

type ChartPoint = { x: number; y: number; v: number; date: string };

function chartValues(stats: OverviewDayStat[], mode: 'revenue' | 'visits') {
  return stats.map((s) => (mode === 'revenue' ? s.completedRevenue : s.activeVisits));
}

function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  return [0, Math.floor((n - 1) / 2), n - 1];
}

function formatChartValue(v: number, mode: 'revenue' | 'visits'): string {
  if (mode === 'revenue') return formatBynRu(v);
  const n = Math.round(v);
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = 'записей';
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) word = 'запись';
    else if (mod10 >= 2 && mod10 <= 4) word = 'записи';
  }
  return `${n} ${word}`;
}

function buildSmoothLinePath(points: ChartPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function OverviewLineChart({
  stats,
  mode,
  emptyHint,
  size = 'default',
}: {
  stats: OverviewDayStat[];
  mode: 'revenue' | 'visits';
  emptyHint: string;
  /** Крупнее на вкладке «Доход». */
  size?: 'default' | 'large';
}) {
  const gradientId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(320);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const values = chartValues(stats, mode);
  const hasData = stats.length > 0;
  const max = Math.max(1, ...values);
  const axisIdx = chartAxisIndices(stats.length);

  const chartHeight = size === 'large' ? 220 : 168;
  const chartBoxClass = size === 'large' ? 'h-[14.5rem]' : 'h-[11.5rem]';
  const padX = 4;
  const padY = 20;
  const baseline = chartHeight - padY;
  const idleHint =
    mode === 'revenue' ? 'Наведите на график дохода' : 'Наведите на график';

  const points = useMemo((): ChartPoint[] => {
    return values.map((v, i) => {
      const x =
        values.length <= 1
          ? chartWidth / 2
          : padX + (i / (values.length - 1)) * (chartWidth - padX * 2);
      const y = baseline - (v / max) * (chartHeight - padY * 2);
      return { x, y, v, date: stats[i]?.date ?? '' };
    });
  }, [baseline, chartHeight, chartWidth, max, padX, padY, stats, values]);

  const linePath = useMemo(() => buildSmoothLinePath(points), [points]);
  const areaPath = useMemo(() => {
    if (!points.length) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x.toFixed(2)} ${baseline} L ${first.x.toFixed(2)} ${baseline} Z`;
  }, [baseline, linePath, points]);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    const sync = () => setChartWidth(Math.max(240, el.clientWidth));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pickIndex = useCallback(
    (clientX: number) => {
      if (!points.length || !chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      const relX = ((clientX - rect.left) / rect.width) * chartWidth;
      let best = 0;
      let bestDist = Infinity;
      points.forEach((p, i) => {
        const d = Math.abs(p.x - relX);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActiveIndex(best);
    },
    [chartWidth, points],
  );

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasData) return;
    pickIndex(e.clientX);
  };

  const onPointerLeave = () => setActiveIndex(null);

  const active = activeIndex !== null ? points[activeIndex] : null;
  const activeStat = activeIndex !== null ? stats[activeIndex] : null;

  const tooltipLeft =
    active && chartWidth > 0
      ? `${Math.min(92, Math.max(8, (active.x / chartWidth) * 100))}%`
      : '50%';

  return (
    <div className="min-w-0">
      <div
        ref={chartRef}
        className={`relative ${chartBoxClass} w-full min-w-0 touch-none select-none overflow-hidden rounded-[20px] bg-gradient-to-b from-[#FFF5F7] to-white ${
          hasData ? 'cursor-crosshair' : ''
        }`}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        role={hasData ? 'img' : undefined}
        aria-label={hasData ? 'График динамики' : undefined}
      >
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <HiCloud className="h-10 w-10 text-[#D1D5DB]" aria-hidden />
            <p className="text-[13px] font-semibold text-[#6B7280]">{emptyHint}</p>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#F47C8C" stopOpacity="0.35" />
                  <stop offset="55%" stopColor="#F9A8B4" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#F47C8C" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path
                d={linePath}
                fill="none"
                stroke="#F47C8C"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {active ? (
                <>
                  <line
                    x1={active.x}
                    x2={active.x}
                    y1={padY}
                    y2={baseline}
                    stroke="#F9A8B4"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.9"
                  />
                  <circle cx={active.x} cy={active.y} r="9" fill="#F47C8C" opacity="0.18" />
                  <circle cx={active.x} cy={active.y} r="5.5" fill="#FFFFFF" />
                  <circle cx={active.x} cy={active.y} r="4" fill="#F47C8C" />
                </>
              ) : null}
            </svg>

            {active && activeStat ? (
              <div
                className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-[14px] border border-[#FDE8ED] bg-white/95 px-3 py-2 text-center shadow-[0_10px_28px_rgba(244,124,140,0.22)] backdrop-blur-sm"
                style={{ left: tooltipLeft }}
              >
                <p className="text-[15px] font-bold tabular-nums tracking-[-0.03em] text-[#F47C8C]">
                  {formatChartValue(active.v, mode)}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#6B7280]">
                  {formatDdMmYyyy(activeStat.date)}
                </p>
              </div>
            ) : (
              <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-[11px] font-medium text-[#9CA3AF]">
                {idleHint}
              </p>
            )}
          </>
        )}
      </div>

      {stats.length > 0 ? (
        <div className="mt-3 flex justify-between px-0.5 text-[11px] font-semibold text-[#9CA3AF]">
          {axisIdx.map((i) => (
            <span key={`${stats[i].date}-${mode}`} className="tabular-nums">
              {formatDdMm(stats[i].date)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
