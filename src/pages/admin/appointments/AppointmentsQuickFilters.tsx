import { HiFunnel } from 'react-icons/hi2';
import { apptFilterBtn, apptFilterBtnActive } from './adminAppointmentsTheme';

type Props = {
  sheetActive: boolean;
  sheetOpen: boolean;
  onOpenSheet: () => void;
  sheetAriaLabel: string;
  /** Только кнопка фильтра (без отступа под toolbar). */
  compact?: boolean;
};

export function AppointmentsQuickFilters({
  sheetActive,
  sheetOpen,
  onOpenSheet,
  sheetAriaLabel,
  compact = false,
}: Props) {
  const filterButton = (
    <button
      type="button"
      onClick={onOpenSheet}
      className={`${apptFilterBtn} ${sheetActive ? apptFilterBtnActive : ''}`}
      aria-label={sheetAriaLabel}
      aria-expanded={sheetOpen}
    >
      <HiFunnel className="h-5 w-5" aria-hidden />
      {sheetActive ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white" aria-hidden />
      ) : null}
    </button>
  );

  if (compact) return filterButton;

  return (
    <div className="flex w-full items-center justify-between">
      <span className="h-12 w-12 shrink-0" aria-hidden />
      {filterButton}
    </div>
  );
}
