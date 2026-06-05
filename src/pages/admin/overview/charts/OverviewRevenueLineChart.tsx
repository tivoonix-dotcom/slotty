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
import type { OverviewDayStat } from '../../../../features/master/model/demoMasterAppointments';
import { formatBynRu, formatDdMm } from '../overviewFormat';
import {
  buildTrendLinePath,
  chartAxisIndices,
  chartValue,
  focusChartStats,
  type TrendLineBounds,
} from '../overviewChartUtils';
import {
  computeProChartTrend,
  OverviewProChartBadge,
  OverviewProChartEmpty,
  OverviewProChartHeader,
  OverviewProChartTooltip,
  OverviewProChartXAxis,
  overviewProChartShellClassName,
  pickNearestChartIndex,
  proChartPalettePink,
  proChartPlotClass,
  proChartPlotHeight,
  proChartTooltipLeft,
} from './overviewProChartUi';

type ChartPoint = { x: number; y: number; v: number; index: number };

function formatHoverDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function revenueDomain(values: number[]): { min: number; max: number } {
  const active = values.filter((v) => v > 0);
  if (!active.length) return { min: 0, max: 100 };
  const min = Math.min(...active);
  const max = Math.max(...active);
  if (min === max) {
    const pad = Math.max(10, min * 0.15);
    return { min: Math.max(0, min - pad), max: max + pad };
  }
  const pad = (max - min) * 0.12;
  return { min: Math.max(0, min - pad), max: max + pad };
}

export function OverviewRevenueLineChart({
  stats,
  emptyHint = 'Дохода за период нет',
  size = 'large',
}: {
  stats: OverviewDayStat[];
  emptyHint?: string;
  size?: 'default' | 'large';
}) {
  const palette = proChartPalettePink;
  const gradientId = useId();
  const clipId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(320);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const displayStats = useMemo(() => focusChartStats(stats, 'revenue'), [stats]);
  const values = useMemo(() => displayStats.map((s) => chartValue(s, 'revenue')), [displayStats]);
  const hasAny = values.some((v) => v > 0);
  const yDomain = useMemo(() => revenueDomain(values), [values]);
  const axisIdx = chartAxisIndices(displayStats.length);
  const xLabels = axisIdx.map((i) => formatDdMm(displayStats[i]!.date));

  const chartHeight = proChartPlotHeight(size);
  const padX = 4;
  const padTop = 12;
  const padBottom = 8;
  const plotTop = padTop;
  const baselineY = chartHeight - padBottom;
  const plotInnerHeight = baselineY - plotTop;
  const lineBounds = useMemo(
    (): TrendLineBounds => ({ minY: plotTop, maxY: baselineY }),
    [baselineY, plotTop],
  );

  const points = useMemo((): ChartPoint[] => {
    const n = displayStats.length;
    const span = Math.max(0.001, yDomain.max - yDomain.min);
    return values.map((v, i) => {
      const x =
        n <= 1 ? chartWidth / 2 : padX + (i / Math.max(n - 1, 1)) * (chartWidth - padX * 2);
      const ratio = (v - yDomain.min) / span;
      const y = baselineY - ratio * plotInnerHeight;
      return { x, y, v, index: i };
    });
  }, [baselineY, chartWidth, displayStats.length, padX, plotInnerHeight, values, yDomain]);

  const linePath = useMemo(() => buildTrendLinePath(points, lineBounds), [lineBounds, points]);
  const areaPath = useMemo(() => {
    if (!points.length) return '';
    const last = points[points.length - 1]!;
    const first = points[0]!;
    return `${linePath} L ${last.x.toFixed(2)} ${baselineY} L ${first.x.toFixed(2)} ${baselineY} Z`;
  }, [baselineY, linePath, points]);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const sync = () => setChartWidth(Math.max(240, el.clientWidth));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setActiveIndex(null);
  }, [displayStats]);

  const pickIndex = useCallback(
    (clientX: number) => {
      const idx = pickNearestChartIndex(clientX, chartRef, displayStats.length, chartWidth, padX);
      if (idx !== null) setActiveIndex(idx);
    },
    [chartWidth, displayStats.length],
  );

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasAny) return;
    pickIndex(e.clientX);
  };

  const onPointerLeave = () => setActiveIndex(null);

  const headlineIndex = activeIndex ?? (values.length > 0 ? values.length - 1 : 0);
  const headlineValue = values[headlineIndex] ?? 0;
  const trend = useMemo(
    () => computeProChartTrend(values, (d) => formatBynRu(Math.abs(d))),
    [values],
  );

  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const activeStat = activeIndex !== null ? displayStats[activeIndex] : null;

  return (
    <div className={overviewProChartShellClassName()}>
      {hasAny ? (
        <OverviewProChartHeader
          headline={formatBynRu(headlineValue)}
          trend={activeIndex === null ? trend : undefined}
          subline={activeIndex !== null ? formatHoverDate(displayStats[headlineIndex]!.date) : 'за период'}
          badge={<OverviewProChartBadge>BYN</OverviewProChartBadge>}
        />
      ) : null}

      <div
        ref={chartRef}
        className={`relative w-full touch-none select-none overflow-hidden ${proChartPlotClass(size)} ${
          hasAny ? 'cursor-crosshair' : ''
        }`}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        role={hasAny ? 'img' : undefined}
        aria-label={hasAny ? 'График дохода' : undefined}
      >
        {!hasAny ? (
          <OverviewProChartEmpty hint={emptyHint} icon={<HiCloud className="mx-auto h-10 w-10" aria-hidden />} />
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
                  <stop offset="0%" stopColor={palette.fillTop} />
                  <stop offset="100%" stopColor={palette.fillBottom} />
                </linearGradient>
                <clipPath id={clipId}>
                  <rect x={0} y={plotTop} width={chartWidth} height={baselineY - plotTop} />
                </clipPath>
              </defs>

              <g clipPath={`url(#${clipId})`}>
                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke={palette.line}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(244,124,140,0.35))' }}
                />
              </g>

              {activePoint ? (
                <>
                  <line
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1={plotTop}
                    y2={baselineY}
                    stroke="#D1D5DB"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5"
                    fill="#FFFFFF"
                    stroke={palette.line}
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              ) : null}
            </svg>

            {activeStat && activePoint ? (
              <OverviewProChartTooltip
                anchorPercent={proChartTooltipLeft(activePoint.x, chartWidth)}
                primary={formatBynRu(activePoint.v)}
                secondary={formatHoverDate(activeStat.date)}
              />
            ) : null}
          </>
        )}
      </div>

      {hasAny ? <OverviewProChartXAxis labels={xLabels} /> : null}
    </div>
  );
}
