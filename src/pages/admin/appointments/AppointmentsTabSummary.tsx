import { tabSummaryCopy, type AppointmentsTabStats } from './appointmentsTabSummaryModel';
import type { AppointmentsTabId } from './appointmentsTypes';

type Props = {
  tab: AppointmentsTabId;
  stats: AppointmentsTabStats;
};

export function AppointmentsTabSummary({ tab, stats }: Props) {
  const copy = tabSummaryCopy(tab, stats);

  return (
    <header className="mb-3 flex items-start justify-between gap-3 rounded-[14px] bg-[#F5F5F5] px-4 py-3 lg:mb-4 lg:rounded-[16px] lg:px-5 lg:py-3.5">
      <div className="min-w-0">
        <p className="text-[14px] font-bold tracking-[-0.02em] text-[#111827] lg:text-[15px]">
          {copy.title}
        </p>
        <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#6B7280]">{copy.subtitle}</p>
      </div>
      {copy.badge ? (
        <span
          className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1 text-[13px] font-bold tabular-nums text-[#F47C8C]"
          aria-hidden
        >
          {copy.badge}
        </span>
      ) : null}
    </header>
  );
}
