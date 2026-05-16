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

function RevenueHeroCard({
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
    <div className={`${overviewCard} ${overviewCardPad}`}>
      <p className="flex items-center gap-1 text-[14px] font-semibold text-[#6B7280]">
        {PERIOD_INCOME_LABEL[periodPreset]}
        <HiChevronDown className="h-4 w-4 shrink-0 opacity-40" aria-hidden />
      </p>
      <p className="mt-2 text-[32px] font-bold tabular-nums tracking-[-0.07em] text-[#111827]">
        {formatBynRu(totalRevenue)}
      </p>
      {trend ? <div className="mt-1.5"><TrendLine value={trend} /></div> : null}
    </div>
  );
}

function RevenueMetricTile({
  label,
  value,
  trend,
  trendTone = 'positive',
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  trendTone?: 'positive' | 'warning';
  icon: ReactNode;
}) {
  return (
    <div className={`${overviewCard} flex items-center gap-3 p-4`}>
      <span className={`${overviewIconCircle} h-11 w-11`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-0.5 text-[13px] font-semibold text-[#6B7280]">
          {label}
          <HiChevronDown className="h-3.5 w-3.5 shrink-0 opacity-35" aria-hidden />
        </p>
        <p className="mt-1 text-[22px] font-bold tabular-nums tracking-[-0.05em] text-[#111827]">
          {value}
        </p>
        <TrendLine value={trend} tone={trendTone} />
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
    <section className={`${overviewCard} ${overviewCardPad}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[17px] font-bold tracking-[-0.04em] text-[#111827]">График дохода</h2>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1 rounded-full border border-[#F3F4F6] bg-[#FAFAFA] px-3 py-1.5 text-[12px] font-semibold text-[#6B7280]"
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
    <section className={`${overviewCard} ${overviewCardPad}`}>
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
    <>
      <div className="grid min-w-0 grid-cols-2 gap-2.5">
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
        />
      </div>
      <RevenueMetricTile
        label="Не оплачено"
        value={formatBynRu(data.unpaidAmount)}
        trend={`${data.unpaidSharePercent}%`}
        trendTone="warning"
        icon={<HiStop className="h-5 w-5" aria-hidden />}
      />
    </>
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
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <RevenueHeroCard
        periodPreset={periodPreset}
        totalRevenue={data.totalRevenue}
        revenueTrendPercent={data.revenueTrendPercent}
      />

      <RevenueChartSection dayStats={data.dayStats} chartIsTruncated={data.chartIsTruncated} />

      <RevenueMetricsGrid data={data} />

      <RevenueDailyBarsSection dayStats={data.dayStats} />
    </div>
  );
}
