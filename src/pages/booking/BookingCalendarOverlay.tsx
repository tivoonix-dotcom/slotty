import { useEffect, useMemo, useState } from 'react';
import type { DemoBookingGridDay } from '../../features/booking/model/demoBookingSlotGrid';
import { PickerSheet } from '../../shared/ui/PickerSheet';
import { SlottyDatePickerCalendar } from '../../shared/ui/SlottyDatePickerCalendar';

type Props = {
  open: boolean;
  slotDays: DemoBookingGridDay[];
  selectedDate: string | null;
  onClose: () => void;
  onPickDate: (dateIso: string) => void;
};

function parseViewFromIso(iso: string): { year: number; month: number } {
  const [y, mo] = iso.split('-').map(Number);
  const now = new Date();
  return {
    year: y || now.getFullYear(),
    month: (mo || now.getMonth() + 1) - 1,
  };
}

export function BookingCalendarOverlay({
  open,
  slotDays,
  selectedDate,
  onClose,
  onPickDate,
}: Props) {
  const minIso = slotDays[0]?.date ?? '';
  const maxIso = slotDays[slotDays.length - 1]?.date ?? '';
  const dayByDate = useMemo(() => new Map(slotDays.map((day) => [day.date, day])), [slotDays]);

  const isDateDisabled = useMemo(
    () => (iso: string) => {
      const day = dayByDate.get(iso);
      return !day || day.times.length === 0;
    },
    [dayByDate],
  );

  const initialView = parseViewFromIso(selectedDate ?? minIso);
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);

  useEffect(() => {
    if (!open) return;
    const iso = selectedDate ?? minIso;
    const next = parseViewFromIso(iso);
    setViewYear(next.year);
    setViewMonth(next.month);
  }, [open, selectedDate, minIso]);

  return (
    <PickerSheet open={open} onClose={onClose} title="Дата записи" subtitle="Выберите удобный день">
      <SlottyDatePickerCalendar
        value={selectedDate ?? ''}
        viewYear={viewYear}
        viewMonth={viewMonth}
        onViewYearChange={setViewYear}
        onViewMonthChange={setViewMonth}
        min={minIso}
        max={maxIso}
        tone="catalog"
        allowClear={false}
        isDateDisabled={isDateDisabled}
        onPick={(iso) => {
          if (!iso.trim() || isDateDisabled(iso)) return;
          onPickDate(iso);
          onClose();
        }}
      />
    </PickerSheet>
  );
}
