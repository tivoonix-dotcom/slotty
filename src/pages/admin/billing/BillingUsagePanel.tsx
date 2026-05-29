import type { PlanId } from '../../../features/billing/model/masterPlans';
import { billingPanel, billingTrayLabel } from './adminBillingTheme';

function progressClass(ratio: number): string {
  if (ratio >= 1) return 'bg-[#EF4444]';
  if (ratio >= 0.85) return 'bg-amber-400';
  return 'bg-[#F47C8C]';
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[14px]">
      <span className="font-medium text-[#6B7280]">{label}</span>
      <span className="font-semibold tabular-nums text-[#111827]">{value}</span>
    </div>
  );
}

type Props = {
  plan: PlanId;
  servicesLen: number;
  maxSvc: number;
  monthlyCount: number;
  maxAppt: number;
  scheduleHorizonDays: number;
};

export function BillingUsagePanel({
  plan,
  servicesLen,
  maxSvc,
  monthlyCount,
  maxAppt,
  scheduleHorizonDays,
}: Props) {
  const isFree = plan === 'free';

  return (
    <section className={`${billingPanel} py-3.5 sm:p-4`}>
      <p className={billingTrayLabel}>{isFree ? 'Использование на Free' : 'Ваш Pro'}</p>

      {isFree ? (
        <div className="space-y-4">
          <div>
            <UsageRow label="Услуги" value={`${servicesLen} / ${maxSvc}`} />
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1EFEF]">
              <div
                className={`h-full rounded-full transition-all ${progressClass(servicesLen / maxSvc)}`}
                style={{ width: `${Math.min(100, (servicesLen / maxSvc) * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <UsageRow label="Записи в этом месяце" value={`${monthlyCount} / ${maxAppt}`} />
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1EFEF]">
              <div
                className={`h-full rounded-full transition-all ${progressClass(monthlyCount / maxAppt)}`}
                style={{ width: `${Math.min(100, (monthlyCount / maxAppt) * 100)}%` }}
              />
            </div>
          </div>
          <UsageRow label="График работы" value={`${scheduleHorizonDays} дней`} />
        </div>
      ) : (
        <div className="space-y-3">
          <UsageRow label="Услуги" value="безлимит" />
          <UsageRow label="Записи" value="безлимит" />
          <UsageRow label="График работы" value={`${scheduleHorizonDays} дней`} />
        </div>
      )}
    </section>
  );
}
