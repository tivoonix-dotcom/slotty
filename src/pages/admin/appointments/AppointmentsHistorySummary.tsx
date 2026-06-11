import type { ReactNode } from 'react';
import { HiArrowTrendingUp } from 'react-icons/hi2';
import {
  APPOINTMENTS_HISTORY_KPI_BG,
  apptHistoryKpiTile,
  apptHistoryKpiTileOverlay,
} from './adminAppointmentsTheme';
import type { HistoryEarnedTrend } from './historyEarnedTrend';

function historyKpiBackground(label: string): string | null {
  if (label === 'Завершено') return APPOINTMENTS_HISTORY_KPI_BG.completed;
  if (label === 'Заработано') return APPOINTMENTS_HISTORY_KPI_BG.earned;
  if (label === 'Отменено') return APPOINTMENTS_HISTORY_KPI_BG.cancelled;
  return null;
}

function HistoryKpiPhotoBackdrop({ label }: { label: string }) {
  const src = historyKpiBackground(label);
  if (!src) return null;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${src})` }}
        aria-hidden
      />
      <div className={apptHistoryKpiTileOverlay} aria-hidden />
    </>
  );
}

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

const historyKpiLabelClass =
  'shrink-0 text-[10px] font-semibold leading-tight text-[#6B7280] drop-shadow-sm sm:text-[11px]';

const historyKpiValueClass =
  'text-[1.125rem] font-black tabular-nums leading-none tracking-[-0.04em] text-[#111827] drop-shadow-sm sm:text-[1.35rem] lg:text-[1.65rem]';

function HistoryKpiContent({
  label,
  value,
  trend,
  trendPercent,
  loading = false,
  compact = false,
}: {
  label: string;
  value: string;
  trend?: HistoryEarnedTrend | null;
  trendPercent?: number | null;
  loading?: boolean;
  compact?: boolean;
}) {
  const trendBadge =
    !loading && trend && trend !== 'flat' ? (
      <EarnedTrendBadge trend={trend} percent={trendPercent} />
    ) : null;

  return (
    <div className={`relative z-10 flex w-full flex-col ${compact ? 'min-h-[5.5rem]' : 'min-h-[8.25rem]'}`}>
      <p className={historyKpiLabelClass}>{label}</p>
      <div className="mt-auto">
        {loading ? (
          <div
            className={`animate-pulse rounded-md bg-[#EBEBEB] ${
              compact ? 'h-[22px] w-[2.75rem] sm:h-6 sm:w-[3rem]' : 'h-8 w-[4.5rem]'
            }`}
          />
        ) : (
          <p
            className={
              compact
                ? 'text-[0.9375rem] font-black tabular-nums leading-none tracking-[-0.03em] text-[#111827] drop-shadow-sm sm:text-[1.125rem]'
                : historyKpiValueClass
            }
          >
            {value}
          </p>
        )}
        <div className="mt-1.5 flex min-h-[1.25rem] items-center">{trendBadge}</div>
      </div>
    </div>
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
  const backgroundSrc = historyKpiBackground(label);

  return (
    <div
      className={`relative flex min-h-[6.25rem] min-w-0 flex-1 overflow-hidden rounded-[12px] p-3 sm:min-h-[6.5rem] sm:rounded-[14px] sm:p-3.5 ${
        backgroundSrc ? '' : 'bg-[#F5F5F5]'
      }`}
    >
      {backgroundSrc ? <HistoryKpiPhotoBackdrop label={label} /> : null}
      <HistoryKpiContent
        label={label}
        value={value}
        trend={trend}
        trendPercent={trendPercent}
        loading={loading}
        compact
      />
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
  return (
    <article className={`${apptHistoryKpiTile} h-full min-h-[8.25rem]`}>
      <HistoryKpiPhotoBackdrop label={label} />
      <HistoryKpiContent
        label={label}
        value={value}
        trend={earnedTrend}
        trendPercent={earnedTrendPercent}
        loading={loading}
      />
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
                  <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#9CA3AF] sm:text-[13px] sm:text-[#6B7280]">
                    {mobileHeader.subtitle}
                  </p>
                </>
              )}
            </div>
            {mobileFilter ? <div className="shrink-0 self-start">{mobileFilter}</div> : null}
          </div>

          <div className="px-4 pb-4 pt-3 sm:pb-5 sm:pt-3.5">
            <div className="grid grid-cols-3 items-stretch gap-2.5 sm:gap-3">
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

      <div className="hidden min-w-0 flex-1 lg:grid lg:grid-cols-3 lg:items-stretch lg:gap-4">
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
