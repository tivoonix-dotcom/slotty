import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export type BillingPlanDto = {
  id: string;
  code: string;
  name: string;
  priceMonth: number;
  priceYear: number;
  maxServices: number | null;
  maxMonthlyAppointments: number | null;
  maxScheduleDaysAhead: number;
  canUseAnalytics: boolean;
  canUsePdf: boolean;
  canUsePriorityListing: boolean;
  sortOrder: number;
};

export type MasterSubscriptionPlanDto = {
  code: string;
  name: string;
  priceMonth: number;
  priceYear: number;
  maxServices: number | null;
  maxMonthlyAppointments: number | null;
  maxScheduleDaysAhead: number;
  canUseAnalytics: boolean;
  canUsePdf: boolean;
  canUsePriorityListing: boolean;
};

export type MasterSubscriptionDto = {
  id: string;
  masterId: string;
  status: string;
  billingPeriod: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: MasterSubscriptionPlanDto;
  usage: {
    activeServices: number;
    monthlyAppointments: number;
  };
};

export async function getBillingPlans(): Promise<BillingPlanDto[]> {
  const res = await apiFetch('/api/billing/plans', { skipAuth: true });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { plans?: BillingPlanDto[] };
  return j.plans ?? [];
}

export async function getMySubscription(): Promise<MasterSubscriptionDto> {
  const res = await apiFetch('/api/masters/me/subscription');
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { subscription: MasterSubscriptionDto };
  return j.subscription;
}

export async function switchMySubscriptionMock(
  planCode: 'free' | 'pro',
  billingPeriod: 'month' | 'year',
): Promise<MasterSubscriptionDto> {
  const res = await apiFetch('/api/masters/me/subscription/mock', {
    method: 'PATCH',
    body: JSON.stringify({ planCode, billingPeriod }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { subscription: MasterSubscriptionDto };
  return j.subscription;
}
