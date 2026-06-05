import type { ReactNode } from 'react';
import { overviewDesktopKpiTile } from '../overview/adminOverviewTheme';
import { notifKpiIcon } from './adminNotificationsTheme';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accentValue?: boolean;
  iconClassName?: string;
  compact?: boolean;
};

export function NotificationsKpiStatCard({
  label,
  value,
  hint,
  icon,
  accentValue,
  iconClassName,
  compact = false,
}: Props) {
  return (
    <article
      className={`${overviewDesktopKpiTile} flex flex-col justify-between ${
        compact ? 'min-h-[5.25rem] p-3.5 lg:min-h-[6.5rem] lg:p-5' : 'min-h-[6.5rem]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] sm:text-[11px]">
          {label}
        </p>
        <span className={`${notifKpiIcon} h-8 w-8 rounded-[10px] sm:h-9 sm:w-9 sm:rounded-[12px] ${iconClassName ?? ''}`}>
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p
          className={`truncate text-[1.35rem] font-bold tabular-nums leading-none tracking-[-0.04em] sm:text-[1.65rem] ${
            accentValue ? 'text-[#F47C8C]' : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-1 line-clamp-2 text-[11px] font-medium text-[#6B7280] sm:text-[12px]">{hint}</p>
        ) : null}
      </div>
    </article>
  );
}
