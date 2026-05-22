import type { OverviewPeriodPreset } from './overviewAnalytics';

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
    <div className="flex w-full gap-1" role="group" aria-label="Период данных">
      {PRESETS.map((preset) => {
        const selected = value === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={`min-h-10 flex-1 rounded-[12px] px-2 text-[13px] font-semibold transition active:scale-[0.98] ${
              selected
                ? 'bg-[#FFF1F4] text-[#ff5f7a]'
                : 'bg-[#f6f7fb] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
