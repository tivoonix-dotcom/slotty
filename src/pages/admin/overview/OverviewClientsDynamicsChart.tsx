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
import type { ClientDayStat } from './overviewAnalytics';
import { formatDdMm, formatDdMmYyyy } from './overviewFormat';

type ChartPoint = { x: number; y: number; v: number };

function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  return [0, Math.floor((n - 1) / 2), n - 1];
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

function clientsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'клиентов';
  if (mod10 === 1) return 'клиент';
  if (mod10 >= 2 && mod10 <= 4) return 'клиента';
  return 'клиентов';
}

export function OverviewClientsDynamicsChart({
  stats,
  emptyHint = 'Клиентов за период нет',
}: {
  stats: ClientDayStat[];
  emptyHint?: string;
}) {
  const newGradientId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(320);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasData = stats.length > 0;
  const hasAny = stats.some((s) => s.newClients > 0 || s.repeatClients > 0);
  const max = Math.max(
    1,
    ...stats.flatMap((s) => [s.newClients, s.repeatClients]),
  );
  const axisIdx = chartAxisIndices(stats.length);

  const chartHeight = 220;
  const padX = 4;
  const padY = 24;
  const baseline = chartHeight - padY;

  const { newPoints, repeatPoints } = useMemo(() => {
    const newPoints: ChartPoint[] = [];
    const repeatPoints: ChartPoint[] = [];

    stats.forEach((s, i) => {
      const x =
        stats.length <= 1
          ? chartWidth / 2
          : padX + (i / (stats.length - 1)) * (chartWidth - padX * 2);
      newPoints.push({
        x,
        y: baseline - (s.newClients / max) * (chartHeight - padY * 2),
        v: s.newClients,
      });
      repeatPoints.push({
        x,
        y: baseline - (s.repeatClients / max) * (chartHeight - padY * 2),
        v: s.repeatClients,
      });
    });

    return { newPoints, repeatPoints };
  }, [baseline, chartHeight, chartWidth, max, padX, padY, stats]);

  const newLinePath = useMemo(() => buildSmoothLinePath(newPoints), [newPoints]);
  const repeatLinePath = useMemo(() => buildSmoothLinePath(repeatPoints), [repeatPoints]);

  const newAreaPath = useMemo(() => {
    if (!newPoints.length) return '';
    const last = newPoints[newPoints.length - 1];
    const first = newPoints[0];
    return `${newLinePath} L ${last.x.toFixed(2)} ${baseline} L ${first.x.toFixed(2)} ${baseline} Z`;
  }, [baseline, newLinePath, newPoints]);

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
      if (!newPoints.length || !chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      const relX = ((clientX - rect.left) / rect.width) * chartWidth;
      let best = 0;
      let bestDist = Infinity;
      newPoints.forEach((p, i) => {
        const d = Math.abs(p.x - relX);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActiveIndex(best);
    },
    [chartWidth, newPoints],
  );

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasData) return;
    pickIndex(e.clientX);
  };

  const onPointerLeave = () => setActiveIndex(null);

  const activeDay = activeIndex !== null ? stats[activeIndex] : null;
  const activeNew = activeIndex !== null ? newPoints[activeIndex] : null;
  const activeRepeat = activeIndex !== null ? repeatPoints[activeIndex] : null;

  const tooltipLeft =
    activeNew && chartWidth > 0
      ? `${Math.min(92, Math.max(8, (activeNew.x / chartWidth) * 100))}%`
      : '50%';

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-3 px-0.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6B7280]">
          <span className="h-2 w-2 rounded-full bg-[#F47C8C]" aria-hidden />
          Новые
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6B7280]">
          <span className="h-2 w-2 rounded-full bg-[#A78BFA]" aria-hidden />
          Повторные
        </span>
      </div>

      <div
        ref={chartRef}
        className={`relative h-[14.5rem] w-full min-w-0 touch-none select-none overflow-hidden rounded-[20px] bg-gradient-to-b from-[#FFF5F7] to-white ${
          hasData ? 'cursor-crosshair' : ''
        }`}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        role={hasData ? 'img' : undefined}
        aria-label={hasData ? 'График динамики клиентов' : undefined}
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
                <linearGradient id={newGradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#F47C8C" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#F47C8C" stopOpacity="0" />
                </linearGradient>
              </defs>

              {hasAny ? <path d={newAreaPath} fill={`url(#${newGradientId})`} /> : null}
              <path
                d={repeatLinePath}
                fill="none"
                stroke="#A78BFA"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                opacity={hasAny ? 1 : 0.35}
              />
              <path
                d={newLinePath}
                fill="none"
                stroke="#F47C8C"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                opacity={hasAny ? 1 : 0.35}
              />

              {activeNew && activeRepeat ? (
                <>
                  <line
                    x1={activeNew.x}
                    x2={activeNew.x}
                    y1={padY}
                    y2={baseline}
                    stroke="#F9A8B4"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.9"
                  />
                  <circle cx={activeNew.x} cy={activeNew.y} r="8" fill="#F47C8C" opacity="0.15" />
                  <circle cx={activeNew.x} cy={activeNew.y} r="4" fill="#F47C8C" />
                  <circle cx={activeRepeat.x} cy={activeRepeat.y} r="8" fill="#A78BFA" opacity="0.15" />
                  <circle cx={activeRepeat.x} cy={activeRepeat.y} r="4" fill="#A78BFA" />
                </>
              ) : null}
            </svg>

            {activeDay && activeNew ? (
              <div
                className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-[14px] border border-[#FDE8ED] bg-white/95 px-3 py-2 text-center shadow-[0_10px_28px_rgba(244,124,140,0.2)] backdrop-blur-sm"
                style={{ left: tooltipLeft }}
              >
                <p className="text-[13px] font-bold leading-snug text-[#111827]">
                  <span className="text-[#F47C8C]">
                    {activeDay.newClients} {clientsLabel(activeDay.newClients)}
                  </span>
                  <span className="text-[#9CA3AF]"> · </span>
                  <span className="text-[#A78BFA]">
                    {activeDay.repeatClients} повтор.
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#6B7280]">
                  {formatDdMmYyyy(activeDay.date)}
                </p>
              </div>
            ) : (
              <p className="pointer-events-none absolute inset-x-0 top-8 text-center text-[11px] font-medium text-[#9CA3AF]">
                Наведите на график клиентов
              </p>
            )}
          </>
        )}
      </div>

      {stats.length > 0 ? (
        <div className="mt-3 flex justify-between px-0.5 text-[11px] font-semibold text-[#9CA3AF]">
          {axisIdx.map((i) => (
            <span key={stats[i].date} className="tabular-nums">
              {formatDdMm(stats[i].date)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
