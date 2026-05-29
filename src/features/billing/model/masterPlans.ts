/**
 * Демо-хранение тарифа мастера в localStorage.
 * TODO: после подключения оплаты (Stripe / ЮKassa / ЕРИП) — планы и лимиты с сервера, проверка на бэкенде.
 */
import type { DemoMasterAppointment } from '../../master/model/demoMasterAppointments';

export type PlanId = 'free' | 'pro';
export type BillingPeriod = 'month' | 'year';

export type MasterPlanState = {
  plan: PlanId;
  billingPeriod: BillingPeriod;
  updatedAt: string;
};

export const MASTER_PLAN_STORAGE_KEY = 'slotty_master_plan';

const DEFAULT_STATE: MasterPlanState = {
  plan: 'free',
  billingPeriod: 'month',
  updatedAt: new Date(0).toISOString(),
};

export type PlanLimits = {
  maxServices: number | null;
  maxMonthlyAppointments: number | null;
  scheduleHorizonDays: number;
};

/** Наборы и акции доступны только на тарифе Pro. */
export function canUseBundlesAndPromotions(plan?: PlanId): boolean {
  const id = plan ?? getCurrentMasterPlan().plan;
  return id === 'pro';
}

export function planBadgeLabel(plan: PlanId): string {
  switch (plan) {
    case 'free':
      return 'Free';
    case 'pro':
      return 'Pro';
    default:
      return plan;
  }
}

export function getPlanLimits(plan: PlanId): PlanLimits {
  switch (plan) {
    case 'free':
      return {
        maxServices: 3,
        maxMonthlyAppointments: 20,
        scheduleHorizonDays: 14,
      };
    case 'pro':
      return {
        maxServices: null,
        maxMonthlyAppointments: null,
        scheduleHorizonDays: 90,
      };
    default:
      return getPlanLimits('free');
  }
}

function coercePlanId(raw: unknown): PlanId {
  if (raw === 'free' || raw === 'pro') return raw;
  /** Раньше был тариф Studio — мигрируем в Pro. */
  if (raw === 'studio') return 'pro';
  return 'free';
}

function parseStoredPlan(raw: string | null): MasterPlanState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<MasterPlanState> & { plan?: unknown };
    if (!v || typeof v !== 'object') return null;
    const plan = coercePlanId(v.plan);
    const billingPeriod =
      v.billingPeriod === 'year' || v.billingPeriod === 'month' ? v.billingPeriod : 'month';
    return {
      plan,
      billingPeriod,
      updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function getCurrentMasterPlan(): MasterPlanState {
  try {
    const parsed = parseStoredPlan(localStorage.getItem(MASTER_PLAN_STORAGE_KEY));
    return parsed ?? { ...DEFAULT_STATE, updatedAt: new Date().toISOString() };
  } catch {
    return { ...DEFAULT_STATE, updatedAt: new Date().toISOString() };
  }
}

export function saveCurrentMasterPlan(next: MasterPlanState): void {
  try {
    localStorage.setItem(MASTER_PLAN_STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('[SLOTTY] saveCurrentMasterPlan failed', e);
  }
}

/** Количество записей (не отменённых) в календарном месяце `date`. */
export function countAppointmentsInMonth(
  rows: DemoMasterAppointment[],
  year: number,
  month1to12: number,
): number {
  const ym = `${year}-${String(month1to12).padStart(2, '0')}`;
  return rows.filter((r) => r.status !== 'cancelled' && r.date.startsWith(ym)).length;
}

export function countAppointmentsInCurrentMonth(rows: DemoMasterAppointment[]): number {
  const d = new Date();
  return countAppointmentsInMonth(rows, d.getFullYear(), d.getMonth() + 1);
}

export function isFreeServiceLimitReached(servicesLength: number): boolean {
  const p = getCurrentMasterPlan();
  if (p.plan !== 'free') return false;
  const lim = getPlanLimits('free').maxServices;
  return typeof lim === 'number' && servicesLength >= lim;
}

export function canCreateMoreAppointments(plan: PlanId, monthlyAppointmentsCount: number): boolean {
  const lim = getPlanLimits(plan).maxMonthlyAppointments;
  if (lim == null) return true;
  return monthlyAppointmentsCount < lim;
}

export function isFreeAppointmentLimitAlmostReached(monthlyCount: number): boolean {
  const p = getCurrentMasterPlan();
  if (p.plan !== 'free') return false;
  const lim = getPlanLimits('free').maxMonthlyAppointments ?? 20;
  return monthlyCount >= lim - 2 && monthlyCount < lim;
}

export function isFreeAppointmentLimitReached(monthlyCount: number): boolean {
  const p = getCurrentMasterPlan();
  if (p.plan !== 'free') return false;
  const lim = getPlanLimits('free').maxMonthlyAppointments ?? 20;
  return monthlyCount >= lim;
}

export function priceForPlan(plan: PlanId, period: BillingPeriod): number {
  if (plan === 'free') return 0;
  return period === 'year' ? 290 : 29;
}

export function formatPlanPrice(plan: PlanId, period: BillingPeriod): string {
  const n = priceForPlan(plan, period);
  if (plan === 'free') return '0 BYN / месяц';
  const unit = period === 'year' ? 'год' : 'месяц';
  return `${n} BYN / ${unit}`;
}
