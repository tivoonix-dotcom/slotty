import type { BillingPackageMonths } from '../../../features/billing/billingCopy';
import { BILLING_COPY, billingPackageLabel } from '../../../features/billing/billingCopy';
import { billingSegmentBtn, billingSegmentWrap, billingTrayLabel } from './adminBillingTheme';

type Props = {
  packageMonths: BillingPackageMonths;
  onPackage: (months: BillingPackageMonths) => void;
  showLabel?: boolean;
  variant?: 'panel' | 'proCard';
};

const PACKAGES: BillingPackageMonths[] = [1, 3, 12];

export function BillingPeriodSwitch({
  packageMonths,
  onPackage,
  showLabel = true,
  variant = 'panel',
}: Props) {
  const inPro = variant === 'proCard';
  const labelClass = inPro
    ? 'mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/80'
    : billingTrayLabel;
  const segmentWrap = inPro
    ? 'grid grid-cols-3 gap-1 rounded-[12px] bg-white/20 p-1 backdrop-blur-sm'
    : `${billingSegmentWrap} grid-cols-3`;
  const segmentBtn = (active: boolean) =>
    inPro
      ? `flex min-h-10 w-full items-center justify-center rounded-[10px] px-1 text-[13px] font-semibold transition active:scale-[0.98] ${
          active
            ? 'bg-white text-[#111827] shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
            : 'bg-transparent text-white/90 hover:text-white'
        }`
      : `${billingSegmentBtn(active)} px-1 text-[13px]`;

  return (
    <div>
      {showLabel ? <p className={labelClass}>Период оплаты</p> : null}
      <div className={segmentWrap} role="group" aria-label="Период оплаты">
        {PACKAGES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onPackage(m)}
            className={segmentBtn(packageMonths === m)}
            aria-pressed={packageMonths === m}
          >
            {billingPackageLabel(m)}
          </button>
        ))}
      </div>
      {packageMonths === 3 ? (
        <p className={inPro ? 'mt-2.5 text-center text-[12px] font-medium text-white/75' : 'mt-2.5 text-center text-[12px] font-medium text-[#9CA3AF]'}>
          {BILLING_COPY.period3Months}
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated use BillingPackageMonths from billingCopy */
export type BillingPeriod = 'month' | 'year';
