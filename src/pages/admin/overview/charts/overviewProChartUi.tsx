import { type CSSProperties, type ReactNode, type RefObject } from 'react';
import { HiArrowDown, HiArrowUp } from 'react-icons/hi2';

export type ProChartPalette = {
  line: string;
  fillTop: string;
  fillBottom: string;
  accent: string;
  accentSoft: string;
  barActive: string;
  barIdle: string;
};

export const proChartPalettePink: ProChartPalette = {
  line: '#F47C8C',
  fillTop: 'rgba(244, 124, 140, 0.22)',
  fillBottom: 'rgba(244, 124, 140, 0)',
  accent: '#F47C8C',
  accentSoft: '#FFF1F4',
  barActive: 'from-[#E85D72] to-[#F47C8C]',
  barIdle: 'from-[#F9A8B4] to-[#FBCFE0]',
};

export const proChartPaletteViolet: ProChartPalette = {
  line: '#8B5CF6',
  fillTop: 'rgba(139, 92, 246, 0.2)',
  fillBottom: 'rgba(139, 92, 246, 0)',
  accent: '#8B5CF6',
  accentSoft: '#F5F3FF',
  barActive: 'from-[#7C3AED] to-[#8B5CF6]',
  barIdle: 'from-[#A78BFA] to-[#C4B5FD]',
};

export type ProChartTrend = {
  direction: 'up' | 'down' | 'flat';
  absoluteLabel: string;
  percentLabel: string | null;
};

export function computeProChartTrend(
  values: number[],
  formatAbsolute: (delta: number) => string,
): ProChartTrend | null {
  if (values.length < 2) return null;

  const first = values.find((v) => v > 0) ?? values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const delta = last - first;

  if (delta === 0) {
    return { direction: 'flat', absoluteLabel: formatAbsolute(0), percentLabel: '0%' };
  }

  const pct = first > 0 ? (delta / first) * 100 : null;
  return {
    direction: delta > 0 ? 'up' : 'down',
    absoluteLabel: `${delta > 0 ? '+' : ''}${formatAbsolute(delta)}`,
    percentLabel: pct !== null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : null,
  };
}

export function overviewProChartShellClassName(): string {
  return 'min-w-0 rounded-[20px] border border-[#EEF0F5] bg-white p-4 sm:p-5';
}

export function OverviewProChartHeader({
  headline,
  subline,
  trend,
  badge,
}: {
  headline: string;
  subline?: string;
  trend?: ProChartTrend | null;
  badge?: ReactNode;
}) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-[#059669]'
      : trend?.direction === 'down'
        ? 'text-[#F47C8C]'
        : 'text-[#6B7280]';

  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[28px] font-black leading-none tracking-[-0.04em] text-[#111827] tabular-nums sm:text-[32px]">
          {headline}
        </p>
        {trend ? (
          <p className={`mt-2 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold tabular-nums ${trendColor}`}>
            {trend.direction === 'up' ? (
              <HiArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : trend.direction === 'down' ? (
              <HiArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : null}
            <span>{trend.absoluteLabel}</span>
            {trend.percentLabel ? <span className="text-[#9CA3AF]">({trend.percentLabel})</span> : null}
          </p>
        ) : subline ? (
          <p className="mt-1.5 text-[13px] font-medium text-[#6B7280]">{subline}</p>
        ) : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  );
}

export function OverviewProChartBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#EEF0F5] bg-[#F9FAFB] px-3 py-1.5 text-[12px] font-semibold text-[#6B7280]">
      {children}
    </span>
  );
}

export function proChartTooltipAnchorPercent(index: number, total: number): number {
  if (total <= 1) return 50;
  return (index / (total - 1)) * 100;
}

/** Держит tooltip внутри контейнера: у левого/правого края — прижим, в центре — по anchor. */
export function proChartTooltipPositionStyle(anchorPercent: number, insetPx = 10): CSSProperties {
  const edgeThreshold = 22;
  if (anchorPercent <= edgeThreshold) {
    return { left: insetPx, transform: 'none' };
  }
  if (anchorPercent >= 100 - edgeThreshold) {
    return { right: insetPx, left: 'auto', transform: 'none' };
  }
  return { left: `${anchorPercent}%`, transform: 'translateX(-50%)' };
}

export function OverviewProChartTooltip({
  anchorPercent,
  primary,
  secondary,
}: {
  /** 0–100: позиция якоря по ширине графика */
  anchorPercent: number;
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute top-3 z-20 w-max max-w-[calc(100%-1.25rem)] rounded-[12px] bg-[#111827] px-3.5 py-2.5 shadow-[0_12px_32px_rgba(17,24,39,0.18)]"
      style={proChartTooltipPositionStyle(anchorPercent)}
    >
      <div className="whitespace-nowrap text-[14px] font-bold leading-snug tabular-nums tracking-[-0.02em] text-white">
        {primary}
      </div>
      {secondary ? (
        <div className="mt-1 whitespace-nowrap text-[11px] font-medium leading-none text-white/65">
          {secondary}
        </div>
      ) : null}
    </div>
  );
}

export function OverviewProChartXAxis({ labels }: { labels: string[] }) {
  if (!labels.length) return null;

  return (
    <div className="mt-3 flex justify-between px-0.5 text-[11px] font-medium text-[#9CA3AF]">
      {labels.map((label) => (
        <span key={label} className="tabular-nums">
          {label}
        </span>
      ))}
    </div>
  );
}

export function OverviewProChartEmpty({
  hint,
  icon,
}: {
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex h-[12rem] flex-col items-center justify-center gap-2 px-4 text-center sm:h-[14rem]">
      <div className="text-[#D1D5DB]">{icon}</div>
      <p className="max-w-[16rem] text-[13px] font-medium leading-relaxed text-[#6B7280]">{hint}</p>
    </div>
  );
}

export function proChartPlotHeight(size: 'default' | 'large'): number {
  return size === 'large' ? 224 : 192;
}

export function proChartPlotClass(size: 'default' | 'large'): string {
  return size === 'large' ? 'h-56 sm:h-[14rem]' : 'h-48 sm:h-56';
}

export function proChartTooltipLeft(x: number, width: number): number {
  if (width <= 0) return 50;
  return Math.min(100, Math.max(0, (x / width) * 100));
}

export function pickNearestChartIndex(
  clientX: number,
  container: RefObject<HTMLElement | null>,
  pointCount: number,
  chartWidth?: number,
  padX = 0,
): number | null {
  if (pointCount <= 0 || !container.current) return null;

  const rect = container.current.getBoundingClientRect();
  const relX =
    chartWidth !== undefined
      ? ((clientX - rect.left) / rect.width) * chartWidth
      : clientX - rect.left;

  if (pointCount === 1) return 0;

  const plotWidth = chartWidth !== undefined ? chartWidth - padX * 2 : rect.width;
  const startX = chartWidth !== undefined ? padX : 0;
  const ratio = Math.min(1, Math.max(0, (relX - startX) / Math.max(plotWidth, 1)));
  return Math.min(pointCount - 1, Math.max(0, Math.round(ratio * (pointCount - 1))));
}
