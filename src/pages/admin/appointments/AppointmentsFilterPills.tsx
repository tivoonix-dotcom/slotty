import { HiArrowsUpDown, HiFunnel } from 'react-icons/hi2';
import { apptChip, apptChipActive, apptChipIdle } from './adminAppointmentsTheme';

type Pill = {
  id: string;
  label: string;
};

type Props = {
  serviceOptions: Pill[];
  serviceFilter: string;
  onServiceFilter: (id: string) => void;
  sortLabel: string;
  onSortClick: () => void;
  extraPills?: Array<{ id: string; label: string; active: boolean; onClick: () => void }>;
};

export function AppointmentsFilterPills({
  serviceOptions,
  serviceFilter,
  onServiceFilter,
  sortLabel,
  onSortClick,
  extraPills,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        <HiFunnel className="h-3.5 w-3.5" aria-hidden />
      </span>
      {serviceOptions.map((opt) => {
        const active = serviceFilter === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onServiceFilter(opt.id)}
            className={`${apptChip} ${active ? apptChipActive : apptChipIdle}`}
          >
            {opt.label}
          </button>
        );
      })}
      {extraPills?.map((pill) => (
        <button
          key={pill.id}
          type="button"
          onClick={pill.onClick}
          className={`${apptChip} ${pill.active ? apptChipActive : apptChipIdle}`}
        >
          {pill.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onSortClick}
        className={`${apptChip} ${apptChipIdle} ml-auto`}
      >
        <HiArrowsUpDown className="h-4 w-4" aria-hidden />
        {sortLabel}
      </button>
    </div>
  );
}
