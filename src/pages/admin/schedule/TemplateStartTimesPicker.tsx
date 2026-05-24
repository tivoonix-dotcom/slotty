import { useMemo } from 'react';
import { buildTemplateStartTimeOptions, filterValidTemplateStartTimes, formatDurationRu } from './scheduleUtils';

type Props = {
  selected: string[];
  durationMinutes: number;
  onChange: (times: string[]) => void;
};

export function TemplateStartTimesPicker({ selected, durationMinutes, onChange }: Props) {
  const options = useMemo(
    () => buildTemplateStartTimeOptions(durationMinutes).map((value) => ({ value, label: value })),
    [durationMinutes],
  );

  const durationLabel = formatDurationRu(durationMinutes);

  const toggle = (time: string) => {
    const on = selected.includes(time);
    if (on) {
      const next = selected.filter((t) => t !== time);
      onChange(next.length > 0 ? filterValidTemplateStartTimes(next, durationMinutes) : []);
      return;
    }
    onChange(filterValidTemplateStartTimes([...selected, time], durationMinutes));
  };

  const count = selected.length;

  if (options.length === 0) {
    return (
      <p className="text-[13px] font-semibold text-[#6B7280]">
        Слишком длинный слот для рабочего дня — укоротите шаблон или создайте окно вручную.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] font-semibold text-[#6B7280]">
        {count === 0
          ? `Слот ${durationLabel} — выберите начала с шагом ${durationLabel}, без наложений`
          : `Выбрано ${count} ${count === 1 ? 'окно' : count < 5 ? 'окна' : 'окон'} в день · по ${durationLabel}`}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              aria-pressed={on}
              className={`min-h-[2.75rem] min-w-[4.25rem] rounded-[14px] px-3 text-[14px] font-bold tabular-nums transition active:scale-[0.97] ${
                on
                  ? 'bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_6px_18px_rgba(255,95,122,0.28)]'
                  : 'border border-[#EAECEF] bg-white text-[#374151] hover:border-[#FDE8ED] hover:text-[#ff5f7a]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {count > 0 ? (
        <p className="text-[12px] font-semibold text-[#9CA3AF]">
          Каждое окно {durationLabel} подряд, следующий старт не раньше чем через {durationLabel}
        </p>
      ) : null}
    </div>
  );
}
