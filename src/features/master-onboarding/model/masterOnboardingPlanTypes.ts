/**
 * Тарифы и лимиты для онбординга / профиля мастера.
 * (Отдельно от демо-биллинга в `features/billing/model/masterPlans.ts`.)
 */

export type MasterPlan = 'basic' | 'pro';

export type ProStatus = 'inactive' | 'interested' | 'active' | 'expired';

export type PlanFeature =
  | 'maxServices'
  | 'prioritySearch'
  | 'proBadge'
  | 'advancedStats'
  | 'promotions'
  | 'maxPortfolioPhotos'
  | 'clientBookings'
  | 'profile'
  | 'support';

export type PlanLimits = {
  maxServices: number;
  prioritySearch: boolean;
  proBadge: boolean;
  advancedStats: boolean;
  promotions: boolean;
  maxPortfolioPhotos: number;
};

/** Выбор на шаге онбординга: базовый или интерес к Pro без оплаты. */
export type MasterPlanSelection = 'basic' | 'pro_interest';

export const BASIC_ONBOARDING_LIMITS: PlanLimits = {
  maxServices: 3,
  prioritySearch: false,
  proBadge: false,
  advancedStats: false,
  promotions: false,
  maxPortfolioPhotos: 3,
};

export const PRO_ONBOARDING_LIMITS: PlanLimits = {
  maxServices: 999,
  prioritySearch: true,
  proBadge: true,
  advancedStats: true,
  promotions: true,
  maxPortfolioPhotos: 30,
};

export function planLimitsForSelection(sel: MasterPlanSelection): PlanLimits {
  return sel === 'pro_interest' ? PRO_ONBOARDING_LIMITS : BASIC_ONBOARDING_LIMITS;
}
