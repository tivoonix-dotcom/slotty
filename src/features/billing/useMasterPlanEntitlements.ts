import { useMemo } from 'react';
import type { MasterSubscriptionDto } from '../admin/api/adminBillingApi';
import { useAdminMasterCabinet } from '../../pages/admin/AdminMasterCabinetContext';
import type { PlanId, PlanLimits } from './model/masterPlans';
import {
  canCreateMoreAppointments,
  countAppointmentsInCurrentMonth,
  getCurrentMasterPlan,
  getPlanLimits,
  isFreeAppointmentLimitReached as isFreeAppointmentLimitReachedLocal,
  isFreeServiceLimitReached as isFreeServiceLimitReachedLocal,
} from './model/masterPlans';

function planIdFromSubscription(sub: MasterSubscriptionDto | null): PlanId {
  if (!sub) return getCurrentMasterPlan().plan;
  return sub.plan.code === 'pro' ? 'pro' : 'free';
}

function limitsFromSubscription(sub: MasterSubscriptionDto | null, planId: PlanId): PlanLimits {
  if (!sub) return getPlanLimits(planId);
  return {
    maxServices: sub.plan.maxServices,
    maxMonthlyAppointments: sub.plan.maxMonthlyAppointments,
    scheduleHorizonDays: sub.plan.maxScheduleDaysAhead,
  };
}

/** Лимиты и счётчики тарифа: с API в кабинете мастера, иначе localStorage/demo. */
export function useMasterPlanEntitlements() {
  const { useCabinetApi, subscription, draft, appointments } = useAdminMasterCabinet();

  return useMemo(() => {
    const localPlan = getCurrentMasterPlan();
    const planId: PlanId = useCabinetApi && subscription ? planIdFromSubscription(subscription) : localPlan.plan;
    const limits = useCabinetApi && subscription ? limitsFromSubscription(subscription, planId) : getPlanLimits(planId);

    const servicesCount =
      useCabinetApi && subscription ? subscription.usage.activeServices : draft.services.length;
    const monthlyAppointments =
      useCabinetApi && subscription
        ? subscription.usage.monthlyAppointments
        : countAppointmentsInCurrentMonth(appointments);

    const freeServiceLimitReached =
      planId === 'free' &&
      typeof limits.maxServices === 'number' &&
      servicesCount >= limits.maxServices;

    const freeAppointmentLimitReached =
      planId === 'free' && !canCreateMoreAppointments('free', monthlyAppointments);

    const freeApptCap = limits.maxMonthlyAppointments;
    const freeAppointmentLimitAlmostReached =
      planId === 'free' &&
      typeof freeApptCap === 'number' &&
      monthlyAppointments >= freeApptCap - 2 &&
      monthlyAppointments < freeApptCap;

    return {
      planId,
      billingPeriod: useCabinetApi && subscription
        ? (subscription.billingPeriod === 'year' ? 'year' : 'month')
        : localPlan.billingPeriod,
      limits,
      servicesCount,
      monthlyAppointments,
      canUseBundlesAndPromotions: planId === 'pro',
      freeServiceLimitReached,
      freeAppointmentLimitReached,
      freeAppointmentLimitAlmostReached,
      /** @deprecated prefer freeServiceLimitReached in API mode */
      isFreeServiceLimitReached: (count: number) =>
        useCabinetApi && subscription ? freeServiceLimitReached : isFreeServiceLimitReachedLocal(count),
      isFreeAppointmentLimitReached: (count: number) =>
        useCabinetApi && subscription
          ? planId === 'free' && !canCreateMoreAppointments('free', count)
          : isFreeAppointmentLimitReachedLocal(count),
    };
  }, [appointments, draft.services.length, subscription, useCabinetApi]);
}
