import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { HiCloud } from 'react-icons/hi2';
import type { ClientDayStat } from '../overviewAnalytics';
import { formatDdMm } from '../overviewFormat';
import {
  OverviewProChartEmpty,
  OverviewProChartHeader,
  OverviewProChartTooltip,
  OverviewProChartXAxis,
  overviewProChartShellClassName,
  pickNearestChartIndex,
  proChartPlotClass,
  proChartTooltipAnchorPercent,
} from './overviewProChartUi';

function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  if (n <= 6) return Array.from({ length: n }, (_, i) => i);
  const mid = Math.floor((n - 1) / 2);
  return [0, mid, n - 1];
}

function niceAxisMax(max: number): number {
  return Math.max(1, Math.ceil(max));
}

function clientsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'клиентов';
  if (mod10 === 1) return 'клиент';
  if (mod10 >= 2 && mod10 <= 4) return 'клиента';
  return 'клиентов';
}

function repeatLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'повторных';
  if (mod10 === 1) return 'повторный';
  if (mod10 >= 2 && mod10 <= 4) return 'повторных';
  return 'повторных';
}

function newClientsShortLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'новых';
  if (mod10 === 1) return 'новый';
  return 'новых';
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

export function OverviewClientsDynamicsChart({
  stats,
  emptyHint = 'Клиентов за период нет',
}: {
  stats: ClientDayStat[];
  emptyHint?: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasData = stats.length > 0;
  const hasAny = stats.some((s) => s.newClients > 0 || s.repeatClients > 0);
  const axisMax = niceAxisMax(Math.max(0, ...stats.flatMap((s) => [s.newClients, s.repeatClients])));
  const axisIdx = chartAxisIndices(stats.length);
  const xLabels = axisIdx.map((i) => formatDdMm(stats[i]!.date));

  const totalNew = stats.reduce((a, s) => a + s.newClients, 0);
  const totalRepeat = stats.reduce((a, s) => a + s.repeatClients, 0);

  const pickIndex = useCallback(
    (clientX: number) => {
      const idx = pickNearestChartIndex(clientX, chartRef, stats.length);
      if (idx !== null) setActiveIndex(idx);
    },
    [stats.length],
  );

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasData) return;
    pickIndex(e.clientX);
  };

  const onPointerLeave = () => setActiveIndex(null);

  useEffect(() => {
    setActiveIndex(null);
  }, [stats]);

  const activeDay = activeIndex !== null ? stats[activeIndex] : null;
  const headlineNew = activeDay?.newClients ?? totalNew;
  const headlineRepeat = activeDay?.repeatClients ?? totalRepeat;

  return (
    <div className={overviewProChartShellClassName()}>
      {hasAny ? (
        <>
          <OverviewProChartHeader
            headline={`${headlineNew + headlineRepeat} ${clientsLabel(headlineNew + headlineRepeat)}`}
            subline={
              activeDay
                ? formatHoverDate(activeDay.date)
                : `${headlineNew} новых · ${headlineRepeat} повторных`
            }
          />
          <div className="mb-3 flex flex-wrap items-center gap-4 px-0.5">
            <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[#6B7280]">
              <span className="h-2 w-2 rounded-full bg-[#F47C8C]" aria-hidden />
              Первые визиты
            </span>
            <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[#6B7280]">
              <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" aria-hidden />
              Повторные визиты
            </span>
          </div>
        </>
      ) : null}

      <div
        ref={chartRef}
        className={`relative w-full touch-none select-none overflow-hidden ${proChartPlotClass('large')} ${
          hasData ? 'cursor-crosshair' : ''
        }`}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        role={hasData ? 'img' : undefined}
        aria-label={hasData ? 'График динамики клиентов' : undefined}
      >
        {!hasData || !hasAny ? (
          <OverviewProChartEmpty hint={emptyHint} icon={<HiCloud className="mx-auto h-10 w-10" aria-hidden />} />
        ) : (
          <>
            <div className="relative flex h-full items-end gap-[4px] px-1 pb-1 pt-2">
              {stats.map((s, i) => {
                const newH =
                  axisMax > 0 && s.newClients > 0
                    ? Math.min(100, (s.newClients / axisMax) * 100)
                    : 0;
                const repeatH =
                  axisMax > 0 && s.repeatClients > 0
                    ? Math.min(100, (s.repeatClients / axisMax) * 100)
                    : 0;
                const isActive = activeIndex === i;

                return (
                  <div key={s.date} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
                    {isActive ? (
                      <div className="pointer-events-none absolute inset-y-3 left-1/2 z-0 w-px -translate-x-1/2 border-l border-dashed border-[#D1D5DB]" />
                    ) : null}
                    <div className="relative z-10 mx-auto flex h-full w-full max-w-[22px] items-end justify-center gap-[3px]">
                      <div
                        className={`w-[min(48%,8px)] rounded-t-[5px] bg-gradient-to-t transition-all ${
                          s.newClients > 0
                            ? isActive
                              ? 'from-[#E85D72] to-[#F47C8C]'
                              : 'from-[#F9A8B4] to-[#FBCFE0]'
                            : 'bg-transparent'
                        }`}
                        style={{ height: `${newH}%` }}
                      />
                      <div
                        className={`w-[min(48%,8px)] rounded-t-[5px] bg-gradient-to-t transition-all ${
                          s.repeatClients > 0
                            ? isActive
                              ? 'from-[#7C3AED] to-[#8B5CF6]'
                              : 'from-[#A78BFA] to-[#C4B5FD]'
                            : 'bg-transparent'
                        }`}
                        style={{ height: `${repeatH}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {activeDay && activeIndex !== null ? (
              <OverviewProChartTooltip
                anchorPercent={proChartTooltipAnchorPercent(activeIndex, stats.length)}
                primary={
                  <>
                    <span className="text-[#FDA4AF]">
                      {activeDay.newClients} {newClientsShortLabel(activeDay.newClients)}
                    </span>
                    <span className="mx-1.5 font-normal text-white/35">·</span>
                    <span className="text-[#C4B5FD]">
                      {activeDay.repeatClients} {repeatLabel(activeDay.repeatClients)}
                    </span>
                  </>
                }
                secondary={formatHoverDate(activeDay.date)}
              />
            ) : null}
          </>
        )}
      </div>

      {hasAny ? <OverviewProChartXAxis labels={xLabels} /> : null}
    </div>
  );
}
