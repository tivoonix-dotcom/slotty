import { Link } from 'react-router-dom';
import { HiArrowRight, HiSparkles } from 'react-icons/hi2';
import { ADMIN_BILLING_PATH, ADMIN_SERVICES_PATH } from '../../../app/paths';
import { CABINET_PLAN_COPY } from '../../../features/billing/masterCabinetPlanCopy';
import { useMasterPlanEntitlements } from '../../../features/billing/useMasterPlanEntitlements';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { getPlanLimits } from '../../../features/billing/model/masterPlans';

function formatPeriodEnd(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

type Props = {
  className?: string;
};

/** Карточка тарифа Free/Pro на главной сводке кабинета. */
export function MasterPlanStatusBanner({ className = '' }: Props) {
  const { subscription, cabinetLoading, draft } = useAdminMasterCabinet();
  const {
    isProEntitled,
    servicesCount,
    limits,
    subscriptionPending,
    entitlementsLoading,
  } = useMasterPlanEntitlements();

  const loading = subscriptionPending || entitlementsLoading || cabinetLoading;
  const maxFree = limits.maxServices ?? getPlanLimits('free').maxServices ?? 3;
  const activeCount = servicesCount;
  const totalServices = draft.services?.length ?? activeCount;
  const inactiveCount = Math.max(0, totalServices - activeCount);

  if (loading) {
    return (
      <section
        className={`rounded-[16px] bg-[#F9FAFB] px-4 py-3 text-[13px] font-medium text-[#6B7280] lg:rounded-[20px] ${className}`.trim()}
      >
        {CABINET_PLAN_COPY.loading}
      </section>
    );
  }

  if (isProEntitled) {
    const periodEnd = formatPeriodEnd(subscription?.currentPeriodEnd);
    const isTrialing = subscription?.status === 'trialing';
    const periodHint = periodEnd
      ? isTrialing
        ? CABINET_PLAN_COPY.proTrialUntil(periodEnd)
        : CABINET_PLAN_COPY.proActiveUntil(periodEnd)
      : null;

    return (
      <section
        className={`overflow-hidden rounded-[16px] bg-gradient-to-br from-[#FFF9FB] to-[#FFF1F4] p-4 ring-1 ring-[#FDE8ED] sm:p-5 lg:rounded-[20px] ${className}`.trim()}
        aria-label="Статус тарифа Pro"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#F47C8C]">
              <HiSparkles className="h-3.5 w-3.5" aria-hidden />
              Pro
            </p>
            <h2 className="mt-1 text-[17px] font-black tracking-[-0.03em] text-[#111827] sm:text-[18px]">
              {CABINET_PLAN_COPY.proTitle}
            </h2>
            <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-[#6B7280] sm:text-[14px]">
              {CABINET_PLAN_COPY.proBody}
            </p>
            {periodHint ? (
              <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">{periodHint}</p>
            ) : null}
          </div>
          <Link
            to={ADMIN_BILLING_PATH}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-[12px] bg-white px-4 text-[13px] font-bold text-[#111827] ring-1 ring-[#FDE8ED] transition hover:bg-[#FFF9FB]"
          >
            Управление подпиской
            <HiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  const atLimit = activeCount >= maxFree;
  const hasInactive = inactiveCount > 0;

  let detail: string = CABINET_PLAN_COPY.freeBody;
  if (atLimit) {
    detail = CABINET_PLAN_COPY.freeLimitReached(maxFree);
  } else if (hasInactive) {
    detail = CABINET_PLAN_COPY.freeInactiveServices(inactiveCount);
  }

  return (
    <section
      className={`overflow-hidden rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE] sm:p-5 lg:rounded-[20px] ${className}`.trim()}
      aria-label="Статус бесплатного тарифа"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Тариф</p>
          <h2 className="mt-1 text-[17px] font-black tracking-[-0.03em] text-[#111827] sm:text-[18px]">
            {CABINET_PLAN_COPY.freeTitle}
          </h2>
          <p className="mt-1.5 text-[13px] font-semibold text-[#F47C8C]">
            {CABINET_PLAN_COPY.freeActiveServices(activeCount, maxFree)}
          </p>
          <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-[#6B7280] sm:text-[14px]">
            {detail}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            to={ADMIN_BILLING_PATH}
            className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[12px] bg-[#F47C8C] px-4 text-[13px] font-bold text-white transition hover:opacity-95 sm:w-auto"
          >
            {CABINET_PLAN_COPY.connectPro}
            <HiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to={ADMIN_SERVICES_PATH}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-[12px] bg-[#F1EFEF] px-4 text-[13px] font-semibold text-[#111827] transition hover:bg-[#EBE8E8] sm:w-auto"
          >
            {CABINET_PLAN_COPY.manageServices}
          </Link>
        </div>
      </div>
    </section>
  );
}
