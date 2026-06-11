import { useEffect, useState } from 'react';
import { PickerSheet } from '../../../shared/ui/PickerSheet';
import { SlottyDatePickerCalendar } from '../../../shared/ui/SlottyDatePickerCalendar';
import { formatIsoDateLocal, offsetFromIso } from './catalogFilterDateTime';

function startOfLocalDay(base = new Date()): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

function isoFromOffset(offset: number | null): string {
  const d = startOfLocalDay();
  if (offset != null) d.setDate(d.getDate() + offset);
  return formatIsoDateLocal(d);
}

type Props = {
  open: boolean;
  onClose: () => void;
  selectedOffset: number | null;
  onSelectOffset: (offset: number | null) => void;
  minIso: string;
  maxIso: string;
};

/** Календарь Slotty для фильтра «Когда» — не нативный date picker. */
export function CatalogFilterDateCalendarSheet({
  open,
  onClose,
  selectedOffset,
  onSelectOffset,
  minIso,
  maxIso,
}: Props) {
  const selectedIso = selectedOffset != null ? isoFromOffset(selectedOffset) : '';
  const [viewYear, setViewYear] = useState(() => startOfLocalDay().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => startOfLocalDay().getMonth());

  useEffect(() => {
    if (!open) return;
    const iso = selectedOffset != null ? isoFromOffset(selectedOffset) : formatIsoDateLocal(startOfLocalDay());
    const [y, mo] = iso.split('-').map(Number);
    if (y && mo) {
      setViewYear(y);
      setViewMonth(mo - 1);
    }
  }, [open, selectedOffset]);

  return (
    <PickerSheet
      open={open}
      onClose={onClose}
      title="Дата записи"
      subtitle="Выберите удобный день"
    >
      <SlottyDatePickerCalendar
        value={selectedIso}
        viewYear={viewYear}
        viewMonth={viewMonth}
        onViewYearChange={setViewYear}
        onViewMonthChange={setViewMonth}
        min={minIso}
        max={maxIso}
        tone="catalog"
        allowClear
        onPick={(iso) => {
          if (!iso.trim()) {
            onSelectOffset(null);
          } else {
            onSelectOffset(offsetFromIso(iso));
          }
          onClose();
        }}
      />
    </PickerSheet>
  );
}
