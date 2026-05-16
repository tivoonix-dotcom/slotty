import type { SchedulePageTab } from './scheduleTypes';

type Props = {
  tab: SchedulePageTab;
  onChange: (tab: SchedulePageTab) => void;
};

export function ScheduleTabs({ tab, onChange }: Props) {
  return (
    <div className="rounded-[24px] bg-[#F1EFEF] p-1.5">
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onChange('add')}
          className={`min-h-[3rem] rounded-[20px] text-[15px] font-semibold transition active:scale-[0.98] ${
            tab === 'add' ? 'bg-[#E29595] text-white shadow-md' : 'bg-transparent text-neutral-600'
          }`}
        >
          Добавить окно
        </button>
        <button
          type="button"
          onClick={() => onChange('calendar')}
          className={`min-h-[3rem] rounded-[20px] text-[15px] font-semibold transition active:scale-[0.98] ${
            tab === 'calendar' ? 'bg-[#E29595] text-white shadow-md' : 'bg-transparent text-neutral-600'
          }`}
        >
          Моё расписание
        </button>
      </div>
    </div>
  );
}
