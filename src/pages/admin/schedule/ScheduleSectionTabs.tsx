import type { ComponentType } from 'react';
import { HiCalendarDays, HiPlusCircle, HiRectangleStack } from 'react-icons/hi2';
import type { SchedulePageTab } from './scheduleTypes';

const TABS: Array<{
  id: SchedulePageTab;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'create', label: 'Создать', Icon: HiPlusCircle },
  { id: 'calendar', label: 'Календарь', Icon: HiCalendarDays },
  { id: 'list', label: 'Список', Icon: HiRectangleStack },
];

type Props = {
  active: SchedulePageTab;
  onChange: (tab: SchedulePageTab) => void;
  className?: string;
};

export function ScheduleSectionTabs({ active, onChange, className = '' }: Props) {
  return (
    <nav
      className={`flex w-full border-b border-[#eef0f5] ${className}`.trim()}
      aria-label="Разделы расписания"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.Icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-center gap-2 px-3 text-[14px] font-bold transition lg:min-h-[3.5rem] lg:px-5 lg:text-[15px] ${
              selected ? 'text-[#3B4CCA]' : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">{tab.label}</span>
            {selected ? (
              <span
                className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-[#3B4CCA] lg:inset-x-5"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
