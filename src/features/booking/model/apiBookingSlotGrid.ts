import {
  addDays,
  capitalize,
  DEMO_BOOKING_GRID_DAY_COUNT,
  formatDateLabel,
  formatFullDateLabel,
  formatMonthTitle,
  toIsoDate,
  type DemoBookingGridDay,
  type DemoBookingGridSlot,
} from './demoBookingSlotGrid';
import type { PublicSlotDto } from '../api/publicSlotsApi';

export type PublicSlotForGrid = Pick<PublicSlotDto, 'id' | 'startsAt' | 'promotion'>;

/**
 * Сетка дней как в демо, но слоты из GET /api/slots (реальные UUID).
 */
export function buildBookingSlotDaysFromPublicSlots(
  anchorDate: Date,
  publicSlots: PublicSlotForGrid[],
): DemoBookingGridDay[] {
  const slotsByDate = new Map<string, PublicSlotForGrid[]>();
  for (const s of publicSlots) {
    const d = new Date(s.startsAt);
    const iso = toIsoDate(d);
    if (!slotsByDate.has(iso)) slotsByDate.set(iso, []);
    slotsByDate.get(iso)!.push(s);
  }
  for (const arr of slotsByDate.values()) {
    arr.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }

  return Array.from({ length: DEMO_BOOKING_GRID_DAY_COUNT }, (_, index) => {
    const date = addDays(anchorDate, index);
    const iso = toIsoDate(date);
    const raw = slotsByDate.get(iso) ?? [];
    const times: DemoBookingGridSlot[] = raw.map((slot) => {
      const t = new Date(slot.startsAt);
      const promo = slot.promotion;
      return {
        slotId: slot.id,
        timeLabel: t.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        promotion: promo
          ? {
              discountLabel: promo.discountLabel,
              discountedPrice: promo.discountedPrice,
              originalPrice: promo.originalPrice,
              isSlotBound: promo.promotionTemplate === 'free_slots',
            }
          : undefined,
      };
    });

    return {
      id: `day_${iso}`,
      date: iso,
      dateLabel: formatDateLabel(date, anchorDate),
      fullDateLabel: formatFullDateLabel(date, anchorDate),
      monthLabel: formatMonthTitle(date),
      dayNumber: String(date.getDate()),
      weekdayLabel: capitalize(
        new Intl.DateTimeFormat('ru-RU', {
          weekday: 'short',
        })
          .format(date)
          .replace('.', ''),
      ),
      times,
    };
  });
}
