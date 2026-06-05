import { useEffect, useMemo, useState } from 'react';
import { HiArrowTrendingUp, HiReceiptPercent, HiStop } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { overviewDesktopCard, overviewDesktopCardPad } from './adminOverviewTheme';
import { EMPTY_TREND } from '../../../shared/lib/emptyDisplayText';
import {
  OverviewKpiCarousel,
  OverviewKpiStatCard,
  OverviewTrendBadge,
} from './OverviewKpiBlocks';
import {
  computeRevenueServiceSources,
  REVENUE_SOURCE_ALL_KEY,
  revenueChartDayStatsForSource,
  type OverviewPeriodPreset,
  type RevenueAnalytics,
} from './overviewAnalytics';
import { formatBynRu } from './overviewFormat';
import { OverviewRevenueBarChart, OverviewRevenueLineChart } from './charts';
import { OverviewRevenuePeriodMenu } from './OverviewRevenuePeriodMenu';
import { OverviewRevenueSourcesMenu } from './OverviewRevenueSourcesMenu';

import { OverviewSummaryHeroBackground } from './OverviewSummaryHeroBackground';

function formatTrendPercent(value: number | null): string | null {
  if (value === null) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

function RevenueHeroSection({
  periodPreset,
  onPeriodChange,
  data,
  embedded = false,
}: {
  periodPreset: OverviewPeriodPreset;
  onPeriodChange: (preset: OverviewPeriodPreset) => void;
  data: RevenueAnalytics;
  embedded?: boolean;
}) {
  return (
    <section
      className={
        embedded
          ? 'relative overflow-hidden p-6 text-white lg:p-8'
          : 'relative overflow-hidden rounded-[32px] p-6 text-white shadow-[0_22px_65px_rgba(17,24,39,0.18)] lg:p-8'
      }
    >
      <OverviewSummaryHeroBackground />

      <div className="relative z-10 min-w-0">
        <OverviewRevenuePeriodMenu value={periodPreset} onChange={onPeriodChange} />

        <p className="mt-8 text-[52px] font-black leading-none tabular-nums tracking-[-0.08em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)] lg:text-[72px]">
          {formatBynRu(data.totalRevenue)}
        </p>

        <p className="mt-6 max-w-[660px] text-[17px] font-semibold leading-8 text-white/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.4)]">
          Общая сумма дохода по активным и завершённым записям за выбранный период.
        </p>
      </div>
    </section>
  );
}

function RevenueChartSection({
  dayStats,
  chartIsTruncated,
  serviceSources,
  sourceKey,
  onSourceChange,
}: {
  dayStats: RevenueAnalytics['dayStats'];
  chartIsTruncated: boolean;
  serviceSources: ReturnType<typeof computeRevenueServiceSources>;
  sourceKey: string;
  onSourceChange: (key: string) => void;
}) {
  const sourceHint =
    sourceKey !== REVENUE_SOURCE_ALL_KEY
      ? serviceSources.find((s) => s.key === sourceKey)?.label
      : null;

  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            График дохода
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            {sourceHint
              ? `Выручка по услуге «${sourceHint}»`
              : 'Как менялась выручка за выбранный период'}
          </p>
        </div>

        <OverviewRevenueSourcesMenu
          sources={serviceSources}
          value={sourceKey}
          onChange={onSourceChange}
        />
      </div>

      <OverviewRevenueLineChart
        stats={dayStats}
        size="large"
        emptyHint={
          sourceHint ? `Нет дохода по услуге «${sourceHint}» за период` : 'Дохода за период нет'
        }
      />

      {chartIsTruncated ? (
        <p className="mt-4 text-[12px] leading-snug text-[#9CA3AF]">
          График показывает последние 90 дней, суммы — за выбранный период.
        </p>
      ) : null}
    </section>
  );
}

function RevenueDailyBarsSection({ dayStats }: { dayStats: RevenueAnalytics['dayStats'] }) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5">
        <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
          Доход по дням
        </h2>
        <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
          Разбивка выручки по каждому дню
        </p>
      </div>

      <OverviewRevenueBarChart stats={dayStats} />
    </section>
  );
}

function RevenueMetricsCarousel({ data }: { data: RevenueAnalytics }) {
  const avgTrend = formatTrendPercent(data.avgCheckTrendPercent) ?? EMPTY_TREND;

  return (
    <OverviewKpiCarousel>
      <OverviewKpiStatCard
        surface="carousel"
        label="Средний чек"
        value={data.completedCount > 0 ? formatBynRu(data.avgCheck) : '0 BYN'}
        hint="По завершённым записям"
        icon={<HiArrowTrendingUp className="h-5 w-5" aria-hidden />}
        trailing={
          <OverviewTrendBadge value={avgTrend} tone={avgTrend === EMPTY_TREND ? 'neutral' : 'positive'} />
        }
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Оплачено"
        value={formatBynRu(data.paidAmount)}
        hint={`${data.paidSharePercent}% от суммы`}
        icon={<HiReceiptPercent className="h-5 w-5" aria-hidden />}
        trailing={<OverviewTrendBadge value={`${data.paidSharePercent}%`} />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Не оплачено"
        value={formatBynRu(data.unpaidAmount)}
        hint={`${data.unpaidSharePercent}% от суммы`}
        icon={<HiStop className="h-5 w-5" aria-hidden />}
        trailing={<OverviewTrendBadge value={`${data.unpaidSharePercent}%`} tone="warning" />}
      />
    </OverviewKpiCarousel>
  );
}

export function OverviewRevenuePanel({
  data,
  periodPreset,
  onPeriodChange,
  appointments,
  periodStart,
  periodEnd,
}: {
  data: RevenueAnalytics;
  periodPreset: OverviewPeriodPreset;
  onPeriodChange: (preset: OverviewPeriodPreset) => void;
  appointments: DemoMasterAppointment[];
  periodStart: string;
  periodEnd: string;
}) {
  const [sourceKey, setSourceKey] = useState(REVENUE_SOURCE_ALL_KEY);

  useEffect(() => {
    setSourceKey(REVENUE_SOURCE_ALL_KEY);
  }, [periodStart, periodEnd]);

  const serviceSources = useMemo(
    () => computeRevenueServiceSources(appointments, periodStart, periodEnd),
    [appointments, periodEnd, periodStart],
  );

  const chartDayStats = useMemo(
    () => revenueChartDayStatsForSource(appointments, data.dayStats, sourceKey),
    [appointments, data.dayStats, sourceKey],
  );

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden lg:space-y-6">
      <div className={`overflow-hidden ${overviewDesktopCard}`}>
        <RevenueHeroSection
          embedded
          periodPreset={periodPreset}
          onPeriodChange={onPeriodChange}
          data={data}
        />

        <div className="bg-white px-3 pb-4 pt-1 sm:px-4">
          <RevenueMetricsCarousel data={data} />
        </div>
      </div>

      <RevenueChartSection
        dayStats={chartDayStats}
        chartIsTruncated={data.chartIsTruncated}
        serviceSources={serviceSources}
        sourceKey={sourceKey}
        onSourceChange={setSourceKey}
      />

      <RevenueDailyBarsSection dayStats={chartDayStats} />
    </div>
  );
}
