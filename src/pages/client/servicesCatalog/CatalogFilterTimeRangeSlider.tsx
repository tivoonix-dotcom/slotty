import { useCallback } from 'react';
import { formatTimeRangeLabel } from './catalogFilterDateTime';

const TICK_HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] as const;

function formatTickLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function tickLabelClassName(hour: number): string {
  const hideOnMobile = hour % 6 !== 0 ? 'max-sm:hidden' : '';
  const align =
    hour === 0 ? 'translate-x-0' : hour === 24 ? '-translate-x-full' : '-translate-x-1/2';

  return `absolute top-0 whitespace-nowrap text-[10px] font-medium tabular-nums text-[#9CA3AF] ${align} ${hideOnMobile}`;
}

type Props = {
  startHour: number;
  endHour: number;
  onChange: (startHour: number, endHour: number) => void;
};

export function CatalogFilterTimeRangeSlider({ startHour, endHour, onChange }: Props) {
  const start = Math.min(startHour, endHour - 1);
  const end = Math.max(endHour, startHour + 1);
  const startPct = (start / 24) * 100;
  const endPct = (end / 24) * 100;

  const onStartChange = useCallback(
    (value: number) => {
      const nextStart = Math.min(value, end - 1);
      onChange(nextStart, end);
    },
    [end, onChange],
  );

  const onEndChange = useCallback(
    (value: number) => {
      const nextEnd = Math.max(value, start + 1);
      onChange(start, nextEnd);
    },
    [onChange, start],
  );

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <span className="text-[15px] font-bold text-[#111827]">Время</span>
        <span className="text-[13px] font-medium text-[#6B7280] sm:text-right">
          <span className="sm:hidden">Период: </span>
          <span className="hidden sm:inline">Выбранный период: </span>
          <span className="font-semibold text-[#111827]">{formatTimeRangeLabel(start, end)}</span>
        </span>
      </div>

      <div className="catalog-time-range relative mx-1 h-10">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#E8E8EA]" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#F47C8C]"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        <input
          type="range"
          min={0}
          max={24}
          step={1}
          value={start}
          aria-label="Начало периода"
          onChange={(e) => onStartChange(Number(e.target.value))}
          className="pointer-events-none absolute inset-0 z-20 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
        />
        <input
          type="range"
          min={0}
          max={24}
          step={1}
          value={end}
          aria-label="Конец периода"
          onChange={(e) => onEndChange(Number(e.target.value))}
          className="pointer-events-none absolute inset-0 z-30 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
        />
      </div>

      <div className="relative mt-1 h-4 px-0.5">
        {TICK_HOURS.map((h) => (
          <span key={h} className={tickLabelClassName(h)} style={{ left: `${(h / 24) * 100}%` }}>
            {formatTickLabel(h)}
          </span>
        ))}
      </div>
    </div>
  );
}
