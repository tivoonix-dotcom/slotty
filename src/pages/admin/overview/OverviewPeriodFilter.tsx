import type { OverviewPeriodPreset } from './overviewAnalytics';
import { overviewCard } from './adminOverviewTheme';

const PRESETS: Array<{ id: OverviewPeriodPreset; label: string }> = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'all', label: 'Всё время' },
];

type Props = {
  value: OverviewPeriodPreset;
  onChange: (preset: OverviewPeriodPreset) => void;
};

export function OverviewPeriodFilter({ value, onChange }: Props) {
  return (
    <div className={`${overviewCard} p-1.5`}>
      <div className="flex gap-1" role="group" aria-label="Период данных">
        {PRESETS.map((preset) => {
          const selected = value === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              className={`min-h-11 flex-1 rounded-[18px] px-1.5 text-[12px] font-bold transition duration-200 active:scale-[0.97] sm:text-[13px] ${
                selected
                  ? 'bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.10)]'
                  : 'bg-transparent text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827]'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}