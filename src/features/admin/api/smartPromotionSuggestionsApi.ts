import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

async function readApiError(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

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

export type SmartPromotionSuggestionsResponse = {
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

export async function fetchSmartPromotionSuggestions(params?: {
  days?: number;
  discountPercent?: number;
}): Promise<SmartPromotionSuggestionsResponse> {
  const q = new URLSearchParams();
  if (params?.days != null) q.set('days', String(params.days));
  if (params?.discountPercent != null) q.set('discountPercent', String(params.discountPercent));
  const suffix = q.toString() ? `?${q.toString()}` : '';
  const res = await apiFetch(`/api/masters/me/smart-promotion-suggestions${suffix}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as SmartPromotionSuggestionsResponse;
}
