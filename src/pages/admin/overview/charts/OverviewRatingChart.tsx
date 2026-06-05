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
import type { RatingDayStat } from '../overviewReputationDemo';
import { formatDdMm } from '../overviewFormat';
import { buildTrendLinePath, type TrendLineBounds } from '../overviewChartUtils';
import {
  OverviewProChartBadge,
  OverviewProChartEmpty,
  OverviewProChartHeader,
  OverviewProChartTooltip,
  OverviewProChartXAxis,
  overviewProChartShellClassName,
  proChartPlotClass,
  proChartPlotHeight,
  proChartTooltipLeft,
} from './overviewProChartUi';
import {
  ratingToneFromValue,
  ratingToneUi,
  type RatingTone,
} from '../overviewRatingTone';

type ChartPoint = { x: number; y: number; v: number; date: string };

const RATING_MAX = 5;
const RATING_AXIS_MIN = 3;
const PLOT_INSET = 10;

function ratingYDomain(values: number[]): { min: number; max: number } {
  if (!values.length) return { min: RATING_AXIS_MIN, max: RATING_MAX };
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const spread = dataMax - dataMin;
  const min =
    spread < 0.35
      ? RATING_AXIS_MIN
      : Math.max(1, Math.min(RATING_AXIS_MIN, Math.floor((dataMin - 0.25) * 2) / 2));
  return { min, max: RATING_MAX };
}

function ratingToPlotY(
  value: number,
  domain: { min: number; max: number },
  plotTop: number,
  plotBottom: number,
): number {
  const span = Math.max(0.5, domain.max - domain.min);
  const norm = (Math.min(domain.max, Math.max(domain.min, value)) - domain.min) / span;
  const inner = plotBottom - plotTop - PLOT_INSET * 2;
  return plotBottom - PLOT_INSET - norm * inner;
}

function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  return [0, Math.floor((n - 1) / 2), n - 1];
}

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

function buildSmoothLinePath(points: ChartPoint[], bounds: TrendLineBounds): string {
  return buildTrendLinePath(points, bounds);
}

export function OverviewRatingChart({
  stats,
  emptyHint = 'Недостаточно данных для графика',
  tone: toneProp,
  size = 'default',
}: {
  stats: RatingDayStat[];
  emptyHint?: string;
  tone?: RatingTone;
  size?: 'default' | 'large';
}) {
  const gradientId = useId();
  const clipId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(320);
  const sparseChart = stats.length > 0 && stats.length < 3;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (sparseChart) setActiveIndex(stats.length - 1);
  }, [sparseChart, stats.length, stats[stats.length - 1]?.date]);

  const values = stats.map((s) => s.averageRating);
  const yDomain = useMemo(() => ratingYDomain(values), [values]);
  const hasData = stats.length > 0;
  const chartHeight = proChartPlotHeight(size);
  const chartBoxClass = proChartPlotClass(size);
  const padXLeft = 8;
  const padXRight = 8;
  const padY = 16;
  const plotTop = padY;
  const plotBottom = chartHeight - padY;
  const plotWidth = Math.max(120, chartWidth - padXLeft - padXRight);
  const lineBounds = useMemo(
    (): TrendLineBounds => ({ minY: plotTop, maxY: plotBottom }),
    [plotBottom, plotTop],
  );

  const seriesTone = useMemo(() => {
    if (toneProp) return toneProp;
    if (!values.length) return 'empty' as RatingTone;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return ratingToneFromValue(avg);
  }, [toneProp, values]);

  const palette = ratingToneUi[seriesTone];

  const points = useMemo((): ChartPoint[] => {
    return values.map((v, i) => {
      const x =
        values.length <= 1
          ? padXLeft + plotWidth / 2
          : padXLeft + (i / (values.length - 1)) * plotWidth;
      const y = ratingToPlotY(v, yDomain, plotTop, plotBottom);
      return { x, y, v, date: stats[i]?.date ?? '' };
    });
  }, [padXLeft, plotBottom, plotTop, plotWidth, stats, values, yDomain]);

  const linePath = useMemo(() => buildSmoothLinePath(points, lineBounds), [lineBounds, points]);
  const showArea = points.length >= 3;
  const areaPath = useMemo(() => {
    if (!showArea || !points.length) return '';
    const last = points[points.length - 1]!;
    const first = points[0]!;
    return `${linePath} L ${last.x.toFixed(2)} ${plotBottom} L ${first.x.toFixed(2)} ${plotBottom} Z`;
  }, [linePath, plotBottom, points, showArea]);

  const gridLines = useMemo(() => {
    return [3, 4, 5]
      .filter((mark) => mark >= yDomain.min && mark <= yDomain.max)
      .map((mark) => ({
        mark,
        y: ratingToPlotY(mark, yDomain, plotTop, plotBottom),
      }));
  }, [plotBottom, plotTop, yDomain]);

  const axisIdx = chartAxisIndices(stats.length);

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
      const relX = padXLeft + ((clientX - rect.left) / rect.width) * plotWidth;
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
    [padXLeft, plotWidth, points],
  );

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasData) return;
    pickIndex(e.clientX);
  };

  const onPointerLeave = () => {
    if (!sparseChart) setActiveIndex(null);
  };

  const active = activeIndex !== null ? points[activeIndex] : null;
  const activeStat = activeIndex !== null ? stats[activeIndex] : null;

  const headlineRating = active?.v ?? values[values.length - 1] ?? 0;
  const firstRating = values.find((v) => v > 0) ?? values[0] ?? 0;
  const lastRating = values[values.length - 1] ?? 0;
  const ratingDelta = lastRating - firstRating;

  return (
    <div className={overviewProChartShellClassName()}>
      {hasData ? (
        <OverviewProChartHeader
          headline={`${headlineRating.toFixed(1)}★`}
          subline={
            activeStat
              ? formatHoverDate(activeStat.date)
              : stats.length >= 2 && ratingDelta !== 0
                ? `${ratingDelta > 0 ? '+' : ''}${ratingDelta.toFixed(1)} за период`
                : 'средняя оценка'
          }
          badge={<OverviewProChartBadge>из 5</OverviewProChartBadge>}
        />
      ) : null}

      <div
        ref={chartRef}
        className={`relative w-full touch-none select-none overflow-hidden ${chartBoxClass} ${
          hasData ? 'cursor-crosshair' : ''
        }`}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        role={hasData ? 'img' : undefined}
        aria-label={hasData ? 'График динамики рейтинга' : undefined}
      >
        {!hasData ? (
          <OverviewProChartEmpty
            hint={emptyHint}
            icon={<HiCloud className="mx-auto h-10 w-10" aria-hidden />}
          />
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
                  <stop offset="0%" stopColor={palette.chartFillTop} stopOpacity="1" />
                  <stop offset="55%" stopColor={palette.chartFillMid} stopOpacity="1" />
                  <stop offset="100%" stopColor={palette.chartStroke} stopOpacity="0" />
                </linearGradient>
                <clipPath id={clipId}>
                  <rect x={0} y={plotTop} width={chartWidth} height={plotBottom - plotTop} />
                </clipPath>
              </defs>

              {gridLines.map((row) => (
                <line
                  key={row.mark}
                  x1={padXLeft}
                  x2={chartWidth - padXRight}
                  y1={row.y}
                  y2={row.y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {showArea ? (
                <g clipPath={`url(#${clipId})`}>
                  <path d={areaPath} fill={`url(#${gradientId})`} opacity="0.72" />
                </g>
              ) : null}

              {points.length === 1 ? (
                <line
                  x1={padXLeft}
                  x2={chartWidth - padXRight}
                  y1={points[0]!.y}
                  y2={points[0]!.y}
                  stroke={palette.chartStroke}
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  opacity="0.45"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}

              <g clipPath={`url(#${clipId})`}>
                {points.length >= 2 ? (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={palette.chartStroke}
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
              </g>

              {points.map((p, i) => {
                const showMarker = sparseChart || activeIndex === i;
                if (!showMarker) return null;
                return (
                  <g key={`${p.date}-${i}`}>
                    <circle cx={p.x} cy={p.y} r="8" fill={palette.chartStroke} opacity="0.12" />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5.5"
                      fill="#FFFFFF"
                      stroke={palette.chartStroke}
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}

              {active && activeIndex !== null && !sparseChart ? (
                <line
                  x1={active.x}
                  x2={active.x}
                  y1={plotTop}
                  y2={plotBottom}
                  stroke="#D1D5DB"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ) : null}
            </svg>

            {active && activeStat ? (
              <OverviewProChartTooltip
                anchorPercent={proChartTooltipLeft(active.x, chartWidth)}
                primary={`${active.v.toFixed(1)}★`}
                secondary={formatHoverDate(activeStat.date)}
              />
            ) : null}

            {sparseChart ? (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 max-w-[18rem] -translate-x-1/2 text-center">
                <p className="text-[11px] font-medium leading-snug text-[#9CA3AF]">
                  {stats.length === 1
                    ? 'Пока один отзыв — график вырастет с новыми оценками'
                    : 'Мало точек — динамика уточнится позже'}
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {stats.length > 0 ? (
        <OverviewProChartXAxis labels={axisIdx.map((i) => formatDdMm(stats[i]!.date))} />
      ) : null}
    </div>
  );
}
