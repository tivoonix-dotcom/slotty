import { Children, type ReactNode } from 'react';
import {
  HiArrowTrendingUp,
  HiChartBarSquare,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import type { OverviewPeriodPreset } from './overviewAnalytics';
import { overviewPeriodLabel } from './overviewAnalytics';
import {
  OVERVIEW_WELCOME_IMAGE_SRC,
  overviewCard,
  overviewCardPad,
  overviewEmptyIllustrationSrc,
  overviewIconCircle,
} from './adminOverviewTheme';

/** Заголовок вкладки сводки без градиента + бейдж периода. */
export function OverviewPanelHeader({
  title,
  subtitle,
  periodPreset,
}: {
  title: string;
  subtitle?: string;
  periodPreset: OverviewPeriodPreset;
}) {
  const period = overviewPeriodLabel(periodPreset);

  return (
    <header className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#111827] lg:text-[24px] lg:tracking-[-0.05em]">
          {title}
        </h2>
        <span className="rounded-full bg-[#FFF1F4] px-3 py-1 text-[12px] font-bold text-[#ff5f7a]">
          {period}
        </span>
      </div>
      {subtitle ? (
        <p className="mt-1 text-[13px] font-semibold text-[#6B7280] lg:text-[14px]">{subtitle}</p>
      ) : null}
    </header>
  );
}

/** Верхняя плашка с главной цифрой (клиенты / рейтинг). */
export function OverviewMetricHeroPlaque({
  eyebrow,
  value,
  caption,
  trailing,
  action,
}: {
  eyebrow?: ReactNode;
  value: ReactNode;
  caption: ReactNode;
  trailing?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="bg-white p-6 lg:bg-[#F6F7FB] lg:p-8">
      {eyebrow || trailing ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          {eyebrow ? <div className="min-w-0 flex-1">{eyebrow}</div> : null}
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
      ) : null}
      <div className={eyebrow || trailing ? 'mt-6' : undefined}>{value}</div>
      <div className="mt-3">{caption}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Тонкая линия-разделитель как в таблицах (Binance-style). */
export const overviewHairline = 'border-[#EAECEF]';

export function OverviewDividedMetricsRow({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);

  return (
    <div className="flex w-full">
      {items.map((child, index) => (
        <div
          key={index}
          className={`min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-7 ${
            index < items.length - 1 ? `border-r ${overviewHairline}` : ''
          }`}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/** 4 метрики: 2×2 на мобиле, одна строка с разделителями на sm+. */
export function OverviewDividedMetricsGrid({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const count = items.length;

  return (
    <div
      className={`grid w-full ${
        count === 4 ? 'grid-cols-2 sm:grid-cols-4' : count === 3 ? 'grid-cols-3' : 'grid-cols-2'
      }`}
    >
      {items.map((child, index) => {
        const mobileRightDivider = count === 4 && index % 2 === 0 && index < count - 1;
        const mobileBottomDivider = count === 4 && index < 2;
        const desktopRightDivider = index < count - 1;

        return (
          <div
            key={index}
            className={[
              'min-w-0 px-4 py-6 sm:px-5 sm:py-7 lg:px-6',
              mobileRightDivider ? `border-r ${overviewHairline}` : '',
              mobileBottomDivider ? `border-b sm:border-b-0 ${overviewHairline}` : '',
              desktopRightDivider ? `sm:border-r ${overviewHairline}` : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

export function OverviewEmptyMetricCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] sm:text-[11px]">
        {label}
      </p>
      <p className="mt-2 text-[clamp(1.5rem,4vw,1.875rem)] font-black tabular-nums leading-none tracking-[-0.06em] text-[#111827]">
        {value}
      </p>
      {hint ? (
        <div className="mt-2 text-[11px] font-medium leading-snug text-[#6B7280] sm:text-[12px]">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

/** Пустое состояние вкладок «Клиенты» / «Репутация»: белая карточка без рамок. */
export function OverviewEmptyTabHero({
  metrics,
  list,
  title,
  caption,
}: {
  metrics: ReactNode;
  /** Список под метриками (клиенты и т.п.). */
  list?: ReactNode;
  title: string;
  caption: string;
}) {
  return (
    <div className={`overflow-hidden bg-white ${overviewCard}`}>
      <div>{metrics}</div>
      {list ? <div className={`border-t ${overviewHairline}`}>{list}</div> : null}
      <div
        className={`border-t ${overviewHairline} px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-12 lg:py-14`}
      >
        <p className="text-[clamp(1.75rem,4.5vw,2.25rem)] font-black leading-tight tracking-[-0.06em] text-[#111827]">
          {title}
        </p>
        <p className="mx-auto mt-4 max-w-[34rem] text-[15px] font-semibold leading-relaxed text-[#6B7280] lg:mt-5 lg:text-[16px] lg:leading-7">
          {caption}
        </p>
      </div>
    </div>
  );
}

export function OverviewHeroActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-[14px] bg-[#ff5f7a] px-5 py-3 text-[14px] font-black text-white transition hover:bg-[#f04f6c] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export {
  OverviewVisitsBarChart,
  OverviewRevenueLineChart,
  OverviewRevenueBarChart,
  OverviewClientsDynamicsChart,
  OverviewRatingChart,
} from './charts';

export const OVERVIEW_ANALYTICS_TAB_BAR_HEIGHT = '5.75rem';

/** Компактная KPI-карточка для узкой сетки 3×1 (экран «Обзор»). */
export function OverviewWelcomeBanner({ displayName }: { displayName: string }) {
  const first = displayName.trim().split(/\s+/)[0] || 'Мастер';

  return (
    <div
      className={`${overviewCard} relative overflow-hidden p-5 sm:p-6`}
    >
      <div className="relative z-10 max-w-[min(100%,28rem)]">
        <p className="text-[18px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[20px]">
          Привет, {first}! 👋
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
          У вас всё под контролем. Вот ваша сводка на сегодня.
        </p>
      </div>
      <img
        src={OVERVIEW_WELCOME_IMAGE_SRC}
        alt=""
        width={280}
        height={200}
        decoding="async"
        className="pointer-events-none absolute -bottom-2 right-0 hidden h-[140px] w-auto max-w-[45%] object-contain object-bottom sm:block lg:h-[160px]"
      />
    </div>
  );
}

export function OverviewLatestActivity({
  items,
}: {
  items: Array<{ icon: ReactNode; text: string }>;
}) {
  return (
    <section className={`${overviewCard} ${overviewCardPad}`}>
      <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">Последняя активность</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={overviewIconCircle}>{item.icon}</span>
            <span className="text-[14px] font-medium text-[#6B7280]">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OverviewScheduleFillCard({ percent }: { percent: number }) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} flex h-full flex-col justify-between`}>
      <div>
        <p className="text-[13px] font-semibold text-[#6B7280]">Заполненность расписания</p>
        <p className="mt-1 text-[15px] font-bold text-[#111827]">Сегодня {percent}%</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f6f7fb]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

export function OverviewIncomeSummaryCard({
  totalRevenue,
  totalVisits,
  serviceCount,
  avgCheck,
}: {
  totalRevenue: string;
  totalVisits: number;
  serviceCount: number;
  avgCheck: string;
}) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} flex h-full flex-col`}>
      <p className="text-[13px] font-semibold text-[#6B7280]">Доход за период</p>
      <p className="mt-1 text-[26px] font-bold tabular-nums tracking-[-0.04em] text-[#111827] lg:text-[28px]">
        {totalRevenue}
      </p>
      <div className="mt-auto space-y-2 pt-4 text-[13px] text-[#6B7280]">
        <p>
          <span className="font-semibold text-[#111827]">Записей:</span> {totalVisits}
        </p>
        <p>
          <span className="font-semibold text-[#111827]">Услуг:</span> {serviceCount}
        </p>
        <p>
          <span className="font-semibold text-[#111827]">Средний чек:</span> {avgCheck}
        </p>
      </div>
    </div>
  );
}

export function OverviewCompactMetricCard({
  icon,
  label,
  value,
  sub,
  valueClassName = 'text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: ReactNode;
  valueClassName?: string;
}) {
  const compactValue = value.length > 5;
  const compactLabel = label.length > 9;

  return (
    <div
      className={`${overviewCard} flex min-h-[7.75rem] min-w-0 flex-1 flex-col items-center justify-center px-2 py-3.5 text-center`}
    >
      <span className={`${overviewIconCircle} h-9 w-9`}>{icon}</span>

      <p
        className={`mt-2 flex min-h-[26px] max-w-full items-center justify-center px-0.5 font-semibold leading-tight text-[#6B7280] ${
          compactLabel ? 'text-[10px]' : 'text-[11px]'
        }`}
      >
        {label}
      </p>

      <p
        className={`flex min-h-[22px] max-w-full items-center justify-center px-0.5 font-bold tabular-nums leading-none tracking-[-0.03em] ${valueClassName} ${
          compactValue ? 'text-[13px]' : 'text-[17px]'
        }`}
      >
        {value}
      </p>

      {sub ? (
        <p className="mt-1 flex min-h-[14px] max-w-full items-center justify-center px-0.5 text-[10px] font-medium leading-tight text-[#9CA3AF]">
          {sub}
        </p>
      ) : (
        <span className="mt-1 block min-h-[14px]" aria-hidden />
      )}
    </div>
  );
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
  valueClassName = 'text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  badge?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} relative overflow-hidden`}>
      <div
        className="pointer-events-none absolute -right-10 -top-10 hidden h-32 w-32 rounded-full bg-[#FFF1F4] lg:block"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#6B7280]">{label}</p>
          <p
            className={`mt-1 break-words text-[26px] font-bold tabular-nums tracking-[-0.06em] sm:text-[32px] sm:tracking-[-0.07em] ${valueClassName}`}
          >
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
    <div className={`${overviewCard} ${overviewCardPad} text-center`}>
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