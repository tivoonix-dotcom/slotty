import type { PlanLimits } from './model/masterPlans';

/** Горизонт расписания: entitlements в live mode, demo fallback только в dev. */
export function resolveScheduleHorizonDays(
  useCabinetApi: boolean,
  limits: Pick<PlanLimits, 'scheduleHorizonDays'> | null | undefined,
  demoAllowed: boolean,
): number {
  if (useCabinetApi) return limits?.scheduleHorizonDays ?? 14;
  return demoAllowed ? 90 : 14;
}
