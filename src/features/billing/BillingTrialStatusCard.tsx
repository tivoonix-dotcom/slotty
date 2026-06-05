import { Link } from 'react-router-dom';
import { ADMIN_BILLING_PATH } from '../../app/paths';
import type { MasterEntitlementsDto } from './api/masterEntitlementsApi';
import { billingPlanDisplayFromEntitlements } from './billingTrialCopy';

type Props = {
  entitlements: MasterEntitlementsDto | null;
  uiState?: string;
  className?: string;
  compact?: boolean;
};

export function BillingTrialStatusCard({
  entitlements,
  uiState = 'free',
  className = '',
  compact = false,
}: Props) {
  if (!entitlements) return null;

  const display = billingPlanDisplayFromEntitlements(entitlements, uiState);
  const isTrial = entitlements.trial.isActive && entitlements.source === 'trial';
  const isExpiredTrial =
    entitlements.trial.consumed && !entitlements.isProEntitled && entitlements.effectivePlan === 'free';

  if (!isTrial && !isExpiredTrial && entitlements.source === 'paid') return null;

  const toneClass = isTrial
    ? entitlements.trial.daysLeft != null && entitlements.trial.daysLeft <= 2
      ? 'border-[#E29595]/40 bg-[#FFF5F5] text-[#7F1D1D]'
      : 'border-[#E29595]/25 bg-[#FFF8F8] text-[#374151]'
    : 'border-neutral-200/80 bg-[#FAFAFA] text-[#374151]';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm leading-snug ${toneClass} ${className}`} role="status">
      <p className="font-semibold text-[#111827]">{display.title}</p>
      {!compact ? <p className="mt-1 text-[13px] text-[#6B7280]">{display.subtitle}</p> : null}
      {display.showUpgradeCta ? (
        <Link
          to={ADMIN_BILLING_PATH}
          className="mt-2 inline-flex min-h-9 items-center rounded-full bg-[#E29595] px-4 text-[13px] font-semibold text-white transition active:scale-[0.98]"
        >
          Продлить Pro
        </Link>
      ) : null}
    </div>
  );
}
