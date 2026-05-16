import { type ReactNode, useId } from 'react';
import {
  HiArrowTrendingUp,
  HiCalendarDays,
  HiChartBarSquare,
  HiCloud,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';
import {
  overviewCard,
  overviewCardPad,
  overviewEmptyIllustrationSrc,
  overviewIconCircle,
  overviewMutedSurface,
} from './adminOverviewTheme';
import { formatDdMm } from './overviewFormat';

export const OVERVIEW_ANALYTICS_TAB_BAR_HEIGHT = '5.75rem';

export function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  return [0, Math.floor((n - 1) / 2), n - 1];
}

function chartValues(stats: OverviewDayStat[], mode: 'revenue' | 'visits') {
  return stats.map((s) => (mode === 'revenue' ? s.completedRevenue : s.activeVisits));
}

export function OverviewMetricCard({
  icon,
  label,
  value,
  sub,
  valueClassName = 'text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`${overviewCard} flex min-w-0 items-center gap-3 p-4`}>
      <span className={overviewIconCircle}>{icon}</span>

      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-[#6B7280]">{label}</p>
        <p
          className={`mt-0.5 truncate text-[20px] font-bold tabular-nums tracking-[-0.04em] ${valueClassName}`}
        >
          {value}
        </p>
        {sub ? <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">{sub}</p> : null}
      </div>
    </div>
  );
}

export function OverviewWideMetricCard({
  icon,
  label,
  value,
  sub,
  badge,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  badge?: ReactNode;
}) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} relative overflow-hidden`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFF1F4]" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#6B7280]">{label}</p>
          <p className="mt-1 text-[32px] font-bold tabular-nums tracking-[-0.07em] text-[#111827]">
            {value}
          </p>
          {sub ? <p className="mt-1 text-[12px] font-medium text-[#6B7280]">{sub}</p> : null}
          {badge ? <div className="mt-3">{badge}</div> : null}
        </div>

        <span className={`${overviewIconCircle} h-14 w-14 rounded-[20px]`}>{icon}</span>
      </div>
    </div>
  );
}

export function OverviewStatRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#111827]">{label}</p>
        {hint ? <p className="mt-0.5 text-[12px] leading-snug text-[#6B7280]">{hint}</p> : null}
      </div>

      <p className="shrink-0 text-[15px] font-bold tabular-nums text-[#111827]">{value}</p>
    </div>
  );
}

export function OverviewSectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${overviewCard} ${overviewCardPad}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? <span className={overviewIconCircle}>{icon}</span> : null}

          <div className="min-w-0">
            <h2 className="text-[17px] font-bold tracking-[-0.04em] text-[#111827]">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-[12px] leading-relaxed text-[#6B7280]">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

export function OverviewEmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} text-center`}>
      <span className={`${overviewIconCircle} mx-auto h-16 w-16 rounded-[22px]`}>{icon}</span>

      <h3 className="mt-4 text-[19px] font-bold tracking-[-0.05em] text-[#111827]">{title}</h3>

      <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
        {text}
      </p>

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function OverviewHeroEmpty() {
  return (
    <div className={`${overviewCard} ${overviewCardPad} overflow-hidden text-center`}>
      <div className="rounded-[22px] bg-gradient-to-br from-[#FFF1F4] via-white to-[#FAFAFA] px-4 py-5">
        <img
          src={overviewEmptyIllustrationSrc}
          alt=""
          width={280}
          height={240}
          decoding="async"
          className="mx-auto w-full max-w-[210px] object-contain"
        />

        <h2 className="mt-3 text-[19px] font-bold tracking-[-0.05em] text-[#111827]">
          За выбранный период данных нет
        </h2>

        <p className="mx-auto mt-2 max-w-[19rem] text-[13px] leading-relaxed text-[#6B7280]">
          Попробуйте выбрать другой период или дождитесь первых записей и платежей.
        </p>
      </div>
    </div>
  );
}

export function OverviewBarChart({
  stats,
  mode,
  emptyHint,
}: {
  stats: OverviewDayStat[];
  mode: 'revenue' | 'visits';
  emptyHint: string;
}) {
  const values = chartValues(stats, mode);
  const max = Math.max(1, ...values);
  const hasAny = values.some((v) => v > 0);
  const EmptyIcon = mode === 'revenue' ? HiCloud : HiCalendarDays;
  const axisIdx = chartAxisIndices(stats.length);

  return (
    <div>
      <div className={`relative min-h-[11rem] ${overviewMutedSurface} p-3`}>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 top-3 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-[#E5E7EB]" />
          ))}
        </div>

        {!hasAny ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <EmptyIcon className="h-10 w-10 text-[#D1D5DB]" aria-hidden />
            <p className="text-[13px] font-semibold text-[#6B7280]">{emptyHint}</p>
          </div>
        ) : (
          <div className="relative flex h-44 items-end gap-1 px-1">
            {stats.map((s) => {
              const v = mode === 'revenue' ? s.completedRevenue : s.activeVisits;
              const h = Math.max((v / max) * 100, v > 0 ? 10 : 4);

              return (
                <div
                  key={s.date}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  title={`${s.date}: ${mode === 'revenue' ? `${v} BYN` : `${v} записей`}`}
                >
                  <div
                    className={`mx-auto w-[min(100%,12px)] rounded-t-xl transition ${
                      v > 0
                        ? 'bg-gradient-to-t from-[#F47C8C] to-[#F9A8B4]'
                        : 'bg-[#E5E7EB]'
                    }`}
                    style={{ height: `${h}%`, minHeight: v > 0 ? 8 : 4 }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {stats.length > 0 ? (
        <div className="mt-3 flex justify-between px-1 text-[11px] font-semibold text-[#9CA3AF]">
          {axisIdx.map((i) => (
            <span key={`${stats[i].date}-${mode}`} className="tabular-nums">
              {formatDdMm(stats[i].date)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OverviewLineChart({
  stats,
  mode,
  emptyHint,
}: {
  stats: OverviewDayStat[];
  mode: 'revenue' | 'visits';
  emptyHint: string;
}) {
  const gradientId = useId();
  const values = chartValues(stats, mode);
  const hasAny = values.some((v) => v > 0);
  const max = Math.max(1, ...values);
  const axisIdx = chartAxisIndices(stats.length);

  const width = 320;
  const height = 150;
  const padX = 12;
  const padY = 16;

  const points = values.map((v, i) => {
    const x =
      values.length <= 1
        ? width / 2
        : padX + (i / (values.length - 1)) * (width - padX * 2);

    const y = height - padY - (v / max) * (height - padY * 2);

    return { x, y, v };
  });

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const area =
    points.length > 0
      ? `${path} L ${points[points.length - 1].x.toFixed(2)} ${height - padY} L ${points[0].x.toFixed(
          2,
        )} ${height - padY} Z`
      : '';

  return (
    <div>
      <div className={`relative h-[12rem] overflow-hidden ${overviewMutedSurface} p-3`}>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 top-3 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-[#E5E7EB]" />
          ))}
        </div>

        {!hasAny ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <HiCloud className="h-10 w-10 text-[#D1D5DB]" aria-hidden />
            <p className="text-[13px] font-semibold text-[#6B7280]">{emptyHint}</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="relative h-full w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F47C8C" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#F47C8C" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={path}
              fill="none"
              stroke="#F47C8C"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {points.map((p, i) =>
              p.v > 0 ? (
                <circle key={i} cx={p.x} cy={p.y} r="3.8" fill="#F47C8C" />
              ) : null,
            )}
          </svg>
        )}
      </div>

      {stats.length > 0 ? (
        <div className="mt-3 flex justify-between px-1 text-[11px] font-semibold text-[#9CA3AF]">
          {axisIdx.map((i) => (
            <span key={`${stats[i].date}-${mode}`} className="tabular-nums">
              {formatDdMm(stats[i].date)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const overviewTabIcons = {
  summary: HiChartBarSquare,
  revenue: HiWallet,
  clients: HiUsers,
  reputation: HiStar,
} as const;

export function OverviewTrendBadge({ trend }: { trend: 'up' | 'down' | 'flat' | null }) {
  if (!trend || trend === 'flat') return null;

  const up = trend === 'up';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        up ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#FEF2F2] text-[#EF4444]'
      }`}
    >
      <HiArrowTrendingUp className={`h-3.5 w-3.5 ${up ? '' : 'rotate-180'}`} aria-hidden />
      {up ? 'рост' : 'снижение'}
    </span>
  );
}