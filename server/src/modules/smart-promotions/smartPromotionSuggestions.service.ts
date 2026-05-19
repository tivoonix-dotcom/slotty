import { query } from '../../config/db.js';
import { getMasterSubscriptionWithUsage } from '../billing/billing.service.js';
import {
  listServiceWidePromotionCoverage,
  listSlotIdsWithActivePromotion,
} from '../service-extras/promotionSlots.service.js';
import {
  addDaysToDateKey,
  dateKeyMinsk,
  formatDayLabelMinsk,
  formatHmMinsk,
} from './minskDate.js';

const DEFAULT_HORIZON_DAYS = 7;
const MAX_HORIZON_DAYS = 14;
const DEFAULT_DISCOUNT_PERCENT = 15;
const MAX_GAP_MS = 60_000;

export type SmartPromotionSuggestionDto = {
  id: string;
  type: 'free_slots_discount';
  title: string;
  description: string;
  discountPercent: number;
  slotIds: string[];
  serviceId: string;
  serviceTitle: string;
  startsAt: string;
  endsAt: string;
  expiresAt: string;
  promotionDraft: {
    template: string;
    title: string;
    description: string;
    serviceId: string;
    discountType: 'percent';
    discountValue: number;
    discountLabel: string;
    startsAt: string;
    endsAt: string;
    publish: boolean;
    slotIds: string[];
  };
};

export type SmartPromotionSuggestionsResult = {
  suggestions: SmartPromotionSuggestionDto[];
  entitlements: {
    canUseSmartPromotions: boolean;
    canUseBundlesAndPromotions: boolean;
    planCode: string;
    requiredPlan?: 'pro';
  };
  meta: {
    horizonDays: number;
    discountPercent: number;
    eligibleSlotCount: number;
  };
};

type FreeSlotRow = {
  id: string;
  service_id: string | null;
  starts_at: Date;
  ends_at: Date;
  effective_service_id: string;
  service_title: string;
};

type PromoCoverRow = {
  service_id: string;
  starts_at: string;
  ends_at: string;
};

type SlotGroup = {
  dayKey: string;
  serviceId: string;
  serviceTitle: string;
  slots: FreeSlotRow[];
};

async function isMasterOnProPlan(masterId: string): Promise<{ pro: boolean; planCode: string }> {
  const sub = await getMasterSubscriptionWithUsage(masterId);
  const code = sub.plan.code.toLowerCase();
  return { pro: code === 'pro', planCode: code };
}

async function listFreeSlots(masterId: string, horizonDays: number): Promise<FreeSlotRow[]> {
  const r = await query<{
    id: string;
    service_id: string | null;
    starts_at: Date;
    ends_at: Date;
    effective_service_id: string;
    service_title: string;
  }>(
    `select
        s.id,
        s.service_id,
        s.starts_at,
        s.ends_at,
        coalesce(
          s.service_id,
          (
            select ms.id
              from public.master_services ms
             where ms.master_id = s.master_id
               and ms.is_active = true
             order by ms.sort_order asc, ms.created_at asc
             limit 1
          )
        ) as effective_service_id,
        coalesce(ms.title, ms_fallback.title, 'Услуга') as service_title
       from public.master_availability_slots s
       left join public.master_services ms
         on ms.id = s.service_id and ms.master_id = s.master_id
       left join lateral (
         select ms2.title
           from public.master_services ms2
          where ms2.id = coalesce(
            s.service_id,
            (
              select ms3.id
                from public.master_services ms3
               where ms3.master_id = s.master_id and ms3.is_active = true
               order by ms3.sort_order asc, ms3.created_at asc
               limit 1
            )
          )
       ) ms_fallback on true
      where s.master_id = $1
        and s.status = 'available'
        and s.ends_at > now()
        and s.starts_at < now() + ($2::int || ' days')::interval
        and not exists (
          select 1
            from public.appointments a
           where a.slot_id = s.id
             and a.status in ('pending', 'confirmed')
        )
      order by s.starts_at asc`,
    [masterId, horizonDays],
  );

  return r.rows.filter((row) => row.effective_service_id != null) as FreeSlotRow[];
}

function slotCoveredByServiceWidePromotion(slot: FreeSlotRow, promos: PromoCoverRow[]): boolean {
  const day = dateKeyMinsk(slot.starts_at);
  return promos.some(
    (p) =>
      p.service_id === slot.effective_service_id &&
      day >= p.starts_at.slice(0, 10) &&
      day <= p.ends_at.slice(0, 10),
  );
}

function groupFreeSlots(
  slots: FreeSlotRow[],
  serviceWidePromos: PromoCoverRow[],
  slotIdsWithPromo: Set<string>,
): SlotGroup[] {
  const groups: SlotGroup[] = [];
  let current: SlotGroup | null = null;

  for (const slot of slots) {
    if (slotIdsWithPromo.has(slot.id) || slotCoveredByServiceWidePromotion(slot, serviceWidePromos)) {
      current = null;
      continue;
    }

    const dayKey = dateKeyMinsk(slot.starts_at);
    const prevEnds = current?.slots[current.slots.length - 1]?.ends_at;

    const sameGroup =
      current &&
      current.dayKey === dayKey &&
      current.serviceId === slot.effective_service_id &&
      prevEnds &&
      new Date(slot.starts_at).getTime() - new Date(prevEnds).getTime() <= MAX_GAP_MS;

    if (sameGroup && current) {
      current.slots.push(slot);
    } else {
      if (current?.slots.length) groups.push(current);
      current = {
        dayKey,
        serviceId: slot.effective_service_id,
        serviceTitle: slot.service_title,
        slots: [slot],
      };
    }
  }

  if (current?.slots.length) groups.push(current);
  return groups;
}

function buildSuggestionId(group: SlotGroup): string {
  const slotPart = group.slots.map((s) => s.id).join('_');
  return `free_slots_${group.dayKey}_${slotPart.slice(0, 80)}`;
}

function buildSuggestion(
  group: SlotGroup,
  discountPercent: number,
  todayKey: string,
  tomorrowKey: string,
): SmartPromotionSuggestionDto {
  const first = group.slots[0]!;
  const last = group.slots[group.slots.length - 1]!;
  const startsAt = new Date(first.starts_at).toISOString();
  const endsAt = new Date(last.ends_at).toISOString();
  const dayLabel = formatDayLabelMinsk(group.dayKey, todayKey, tomorrowKey);
  const timeFrom = formatHmMinsk(first.starts_at);
  const timeTo = formatHmMinsk(last.ends_at);
  const title =
    group.dayKey === todayKey
      ? 'Свободные окна сегодня'
      : `Свободные окна ${dayLabel}`;

  const description = `У вас свободно ${dayLabel} с ${timeFrom} до ${timeTo}. Создать акцию -${discountPercent}% на эти окна?`;
  const promoTitle = `-${discountPercent}% ${dayLabel} ${timeFrom}–${timeTo}`;

  return {
    id: buildSuggestionId(group),
    type: 'free_slots_discount',
    title,
    description,
    discountPercent,
    slotIds: group.slots.map((s) => s.id),
    serviceId: group.serviceId,
    serviceTitle: group.serviceTitle,
    startsAt,
    endsAt,
    expiresAt: endsAt,
    promotionDraft: {
      template: 'free_slots',
      title: promoTitle,
      description: `Скидка ${discountPercent}% на свободные окна ${dayLabel} (${timeFrom}–${timeTo}).`,
      serviceId: group.serviceId,
      discountType: 'percent',
      discountValue: discountPercent,
      discountLabel: `-${discountPercent}%`,
      startsAt: group.dayKey,
      endsAt: group.dayKey,
      publish: true,
      slotIds: group.slots.map((s) => s.id),
    },
  };
}

export async function getSmartPromotionSuggestions(
  masterId: string,
  opts?: { horizonDays?: number; discountPercent?: number },
): Promise<SmartPromotionSuggestionsResult> {
  const horizonDays = Math.min(
    MAX_HORIZON_DAYS,
    Math.max(1, opts?.horizonDays ?? DEFAULT_HORIZON_DAYS),
  );
  const discountPercent = Math.min(
    90,
    Math.max(1, Math.round(opts?.discountPercent ?? DEFAULT_DISCOUNT_PERCENT)),
  );

  const { pro, planCode } = await isMasterOnProPlan(masterId);

  if (!pro) {
    return {
      suggestions: [],
      entitlements: {
        canUseSmartPromotions: false,
        canUseBundlesAndPromotions: false,
        planCode,
        requiredPlan: 'pro',
      },
      meta: {
        horizonDays,
        discountPercent,
        eligibleSlotCount: 0,
      },
    };
  }

  const [slots, serviceWidePromos, slotIdsWithPromo] = await Promise.all([
    listFreeSlots(masterId, horizonDays),
    listServiceWidePromotionCoverage(masterId),
    listSlotIdsWithActivePromotion(masterId),
  ]);

  const groups = groupFreeSlots(slots, serviceWidePromos, slotIdsWithPromo);
  const todayKey = dateKeyMinsk(new Date());
  const tomorrowKey = addDaysToDateKey(todayKey, 1);

  const suggestions = groups.map((g) => buildSuggestion(g, discountPercent, todayKey, tomorrowKey));

  return {
    suggestions,
    entitlements: {
      canUseSmartPromotions: true,
      canUseBundlesAndPromotions: true,
      planCode,
    },
    meta: {
      horizonDays,
      discountPercent,
      eligibleSlotCount: slots.length,
    },
  };
}
