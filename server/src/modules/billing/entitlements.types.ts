export type EffectiveMasterPlan = 'free' | 'trial_pro' | 'pro';

export type EntitlementSource = 'free' | 'trial' | 'paid' | 'complimentary' | 'grace';

export type MasterEntitlements = {
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
