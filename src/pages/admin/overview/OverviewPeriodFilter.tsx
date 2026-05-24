import type { OverviewPeriodPreset } from './overviewAnalytics';
import {
  overviewFilterChip,
  overviewFilterChipActive,
  overviewFilterChipIdle,
} from './adminOverviewTheme';

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
    <div className="min-w-0" role="group" aria-label="Период данных">
      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF] lg:sr-only">
        Период
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const selected = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              aria-pressed={selected}
              className={`${overviewFilterChip} ${selected ? overviewFilterChipActive : overviewFilterChipIdle}`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
