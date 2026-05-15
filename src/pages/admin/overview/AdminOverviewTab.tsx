import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  aggregateOverviewByDay,
  appointmentStatusLabel,
  clampOverviewRangeEnd,
  countActiveVisitsBetween,
  pickNearestUpcomingAppointment,
  sumCompletedRevenueBetween,
  OVERVIEW_MAX_RANGE_DAYS,
  type DemoMasterAppointment,
  type OverviewDayStat,
} from '../../../features/master/model/demoMasterAppointments';
import { NothingFoundCard } from '../../../shared/ui/NothingFoundCard';
import { AdminCalendarSheet, formatRuDate } from '../shared/AdminCalendarSheet';
import {
  defaultOverviewLast30Days,
  formatAppointmentWhenRu,
  formatBynRu,
  formatDdMm,
  overviewAppointmentBounds,
  overviewChartWindow,
  previousOverviewReportPeriod,
} from './overviewFormat';

type Props = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  appointmentsPath: string;
  onOpenAppointment: (a: DemoMasterAppointment) => void;
};

/** Заложено под Supabase: пока false — скелетон не показываем. */
const isLoading = false;

function ComparisonLine({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return <p className="text-[11px] font-medium text-neutral-500">нет сравнения</p>;
  }
  const raw = ((current - previous) / previous) * 100;
  const pct = Math.round(raw);
  if (pct === 0) {
    return <p className="text-[11px] font-medium text-neutral-500">без изменений</p>;
  }
  const pos = pct > 0;
  return (
    <span className={`text-[12px] font-semibold tabular-nums ${pos ? 'text-emerald-700' : 'text-rose-600'}`}>
      {pos ? '+' : ''}
      {pct}%
    </span>
  );
}

/** Больше прошлого периода — зелёный, меньше — красный; без базы — нейтральный. */
function kpiTrendClass(current: number, previous: number): string {
  if (previous <= 0 && current <= 0) return 'text-neutral-950';
  if (previous <= 0 && current > 0) return 'text-emerald-700';
  if (current > previous) return 'text-emerald-700';
  if (current < previous) return 'text-rose-600';
  return 'text-neutral-950';
}

function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  return [0, Math.floor((n - 1) / 2), n - 1];
}

function BarBlock({
  stats,
  mode,
  avgValue,
  emptyHint,
}: {
  stats: OverviewDayStat[];
  mode: 'revenue' | 'visits';
  avgValue: number;
  emptyHint: string;
}) {
  const values = stats.map((s) => (mode === 'revenue' ? s.completedRevenue : s.activeVisits));
  const max = Math.max(1, ...values);
  const hasAny = values.some((v) => v > 0);

  return (
    <div className="rounded-[30px] bg-[#F1EFEF] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
      <div className="relative min-h-[11rem] rounded-[22px] bg-white p-3 shadow-[0_4px_18px_rgba(17,17,17,0.04)]">
        {!hasAny ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[22px] bg-white/95 px-6 text-center">
            <p className="text-[14px] font-semibold text-neutral-800">{emptyHint}</p>
          </div>
        ) : null}
        <div className="flex h-44 items-end gap-px">
          {stats.map((s) => {
            const v = mode === 'revenue' ? s.completedRevenue : s.activeVisits;
            const h = Math.max((v / max) * 100, v > 0 ? 8 : 3);
            let barClass = 'bg-neutral-200';
            if (v > 0) {
              const eps = 1e-6;
              if (v > avgValue + eps) barClass = 'bg-emerald-500';
              else if (v < avgValue - eps) barClass = 'bg-rose-500';
              else barClass = 'bg-neutral-300';
            }
            return (
              <div
                key={s.date}
                className="flex h-full min-w-0 flex-1 flex-col justify-end pt-1"
                title={`${s.date}: ${mode === 'revenue' ? `${v} BYN` : `${v} записей`}`}
              >
                <div
                  className={`mx-auto w-[min(100%,14px)] rounded-t-[10px] transition ${barClass}`}
                  style={{ height: `${h}%`, minHeight: v > 0 ? 4 : 2 }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-28 rounded-[30px] bg-neutral-200/70" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-28 rounded-[30px] bg-neutral-200/70" />
        <div className="h-28 rounded-[30px] bg-neutral-200/70" />
        <div className="h-28 rounded-[30px] bg-neutral-200/70" />
      </div>
      <div className="h-56 rounded-[30px] bg-neutral-200/70" />
      <div className="h-56 rounded-[30px] bg-neutral-200/70" />
      <div className="h-40 rounded-[30px] bg-neutral-200/70" />
    </div>
  );
}

type PeriodMode = 'all' | 'custom';

export function AdminOverviewTab({ draft, appointments, appointmentsPath, onOpenAppointment }: Props) {
  const initial = useMemo(() => defaultOverviewLast30Days(), []);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all');
  const [showPeriodControls, setShowPeriodControls] = useState(false);
  const [from, setFrom] = useState(initial.start);
  const [to, setTo] = useState(initial.end);
  const [datePicker, setDatePicker] = useState<null | 'from' | 'to'>(null);
  const [rangeCapped, setRangeCapped] = useState(false);

  const reportRange = useMemo(() => {
    if (periodMode === 'all') return overviewAppointmentBounds(appointments);
    return { start: from, end: to };
  }, [appointments, from, periodMode, to]);

  const chartRange = useMemo(
    () => overviewChartWindow(reportRange.start, reportRange.end, OVERVIEW_MAX_RANGE_DAYS),
    [reportRange.end, reportRange.start],
  );

  const chartIsTruncated = chartRange.chartStart > reportRange.start;

  const applyRange = useCallback(() => {
    setRangeCapped(false);
    if (!from || !to) return;
    let a = from;
    let b = to;
    if (a > b) [a, b] = [b, a];
    const bClamped = clampOverviewRangeEnd(a, b);
    if (bClamped !== b) setRangeCapped(true);
    setFrom(a);
    setTo(bClamped);
  }, [from, to]);

  const togglePeriodDetails = useCallback(() => {
    if (showPeriodControls) {
      setShowPeriodControls(false);
      return;
    }
    if (periodMode === 'all') {
      const b = overviewAppointmentBounds(appointments);
      setFrom(b.start);
      setTo(b.end);
    }
    setShowPeriodControls(true);
  }, [appointments, periodMode, showPeriodControls]);

  const onShowCustomRange = useCallback(() => {
    applyRange();
    setPeriodMode('custom');
    setShowPeriodControls(false);
  }, [applyRange]);

  const appointmentsInRange = useMemo(
    () => appointments.filter((r) => r.date >= reportRange.start && r.date <= reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );
  const hasAnyAppointmentInRange = appointmentsInRange.length > 0;

  const dayStats = useMemo(
    () => aggregateOverviewByDay(appointments, chartRange.chartStart, chartRange.chartEnd),
    [appointments, chartRange.chartEnd, chartRange.chartStart],
  );

  const avgRevenue = useMemo(() => {
    if (!dayStats.length) return 0;
    return dayStats.reduce((s, d) => s + d.completedRevenue, 0) / dayStats.length;
  }, [dayStats]);

  const avgVisits = useMemo(() => {
    if (!dayStats.length) return 0;
    return dayStats.reduce((s, d) => s + d.activeVisits, 0) / dayStats.length;
  }, [dayStats]);

  const totalRevenue = useMemo(
    () => sumCompletedRevenueBetween(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );
  const totalVisits = useMemo(
    () => countActiveVisitsBetween(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );

  const prev = useMemo(
    () => previousOverviewReportPeriod(reportRange.start, reportRange.end),
    [reportRange.end, reportRange.start],
  );
  const prevRevenue = useMemo(
    () => (prev ? sumCompletedRevenueBetween(appointments, prev.start, prev.end) : 0),
    [appointments, prev],
  );
  const prevVisits = useMemo(
    () => (prev ? countActiveVisitsBetween(appointments, prev.start, prev.end) : 0),
    [appointments, prev],
  );

  const nearest = useMemo(
    () => pickNearestUpcomingAppointment(appointments),
    [appointments],
  );

  const serviceCount = draft.services?.length ?? 0;

  const axisIdx = useMemo(() => chartAxisIndices(dayStats.length), [dayStats.length]);

  const revenueValueClass = prev ? kpiTrendClass(totalRevenue, prevRevenue) : 'text-neutral-950';
  const visitsValueClass = prev ? kpiTrendClass(totalVisits, prevVisits) : 'text-neutral-950';

  return (
    <div className="space-y-5">
      <div className="rounded-[30px] bg-white p-4 shadow-[0_10px_32px_rgba(17,17,17,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-neutral-800">Период</p>
            <p className="mt-0.5 text-[13px] font-medium leading-snug text-neutral-600">
              {periodMode === 'all' ? 'За всё время' : `${formatRuDate(from)} — ${formatRuDate(to)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={togglePeriodDetails}
            className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#c97f7f] ring-1 ring-[#E29595]/40 transition active:scale-[0.98] hover:bg-[#E29595]/10"
          >
            {showPeriodControls ? 'Скрыть' : 'Подробнее'}
          </button>
        </div>
        {showPeriodControls ? (
          <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setPeriodMode('all');
                  setRangeCapped(false);
                  setShowPeriodControls(false);
                }}
                className="text-[13px] font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-2 transition hover:text-neutral-900"
              >
                За всё время
              </button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="block min-w-[10rem] flex-1">
                <span className="text-[12px] font-semibold text-neutral-500">С</span>
                <button
                  type="button"
                  onClick={() => setDatePicker('from')}
                  className="mt-1.5 flex min-h-[2.75rem] w-full items-center justify-between rounded-[20px] bg-[#F1EFEF] px-4 py-2.5 text-left text-[15px] font-medium text-neutral-900 transition active:scale-[0.99]"
                >
                  {formatRuDate(from)}
                  <span className="text-neutral-400" aria-hidden>
                    ▾
                  </span>
                </button>
              </div>
              <div className="block min-w-[10rem] flex-1">
                <span className="text-[12px] font-semibold text-neutral-500">По</span>
                <button
                  type="button"
                  onClick={() => setDatePicker('to')}
                  className="mt-1.5 flex min-h-[2.75rem] w-full items-center justify-between rounded-[20px] bg-[#F1EFEF] px-4 py-2.5 text-left text-[15px] font-medium text-neutral-900 transition active:scale-[0.99]"
                >
                  {formatRuDate(to)}
                  <span className="text-neutral-400" aria-hidden>
                    ▾
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={onShowCustomRange}
                className="flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#E29595] px-7 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(226,149,149,0.28)] transition active:scale-[0.98] sm:mb-0.5"
              >
                Показать
              </button>
            </div>
          </div>
        ) : null}
        {rangeCapped ? (
          <p className="mt-3 rounded-[18px] bg-[#F1EFEF] px-3 py-2 text-[12px] font-medium text-neutral-600">
            Показан максимум за 90 дней
          </p>
        ) : null}
        {chartIsTruncated ? (
          <p className="mt-2 text-[11px] leading-snug text-neutral-500">
            Диаграммы — последние {OVERVIEW_MAX_RANGE_DAYS} дней периода; доход и число записей — за весь выбранный интервал.
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <OverviewSkeleton />
      ) : (
        <>
          {!hasAnyAppointmentInRange ? (
            <NothingFoundCard
              title="За выбранный период данных нет"
              text="Попробуйте выбрать другой период или дождитесь первых записей."
            />
          ) : null}

          <div className="rounded-[30px] bg-[#F1EFEF] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[30px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.05)]">
                <p className="text-[12px] font-semibold text-neutral-500">Доход</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${revenueValueClass}`}>
                  {formatBynRu(totalRevenue)}
                </p>
                <div className="mt-2 min-h-[18px]">{prev ? <ComparisonLine current={totalRevenue} previous={prevRevenue} /> : null}</div>
              </div>
              <div className="rounded-[30px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.05)]">
                <p className="text-[12px] font-semibold text-neutral-500">Записей</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${visitsValueClass}`}>
                  {totalVisits}
                </p>
                <div className="mt-2 min-h-[18px]">{prev ? <ComparisonLine current={totalVisits} previous={prevVisits} /> : null}</div>
              </div>
              <div className="rounded-[30px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.05)]">
                <p className="text-[12px] font-semibold text-neutral-500">Услуг</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-neutral-950">{serviceCount}</p>
                {serviceCount === 0 ? (
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[12px] font-semibold text-neutral-700">Услуги пока не добавлены</p>
                    <p className="text-[11px] font-medium text-neutral-500">Добавьте услуги в каталоге</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <section className="rounded-[30px] bg-white p-4 shadow-[0_10px_32px_rgba(17,17,17,0.06)]">
            <p className="text-[16px] font-semibold text-neutral-900">Доход по дням</p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-500">
              Зелёный — выше среднего, красный — ниже.
            </p>
            <div className="mt-4">
              <BarBlock stats={dayStats} mode="revenue" avgValue={avgRevenue} emptyHint="Дохода за период нет" />
            </div>
            {dayStats.length > 0 ? (
              <div className="mt-3 flex justify-between px-1 text-[11px] font-medium text-neutral-400">
                {axisIdx.map((i) => (
                  <span key={dayStats[i].date} className="tabular-nums">
                    {formatDdMm(dayStats[i].date)}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-[30px] bg-white p-4 shadow-[0_10px_32px_rgba(17,17,17,0.06)]">
            <p className="text-[16px] font-semibold text-neutral-900">Записи по дням</p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-500">
              Зелёный — выше среднего, красный — ниже.
            </p>
            <div className="mt-4">
              <BarBlock stats={dayStats} mode="visits" avgValue={avgVisits} emptyHint="Записей за период нет" />
            </div>
            {dayStats.length > 0 ? (
              <div className="mt-3 flex justify-between px-1 text-[11px] font-medium text-neutral-400">
                {axisIdx.map((i) => (
                  <span key={`${dayStats[i].date}-v`} className="tabular-nums">
                    {formatDdMm(dayStats[i].date)}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <div className="rounded-[30px] bg-[#F1EFEF] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            <p className="px-1 text-[13px] font-semibold text-neutral-600">Ближайшая запись</p>
            {nearest ? (
              <div className="mt-3 rounded-[30px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[17px] font-semibold text-neutral-950">{nearest.clientName}</p>
                  <span className="inline-flex rounded-full bg-[#F1EFEF] px-3 py-1 text-[11px] font-semibold text-neutral-700">
                    {appointmentStatusLabel(nearest.status)}
                  </span>
                </div>
                <p className="mt-1 text-[14px] text-neutral-600">{nearest.serviceTitle}</p>
                <p className="mt-1 text-[13px] font-medium text-neutral-700">{formatAppointmentWhenRu(nearest.date, nearest.time)}</p>
                <p className="mt-1 text-[14px] font-semibold text-neutral-900">{formatBynRu(nearest.priceByn)}</p>
                {nearest.addressShort ? (
                  <p className="mt-1 line-clamp-2 text-[12px] text-neutral-500">{nearest.addressShort}</p>
                ) : null}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onOpenAppointment(nearest)}
                    className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#E29595] text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.24)] transition active:scale-[0.98]"
                  >
                    Открыть
                  </button>
                  <Link
                    to={appointmentsPath}
                    className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] text-[14px] font-semibold text-neutral-800 transition active:scale-[0.98]"
                  >
                    Все записи
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-[30px] bg-white px-4 py-5 text-center shadow-[0_8px_24px_rgba(17,17,17,0.05)]">
                <p className="text-[15px] font-semibold text-neutral-900">Ближайших записей нет</p>
                <p className="mt-2 text-[13px] text-neutral-500">Новые заявки появятся здесь.</p>
              </div>
            )}
          </div>
        </>
      )}

      <AdminCalendarSheet
        open={datePicker !== null}
        onClose={() => setDatePicker(null)}
        valueIso={datePicker === 'from' ? from : datePicker === 'to' ? to : from}
        onSelect={(iso) => {
          if (datePicker === 'from') setFrom(iso);
          else if (datePicker === 'to') setTo(iso);
        }}
      />
    </div>
  );
}
