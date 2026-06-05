import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HiCalendarDays } from 'react-icons/hi2';
import type { OverviewDayStat } from '../../../../features/master/model/demoMasterAppointments';
import { formatDdMm } from '../overviewFormat';
import {
  chartAxisIndices,
  chartValue,
  focusChartStats,
  formatVisitsCount,
  niceChartAxisMax,
} from '../overviewChartUtils';
import {
  computeProChartTrend,
  OverviewProChartEmpty,
  OverviewProChartHeader,
  OverviewProChartTooltip,
  OverviewProChartXAxis,
  overviewProChartShellClassName,
  pickNearestChartIndex,
  proChartPalettePink,
  proChartPlotClass,
  proChartTooltipAnchorPercent,
} from './overviewProChartUi';

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

function visitsDeltaLabel(delta: number): string {
  const abs = Math.abs(Math.round(delta));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  let word = 'записей';
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) word = 'запись';
    else if (mod10 >= 2 && mod10 <= 4) word = 'записи';
  }
  return `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${abs} ${word}`;
}

export function OverviewVisitsBarChart({
  stats,
  emptyHint = 'Записей за период нет',
  size = 'large',
}: {
  stats: OverviewDayStat[];
  emptyHint?: string;
  size?: 'default' | 'large';
}) {
  const palette = proChartPalettePink;
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const displayStats = useMemo(() => focusChartStats(stats, 'visits'), [stats]);
  const values = useMemo(() => displayStats.map((s) => chartValue(s, 'visits')), [displayStats]);
  const hasStats = displayStats.length > 0;
  const hasAny = values.some((v) => v > 0);
  const axisMax = niceChartAxisMax(Math.max(...values, 0), 'visits');
  const axisIdx = chartAxisIndices(displayStats.length);
  const xLabels = axisIdx.map((i) => formatDdMm(displayStats[i]!.date));
  const totalVisits = values.reduce((a, b) => a + b, 0);

  const pickIndex = useCallback(
    (clientX: number) => {
      const idx = pickNearestChartIndex(clientX, chartRef, displayStats.length);
      if (idx !== null) setActiveIndex(idx);
    },
    [displayStats.length],
  );

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasStats) return;
    pickIndex(e.clientX);
  };

  const onPointerLeave = () => setActiveIndex(null);

  const headlineIndex = activeIndex ?? (values.length > 0 ? values.length - 1 : 0);
  const headlineValue = activeIndex !== null ? (values[headlineIndex] ?? 0) : totalVisits;
  const trend = useMemo(
    () => computeProChartTrend(values, (d) => visitsDeltaLabel(d)),
    [values],
  );

  const activeStat = activeIndex !== null ? displayStats[activeIndex] : null;
  const activeValue = activeIndex !== null ? (values[activeIndex] ?? 0) : 0;

  useEffect(() => {
    setActiveIndex(null);
  }, [displayStats]);

  return (
    <div className={overviewProChartShellClassName()}>
      {hasAny ? (
        <OverviewProChartHeader
          headline={formatVisitsCount(headlineValue)}
          trend={activeIndex === null ? trend : undefined}
          subline={
            activeIndex !== null
              ? formatHoverDate(displayStats[headlineIndex]!.date)
              : 'всего за период'
          }
        />
      ) : null}

      <div
        ref={chartRef}
        className={`relative w-full touch-none select-none overflow-hidden ${proChartPlotClass(size)} ${
          hasStats ? 'cursor-crosshair' : ''
        }`}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        role={hasStats ? 'img' : undefined}
        aria-label={hasStats ? 'График записей по дням' : undefined}
      >
        {!hasAny ? (
          <OverviewProChartEmpty
            hint={emptyHint}
            icon={<HiCalendarDays className="mx-auto h-10 w-10" aria-hidden />}
          />
        ) : (
          <>
            <div className="relative flex h-full items-end gap-[4px] px-1 pb-1 pt-4">
              {displayStats.map((s, i) => {
                const v = values[i] ?? 0;
                const h = axisMax > 0 ? Math.max((v / axisMax) * 100, v > 0 ? 6 : 0) : 0;
                const isActive = activeIndex === i;
                const barWidth = displayStats.length <= 4 ? 24 : 10;

                return (
                  <div key={s.date} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
                    {isActive ? (
                      <div className="pointer-events-none absolute inset-y-3 left-1/2 z-0 w-px -translate-x-1/2 border-l border-dashed border-[#D1D5DB]" />
                    ) : null}
                    <div
                      className={`relative z-10 mx-auto rounded-t-[6px] transition-all duration-150 ${
                        v > 0
                          ? isActive
                            ? `bg-gradient-to-t ${palette.barActive}`
                            : `bg-gradient-to-t ${palette.barIdle} opacity-85`
                          : 'bg-transparent'
                      }`}
                      style={{
                        width: `min(100%, ${barWidth}px)`,
                        height: `${h}%`,
                        minHeight: v > 0 ? 6 : 0,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {activeStat && activeIndex !== null ? (
              <OverviewProChartTooltip
                anchorPercent={proChartTooltipAnchorPercent(activeIndex, displayStats.length)}
                primary={formatVisitsCount(activeValue)}
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
