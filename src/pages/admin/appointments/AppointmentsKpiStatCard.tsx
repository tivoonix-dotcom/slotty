import type { ReactNode } from 'react';
import { overviewDesktopKpiCarouselCard } from '../overview/adminOverviewTheme';
import { apptAccentIcon, apptPriceAccent } from './adminAppointmentsTheme';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accentValue?: boolean;
};

export function AppointmentsKpiStatCard({ label, value, hint, icon, accentValue }: Props) {
  return (
    <article
      className={`${overviewDesktopKpiCarouselCard} flex min-h-[8.25rem] flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 pt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
          {label}
        </p>
        <span className={`${apptAccentIcon} h-11 w-11 rounded-[16px]`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p
          className={`truncate text-[clamp(1.5rem,2.4vw,1.75rem)] font-black tabular-nums leading-none tracking-[-0.06em] ${
            accentValue ? apptPriceAccent : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-snug text-[#6B7280]">{hint}</p>
        ) : null}
      </div>
    </article>
  );
}
