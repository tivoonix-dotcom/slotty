import type { DemoBookingGridSlot } from '../../features/booking/model/demoBookingSlotGrid';
import { bookingTimeSlotActive, bookingTimeSlotIdle } from './bookingDateTimeUi';

type Props = {
  slots: DemoBookingGridSlot[];
  selectedSlotId: string | null;
  onPickSlot: (slotId: string) => void;
  layout?: 'grid' | 'wrap';
};

export function BookingTimeSlots({
  slots,
  selectedSlotId,
  onPickSlot,
  layout = 'grid',
}: Props) {
  const gridClass =
    layout === 'grid'
      ? 'grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-7'
      : 'flex flex-wrap gap-1.5';

  return (
    <div className={gridClass}>
      {slots.map((slot) => {
        const active = slot.slotId === selectedSlotId;
        const promo = slot.promotion;

        return (
          <button
            key={slot.slotId}
            type="button"
            onClick={() => onPickSlot(slot.slotId)}
            className={`min-h-11 rounded-[14px] px-3 py-2 text-[14px] transition active:scale-[0.98] ${
              active ? bookingTimeSlotActive : bookingTimeSlotIdle
            } ${layout === 'wrap' ? 'min-w-[4.5rem]' : ''}`}
          >
            <span className="block tabular-nums">{slot.timeLabel}</span>
            {promo ? (
              <span
                className={`mt-0.5 block text-[10px] font-bold leading-none ${
                  active ? 'text-white/90' : 'text-[#F47C8C]'
                }`}
              >
                {promo.discountLabel}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
