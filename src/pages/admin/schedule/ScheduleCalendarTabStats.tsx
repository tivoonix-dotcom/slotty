import type { ReactNode } from 'react';
import { HiCalendarDays, HiLockClosed, HiRectangleStack, HiUser } from 'react-icons/hi2';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';

type Props = {
  metrics: ScheduleTabMetrics['calendar'];
};

function StatChip({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[4.75rem] flex-col justify-between rounded-[16px] p-3.5 lg:min-h-[5.25rem] lg:rounded-[18px] lg:p-4 ${
        accent
          ? 'bg-[#EEF0FC] ring-1 ring-[#E0E4F8] max-lg:shadow-none lg:ring-0'
          : 'bg-white ring-1 ring-[#EEEEEE] max-lg:shadow-none lg:bg-[#F6F7FB] lg:ring-0'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] ${
            accent ? 'bg-white text-[#3B4CCA]' : 'bg-white/80 text-[#6B7280]'
          }`}
        >
          {icon}
        </span>
      </div>
      <div>
        <p
          className={`text-[22px] font-black tabular-nums leading-none tracking-[-0.06em] lg:text-[26px] ${
            accent ? 'text-[#3B4CCA]' : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        <p className="mt-1 text-[11px] font-semibold leading-snug text-[#6B7280] lg:text-[12px]">{hint}</p>
      </div>
    </div>
  );
}

export function ScheduleCalendarTabStats({ metrics }: Props) {
  const m = metrics;

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
      <StatChip
        label="Всего"
        value={String(m.total)}
        hint="окон в расписании"
        icon={<HiRectangleStack className="h-4 w-4" aria-hidden />}
        accent
      />
      <StatChip
        label="Свободно"
        value={String(m.free)}
        hint="можно записать"
        icon={<HiCalendarDays className="h-4 w-4" aria-hidden />}
      />
      <StatChip
        label="С записью"
        value={String(m.booked)}
        hint="клиенты"
        icon={<HiUser className="h-4 w-4" aria-hidden />}
      />
      <StatChip
        label="Закрыто"
        value={String(m.blocked)}
        hint="недоступны"
        icon={<HiLockClosed className="h-4 w-4" aria-hidden />}
      />
    </div>
  );
}
