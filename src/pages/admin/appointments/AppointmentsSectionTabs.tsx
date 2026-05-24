import type { ComponentType } from 'react';
import { HiArchiveBox, HiCalendarDays, HiInbox } from 'react-icons/hi2';
import type { AppointmentsTabId } from './appointmentsTypes';

const TABS: Array<{
  id: AppointmentsTabId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'requests', label: 'Заявки', Icon: HiInbox },
  { id: 'upcoming', label: 'Предстоящие', Icon: HiCalendarDays },
  { id: 'history', label: 'История', Icon: HiArchiveBox },
];

type Props = {
  active: AppointmentsTabId;
  onChange: (tab: AppointmentsTabId) => void;
  counts?: { requests: number; upcoming: number; history: number };
  className?: string;
};

export function AppointmentsSectionTabs({ active, onChange, counts, className = '' }: Props) {
  const countFor = (id: AppointmentsTabId) => {
    if (!counts) return null;
    if (id === 'requests') return counts.requests;
    if (id === 'upcoming') return counts.upcoming;
    return counts.history;
  };

  return (
    <nav
      className={`flex w-full border-b border-[#eef0f5] ${className}`.trim()}
      aria-label="Разделы записей"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.Icon;
        const n = countFor(tab.id);

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-center gap-2 px-3 text-[14px] font-bold transition lg:min-h-[3.5rem] lg:px-5 lg:text-[15px] ${
              selected ? 'text-[#ff5f7a]' : 'text-[#6B7280] hover:text-[#ff5f7a]/80'
            }`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 transition ${selected ? 'text-[#ff5f7a]' : ''}`}
              aria-hidden
            />
            <span className="truncate">{tab.label}</span>
            {n != null && n > 0 ? (
              <span
                className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[11px] font-black tabular-nums ${
                  selected ? 'bg-[#ff5f7a] text-white' : 'bg-[#EAECEF] text-[#6B7280]'
                }`}
              >
                {n > 99 ? '99+' : n}
              </span>
            ) : null}
            {selected ? (
              <span
                className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-[#ff5f7a] lg:inset-x-5"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
