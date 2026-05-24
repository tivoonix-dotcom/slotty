import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';
import type { DemoBookingGridDay } from '../../features/booking/model/demoBookingSlotGrid';
import { BookingInlineCalendar } from './BookingInlineCalendar';

type Props = {
  open: boolean;
  slotDays: DemoBookingGridDay[];
  selectedDate: string | null;
  onClose: () => void;
  onPickDate: (dateIso: string) => void;
};

/** Поверх ClientSheetShell (z-[200]) и других client-модалок. */
const BOOKING_CALENDAR_LAYER_Z = 'z-[210]';

export function BookingCalendarOverlay({
  open,
  slotDays,
  selectedDate,
  onClose,
  onPickDate,
}: Props) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const handlePickDate = (dateIso: string) => {
    onPickDate(dateIso);
    onClose();
  };

  return createPortal(
    <div className={`fixed inset-0 ${BOOKING_CALENDAR_LAYER_Z} flex flex-col justify-end bg-black/35 backdrop-blur-[2px] lg:items-center lg:justify-center lg:p-8`}>
      <button type="button" className="absolute inset-0" aria-label="Закрыть" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-calendar-title"
        className="relative max-h-[88dvh] w-full overflow-hidden rounded-t-[20px] bg-white lg:max-h-[min(85vh,720px)] lg:max-w-xl lg:rounded-[16px]"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-3 lg:px-6 lg:pt-5">
          <h2 id="booking-calendar-title" className="text-[18px] font-semibold text-[#111827] lg:text-[20px]">
            Выберите дату
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EFEF] text-[#6B7280] transition hover:bg-[#FFF1F4] hover:text-[#F47C8C]"
            aria-label="Закрыть"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70dvh] overflow-y-auto px-5 pb-6 lg:max-h-[calc(min(85vh,720px)-4rem)] lg:px-6 lg:pb-8">
          <BookingInlineCalendar
            slotDays={slotDays}
            selectedDate={selectedDate}
            onPickDate={handlePickDate}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
