import { buildBookingSlotDays, pickFirstSlot, startOfDay } from '../../booking/model/demoBookingSlotGrid';
import { formatPublicAddress } from '../../profile/model/masterLocation';
import { DEMO_MASTER_PROFILES, type DemoMasterProfile } from './demoMasters';

export type DemoQuickSlot = {
  id: string;
  masterId: string;
  serviceId: string;
  masterName: string;
  serviceTitle: string;
  category: string;
  photoUrl: string;
  dateLabel: string;
  timeLabel: string;
  price: number;
  rating: number;
  reviewsCount: number;
  addressLabel: string;
  /** Совпадает с `slotId` на `/zapis` (сетка `buildBookingSlotDays`). */
  slotId: string;
};

export function weeklyTopMasterScore(master: DemoMasterProfile): number {
  return master.rating * 20 + master.reviewsCount * 0.2 + master.services.length * 2;
}

/** Топ встроенных демо-мастеров по формуле недели (без localStorage-черновика). */
export function getWeeklyTopDemoMasters(limit = 5): DemoMasterProfile[] {
  const n = Math.min(Math.max(limit, 4), 6);
  return [...DEMO_MASTER_PROFILES]
    .sort((a, b) => weeklyTopMasterScore(b) - weeklyTopMasterScore(a))
    .slice(0, n);
}

export type DemoQuickSlotsOptions = {
  /** `null` / `undefined` — все категории. */
  category?: string | null;
  maxSlots?: number;
  referenceDate?: Date;
};

/**
 * Ближайшие демо-окна: первый слот из той же сетки, что и экран записи,
 * чтобы `slot` в URL совпадал с выбором на `/zapis`.
 */
export function getDemoQuickSlots(opts?: DemoQuickSlotsOptions): DemoQuickSlot[] {
  const maxSlots = opts?.maxSlots ?? 8;
  const refDate = opts?.referenceDate ?? new Date();
  const anchor = startOfDay(refDate);
  const cat = opts?.category?.trim() || null;

  const profiles = cat ? DEMO_MASTER_PROFILES.filter((m) => m.category === cat) : [...DEMO_MASTER_PROFILES];

  const out: DemoQuickSlot[] = [];
  const seen = new Set<string>();

  outer: for (const m of profiles) {
    for (const svc of m.services) {
      if (out.length >= maxSlots) break outer;

      const slotDays = buildBookingSlotDays({
        anchorDate: anchor,
        masterId: m.masterId,
        serviceId: svc.id,
        duration: svc.duration,
      });
      const picked = pickFirstSlot(slotDays);
      if (!picked) continue;

      const dedupeKey = `${m.masterId}:${svc.id}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      out.push({
        id: `quick-${m.masterId}-${svc.id}-${picked.day.date}-${picked.slot.slotId}`,
        masterId: m.masterId,
        serviceId: svc.id,
        masterName: m.masterName,
        serviceTitle: svc.title,
        category: m.category,
        photoUrl: m.photoUrl,
        dateLabel: picked.day.dateLabel,
        timeLabel: picked.slot.timeLabel,
        price: svc.price,
        rating: m.rating,
        reviewsCount: m.reviewsCount,
        addressLabel: formatPublicAddress(m.location),
        slotId: picked.slot.slotId,
      });
    }
  }

  return out;
}
