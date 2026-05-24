import type { ReactNode } from 'react';
import { overviewDesktopKpiCarouselCard } from '../overview/adminOverviewTheme';
import { notifAccentIcon } from './adminNotificationsTheme';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accentValue?: boolean;
};

export function NotificationsKpiStatCard({ label, value, hint, icon, accentValue }: Props) {
  return (
    <article
      className={`${overviewDesktopKpiCarouselCard} flex min-h-[7.5rem] flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
          {label}
        </p>
        <span className={`${notifAccentIcon} h-10 w-10`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p
          className={`truncate text-[clamp(1.35rem,2.2vw,1.65rem)] font-black tabular-nums leading-none tracking-[-0.06em] ${
            accentValue ? 'text-[#ff5f7a]' : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-1.5 line-clamp-2 text-[12px] font-medium text-[#6B7280]">{hint}</p>
        ) : null}
      </div>
    </article>
  );
}
