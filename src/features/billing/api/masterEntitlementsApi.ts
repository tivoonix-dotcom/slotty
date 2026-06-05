import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type EffectiveMasterPlan = 'free' | 'trial_pro' | 'pro';

export type EntitlementSource = 'free' | 'trial' | 'paid' | 'complimentary' | 'grace';

export type MasterEntitlementsDto = {
  effectivePlan: EffectiveMasterPlan;
  isProEntitled: boolean;
  source: EntitlementSource;
  trial: {
    isActive: boolean;
    startedAt: string | null;
    endsAt: string | null;
    daysLeft: number | null;
    consumed: boolean;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  limits: {
    maxServices: number | null;
    maxMonthlyAppointments: number | null;
    scheduleHorizonDays: number;
    maxPortfolioPhotos: number;
  };
  features: {
    advancedAnalytics: boolean;
    bundlesAndPromotions: boolean;
    smartPromotions: boolean;
    catalogBoost: boolean;
    priorityListing: boolean;
    proBadge: boolean;
    pdfExport: boolean;
    dataExport: boolean;
    advancedCrm: boolean;
  };
};

export async function getMyMasterEntitlements(): Promise<MasterEntitlementsDto> {
  const res = await apiFetch('/api/masters/me/entitlements');
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
  const j = (await res.json()) as { entitlements: MasterEntitlementsDto };
  return j.entitlements;
}
