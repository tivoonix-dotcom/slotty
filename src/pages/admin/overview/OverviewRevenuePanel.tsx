import { type ReactNode } from 'react';
import {
  HiArrowTrendingUp,
  HiChevronDown,
  HiReceiptPercent,
  HiStop,
} from 'react-icons/hi2';
import { overviewCard, overviewCardPad, overviewIconCircle } from './adminOverviewTheme';
import type { OverviewPeriodPreset, RevenueAnalytics } from './overviewAnalytics';
import { formatBynRu } from './overviewFormat';
import { OverviewRevenueBarChart } from './OverviewRevenueBarChart';
import { OverviewLineChart } from './OverviewLineChart';

const PERIOD_INCOME_LABEL: Record<OverviewPeriodPreset, string> = {
  today: 'Доход за сегодня',
  week: 'Доход за неделю',
  month: 'Доход за месяц',
  all: 'Доход за всё время',
};

const revenueSectionDivider = 'border-t border-[#EEF0F5] pt-6';

function formatTrendPercent(value: number | null): string | null {
  if (value === null) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

function trendSubtext(value: number | null, periodPreset: OverviewPeriodPreset): string | null {
  const trend = formatTrendPercent(value);
  if (!trend) return null;
  if (periodPreset === 'all') return `${trend} к прошлому периоду`;
  if (periodPreset === 'today') return `${trend} к вчера`;
  if (periodPreset === 'week') return `${trend} к прошлой неделе`;
  return `${trend} к прошлому месяцу`;
}

function TrendLine({
  value,
  tone = 'positive',
}: {
  value: string;
  tone?: 'positive' | 'warning';
}) {
  const className =
    tone === 'warning'
      ? 'text-[12px] font-bold text-[#F59E0B]'
      : 'text-[12px] font-bold text-[#22C55E]';

  return <p className={className}>{value}</p>;
}

function RevenueHeroSection({
  periodPreset,
  totalRevenue,
  revenueTrendPercent,
}: {
  periodPreset: OverviewPeriodPreset;
  totalRevenue: number;
  revenueTrendPercent: number | null;
}) {
  const trend = trendSubtext(revenueTrendPercent, periodPreset);

  return (
    <section>
      <p className="flex items-center gap-1 text-[14px] font-semibold text-[#6B7280]">
        {PERIOD_INCOME_LABEL[periodPreset]}
        <HiChevronDown className="h-4 w-4 shrink-0 opacity-40" aria-hidden />
      </p>
      <p className="mt-2 text-[32px] font-bold tabular-nums tracking-[-0.07em] text-[#111827]">
        {formatBynRu(totalRevenue)}
      </p>
      {trend ? (
        <div className="mt-1.5">
          <TrendLine value={trend} />
        </div>
      ) : null}
    </section>
  );
}

function RevenueMetricTile({
  label,
  value,
  trend,
  trendTone = 'positive',
  icon,
  withDivider,
}: {
  label: string;
  value: string;
  trend: string;
  trendTone?: 'positive' | 'warning';
  icon: ReactNode;
  withDivider?: boolean;
}) {
  return (
    <div
      className={`flex w-full min-w-0 items-center gap-3 py-4 ${withDivider ? 'border-t border-[#EEF0F5]' : ''}`}
    >
      <span className={`${overviewIconCircle} h-11 w-11 shrink-0`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-0.5 text-[12px] font-semibold leading-snug text-[#6B7280] sm:text-[13px]">
          <span className="truncate">{label}</span>
          <HiChevronDown className="h-3.5 w-3.5 shrink-0 opacity-35" aria-hidden />
        </p>
        <p className="mt-1 break-words text-[20px] font-bold leading-tight tabular-nums tracking-[-0.04em] text-[#111827] sm:text-[22px] sm:tracking-[-0.05em]">
          {value}
        </p>
        <div className="mt-1">
          <TrendLine value={trend} tone={trendTone} />
        </div>
      </div>
    </div>
  );
}

function RevenueChartSection({
  dayStats,
  chartIsTruncated,
}: {
  dayStats: RevenueAnalytics['dayStats'];
  chartIsTruncated: boolean;
}) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[17px] font-bold tracking-[-0.04em] text-[#111827]">График дохода</h2>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1 rounded-full border border-[#EAECEF] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6B7280]"
        >
          Все источники
          <HiChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
        </button>
      </div>

      <div className="mt-4">
        <OverviewLineChart stats={dayStats} mode="revenue" size="large" emptyHint="Дохода за период нет" />
      </div>

      {chartIsTruncated ? (
        <p className="mt-3 text-[11px] leading-snug text-[#9CA3AF]">
          График показывает последние 90 дней, суммы — за выбранный период.
        </p>
      ) : null}
    </section>
  );
}

function RevenueDailyBarsSection({ dayStats }: { dayStats: RevenueAnalytics['dayStats'] }) {
  return (
    <section>
      <h2 className="text-[17px] font-bold tracking-[-0.04em] text-[#111827]">Доход по дням</h2>
      <div className="mt-4">
        <OverviewRevenueBarChart stats={dayStats} />
      </div>
    </section>
  );
}

function RevenueMetricsGrid({ data }: { data: RevenueAnalytics }) {
  const avgTrend = formatTrendPercent(data.avgCheckTrendPercent) ?? '—';

  return (
    <section>
      <RevenueMetricTile
        label="Средний чек"
        value={data.completedCount > 0 ? formatBynRu(data.avgCheck) : '0 BYN'}
        trend={avgTrend}
        icon={<HiArrowTrendingUp className="h-5 w-5" aria-hidden />}
      />
      <RevenueMetricTile
        label="Оплачено"
        value={formatBynRu(data.paidAmount)}
        trend={`${data.paidSharePercent}%`}
        icon={<HiReceiptPercent className="h-5 w-5" aria-hidden />}
        withDivider
      />
      <RevenueMetricTile
        label="Не оплачено"
        value={formatBynRu(data.unpaidAmount)}
        trend={`${data.unpaidSharePercent}%`}
        trendTone="warning"
        icon={<HiStop className="h-5 w-5" aria-hidden />}
        withDivider
      />
    </section>
  );
}

export function OverviewRevenuePanel({
  data,
  periodPreset,
}: {
  data: RevenueAnalytics;
  periodPreset: OverviewPeriodPreset;
}) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} min-w-0 overflow-x-hidden bg-white`}>
      <RevenueHeroSection
        periodPreset={periodPreset}
        totalRevenue={data.totalRevenue}
        revenueTrendPercent={data.revenueTrendPercent}
      />

      <div className={revenueSectionDivider}>
        <RevenueChartSection dayStats={data.dayStats} chartIsTruncated={data.chartIsTruncated} />
      </div>

      <div className={revenueSectionDivider}>
        <RevenueMetricsGrid data={data} />
      </div>

      <div className={revenueSectionDivider}>
        <RevenueDailyBarsSection dayStats={data.dayStats} />
      </div>
    </div>
  );
}
