import type { ReactNode } from 'react';
import { HiArrowTrendingUp } from 'react-icons/hi2';
import { apptHistoryKpiTile } from './adminAppointmentsTheme';
import type { HistoryEarnedTrend } from './historyEarnedTrend';

type Props = {
  completedCount: number;
  earnedTotal: number;
  cancelledCount: number;
  earnedTrend?: HistoryEarnedTrend | null;
  earnedTrendPercent?: number | null;
  loading?: boolean;
  mobileHeader?: {
    title: string;
    subtitle: string;
  };
  mobileFilter?: ReactNode;
};

function EarnedTrendBadge({
  trend,
  percent,
}: {
  trend: HistoryEarnedTrend;
  percent?: number | null;
}) {
  if (trend === 'flat') return null;

  const up = trend === 'up';
  const label =
    percent != null && Number.isFinite(percent)
      ? `${up ? '+' : ''}${percent}%`
      : up
        ? 'рост'
        : 'снижение';

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        up ? 'bg-[#ECFDF3] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#EF4444]'
      }`}
      title="К текущему месяцу относительно прошлого"
    >
      <HiArrowTrendingUp className={`h-3 w-3 ${up ? '' : 'rotate-180'}`} aria-hidden />
      {label}
    </span>
  );
}

function MobileStat({
  label,
  value,
  trend,
  trendPercent,
  loading = false,
}: {
  label: string;
  value: string;
  trend?: HistoryEarnedTrend | null;
  trendPercent?: number | null;
  loading?: boolean;
}) {
  const showTrend = !loading && trend && trend !== 'flat';

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {loading ? (
        <div className="h-[22px] w-[2.75rem] animate-pulse rounded-md bg-[#EBEBEB] sm:h-6 sm:w-[3rem]" />
      ) : (
        <p className="text-[clamp(1rem,4.2vw,1.375rem)] font-black tabular-nums leading-none tracking-[-0.04em] text-[#111827]">
          {value}
        </p>
      )}
      <div className="mt-1.5 flex min-h-[1.125rem] items-center">
        {showTrend ? <EarnedTrendBadge trend={trend} percent={trendPercent} /> : null}
      </div>
      <p className="mt-1 text-[11px] font-medium leading-snug text-[#9CA3AF] sm:text-[12px]">{label}</p>
    </div>
  );
}

function DesktopStatBlock({
  label,
  value,
  earnedTrend,
  earnedTrendPercent,
  loading = false,
}: {
  label: string;
  value: string;
  earnedTrend?: HistoryEarnedTrend | null;
  earnedTrendPercent?: number | null;
  loading?: boolean;
}) {
  const trendBadge =
    !loading && earnedTrend && earnedTrend !== 'flat' ? (
      <EarnedTrendBadge trend={earnedTrend} percent={earnedTrendPercent} />
    ) : null;

  return (
    <article className={`${apptHistoryKpiTile} flex min-h-[7.5rem] flex-col justify-between`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <div>
        {loading ? (
          <div className="h-8 w-[4.5rem] animate-pulse rounded-md bg-[#EBEBEB]" />
        ) : (
          <div className="flex flex-wrap items-end gap-x-2.5 gap-y-2">
            <p className="text-[clamp(1.35rem,2vw,1.75rem)] font-black tabular-nums leading-none tracking-[-0.05em] text-[#111827]">
              {value}
            </p>
            {label === 'Заработано' ? trendBadge : null}
          </div>
        )}
        {label === 'Заработано' ? <div className="mt-1.5 min-h-[1.125rem]" /> : null}
      </div>
    </article>
  );
}

export function AppointmentsHistorySummary({
  completedCount,
  earnedTotal,
  cancelledCount,
  earnedTrend = null,
  earnedTrendPercent = null,
  loading = false,
  mobileHeader,
  mobileFilter,
}: Props) {
  return (
    <>
      {mobileHeader ? (
        <section className="overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] lg:hidden">
          <div className="flex items-start justify-between gap-3 border-b border-[#EEEEEE] px-4 py-3.5">
            <div className="min-w-0 flex-1">
              {loading ? (
                <>
                  <div className="h-[18px] w-[70%] max-w-[12rem] animate-pulse rounded-md bg-[#EBEBEB]" />
                  <div className="mt-2 h-[14px] w-[90%] max-w-[16rem] animate-pulse rounded-md bg-[#EBEBEB]" />
                </>
              ) : (
                <>
                  <p className="text-[15px] font-bold tracking-[-0.02em] text-[#111827]">{mobileHeader.title}</p>
                  <p className="mt-0.5 min-h-[2.5rem] text-[13px] font-medium leading-snug text-[#6B7280]">
                    {mobileHeader.subtitle}
                  </p>
                </>
              )}
            </div>
            {mobileFilter ? <div className="shrink-0 self-start">{mobileFilter}</div> : null}
          </div>

          <div className="px-4 py-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Итоги за всё время</p>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:gap-4">
              <MobileStat label="Завершено" value={String(completedCount)} loading={loading} />
              <MobileStat
                label="Заработано"
                value={`${earnedTotal} BYN`}
                trend={earnedTrend}
                trendPercent={earnedTrendPercent}
                loading={loading}
              />
              <MobileStat label="Отменено" value={String(cancelledCount)} loading={loading} />
            </div>
          </div>
        </section>
      ) : null}

      <div className="hidden min-w-0 flex-1 lg:grid lg:grid-cols-3 lg:gap-4">
        <DesktopStatBlock label="Завершено" value={String(completedCount)} loading={loading} />
        <DesktopStatBlock
          label="Заработано"
          value={`${earnedTotal} BYN`}
          earnedTrend={earnedTrend}
          earnedTrendPercent={earnedTrendPercent}
          loading={loading}
        />
        <DesktopStatBlock label="Отменено" value={String(cancelledCount)} loading={loading} />
      </div>
    </>
  );
}
