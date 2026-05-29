/** Лимиты портфолио (не в subscription_plans seed). */
export const PORTFOLIO_PHOTO_LIMITS = {
  free: 3,
  pro: 30,
} as const;

export type EffectivePlanCode = 'free' | 'pro';
