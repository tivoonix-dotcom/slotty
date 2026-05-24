import { HiCloud } from 'react-icons/hi2';
import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';
import { formatBynRu, formatDdMm } from './overviewFormat';

function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  return [0, Math.floor((n - 1) / 2), n - 1];
}

function niceAxisMax(max: number): number {
  if (max <= 0) return 100;
  const step = max <= 200 ? 50 : max <= 500 ? 100 : max <= 1000 ? 200 : 400;
  return Math.ceil(max / step) * step;
}

export function OverviewRevenueBarChart({
  stats,
  emptyHint = 'Дохода за период нет',
}: {
  stats: OverviewDayStat[];
  emptyHint?: string;
}) {
  const values = stats.map((s) => s.completedRevenue);
  const hasAny = values.some((v) => v > 0);
  const axisMax = niceAxisMax(Math.max(...values, 0));
  const axisIdx = chartAxisIndices(stats.length);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(axisMax * t));

  return (
    <div className="min-w-0">
      <div className="relative flex gap-2">
        <div className="flex w-9 shrink-0 flex-col justify-between py-1 text-[10px] font-semibold tabular-nums text-[#9CA3AF]">
          {[...yTicks].reverse().map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        <div className="relative min-h-[11rem] flex-1 overflow-hidden rounded-[20px] border border-[#EEF0F5] bg-[#f6f7fb] p-3 pt-4 lg:border-0">
          {!hasAny ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <HiCloud className="h-10 w-10 text-[#D1D5DB]" aria-hidden />
              <p className="text-[13px] font-semibold text-[#6B7280]">{emptyHint}</p>
            </div>
          ) : (
            <div className="flex h-40 items-end gap-[3px] px-0.5">
              {stats.map((s) => {
                const v = s.completedRevenue;
                const h = axisMax > 0 ? Math.max((v / axisMax) * 100, v > 0 ? 8 : 2) : 2;

                return (
                  <div
                    key={s.date}
                    className="flex h-full min-w-0 flex-1 flex-col justify-end"
                    title={`${formatDdMm(s.date)}: ${formatBynRu(v)}`}
                  >
                    <div
                      className={`mx-auto w-[min(100%,10px)] rounded-t-full ${
                        v > 0
                          ? 'bg-gradient-to-t from-[#F47C8C] to-[#F9A8B4]'
                          : 'bg-[#F3F4F6]'
                      }`}
                      style={{ height: `${h}%`, minHeight: v > 0 ? 6 : 3 }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="mt-3 flex justify-between pl-11 pr-0.5 text-[11px] font-semibold text-[#9CA3AF]">
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
