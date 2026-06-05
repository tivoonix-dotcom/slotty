import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminMasterCabinet } from '../../pages/admin/AdminMasterCabinetContext';
import { isDevDemoAllowed } from '../../shared/lib/appMode';
import { getMyMasterEntitlements, type MasterEntitlementsDto } from './api/masterEntitlementsApi';
import type { PlanId, PlanLimits } from './model/masterPlans';
import {
  canCreateMoreAppointments,
  countAppointmentsInCurrentMonth,
  getCurrentMasterPlan,
  getPlanLimits,
  isFreeAppointmentLimitReached as isFreeAppointmentLimitReachedLocal,
  isFreeServiceLimitReached as isFreeServiceLimitReachedLocal,
} from './model/masterPlans';

function limitsFromEntitlements(ent: MasterEntitlementsDto): PlanLimits {
  return {
    maxServices: ent.limits.maxServices,
    maxMonthlyAppointments: ent.limits.maxMonthlyAppointments,
    scheduleHorizonDays: ent.limits.scheduleHorizonDays,
  };
}

/** Entitlements с API — единственный источник прав в live mode. */
export function useMasterEntitlements(): {
  entitlements: MasterEntitlementsDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { useCabinetApi, subscription } = useAdminMasterCabinet();
  const [entitlements, setEntitlements] = useState<MasterEntitlementsDto | null>(null);
  const [loading, setLoading] = useState(useCabinetApi);

  const refresh = useCallback(async () => {
    if (!useCabinetApi) {
      setEntitlements(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setEntitlements(await getMyMasterEntitlements());
    } catch {
      setEntitlements(null);
    } finally {
      setLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    void refresh();
  }, [refresh, subscription?.status, subscription?.currentPeriodEnd]);

  return { entitlements, loading, refresh };
}

/** Лимиты и счётчики тарифа: entitlements API в кабинете, localStorage только в dev demo. */
export function useMasterPlanEntitlements() {
  const { useCabinetApi, subscription, draft, appointments, cabinetLoading } = useAdminMasterCabinet();
  const { entitlements, loading: entitlementsLoading } = useMasterEntitlements();

  return useMemo(() => {
    const demoPlanAllowed = isDevDemoAllowed();
    const localPlan =
      demoPlanAllowed && !useCabinetApi
        ? getCurrentMasterPlan()
        : { plan: 'free' as PlanId, billingPeriod: 'month' as const, updatedAt: '' };

    const subscriptionPending =
      useCabinetApi && (cabinetLoading || entitlementsLoading) && entitlements == null;

    const planId: PlanId =
      useCabinetApi && entitlements
        ? entitlements.isProEntitled
          ? 'pro'
          : 'free'
        : localPlan.plan;

    const limits: PlanLimits =
      useCabinetApi && entitlements ? limitsFromEntitlements(entitlements) : getPlanLimits(planId);

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
      effectivePlan: entitlements?.effectivePlan ?? (planId === 'pro' ? 'pro' : 'free'),
      isProEntitled: entitlements?.isProEntitled ?? planId === 'pro',
      entitlements,
      entitlementsLoading,
      subscriptionPending,
      billingPeriod:
        useCabinetApi && subscription
          ? subscription.billingPeriod === 'year'
            ? 'year'
            : 'month'
          : localPlan.billingPeriod,
      limits,
      servicesCount,
      monthlyAppointments,
      canUseBundlesAndPromotions: entitlements?.features.bundlesAndPromotions ?? planId === 'pro',
      canUseAdvancedAnalytics: entitlements?.features.advancedAnalytics ?? planId === 'pro',
      canUseDataExport: entitlements?.features.dataExport ?? planId === 'pro',
      freeServiceLimitReached,
      freeAppointmentLimitReached,
      freeAppointmentLimitAlmostReached,
      isFreeServiceLimitReached: (count: number) =>
        useCabinetApi && entitlements ? freeServiceLimitReached : isFreeServiceLimitReachedLocal(count),
      isFreeAppointmentLimitReached: (count: number) =>
        useCabinetApi && entitlements
          ? planId === 'free' && !canCreateMoreAppointments('free', count)
          : isFreeAppointmentLimitReachedLocal(count),
    };
  }, [
    appointments,
    cabinetLoading,
    draft.services.length,
    entitlements,
    entitlementsLoading,
    subscription,
    useCabinetApi,
  ]);
}
