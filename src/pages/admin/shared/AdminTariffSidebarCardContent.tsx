import type { ReactNode } from 'react';
import { SlottyProSparkleIcon } from '../../../shared/ui/SlottyProSparkleIcon';
import type { PlanId } from '../../../features/billing/model/masterPlans';

type Props = {
  planLabel: string;
  subtitle: string;
  planId?: PlanId;
  loading?: boolean;
  trailing?: ReactNode;
};

export function AdminTariffSidebarCardContent({
  planLabel,
  subtitle,
  planId,
  loading = false,
  trailing,
}: Props) {
  if (loading) {
    return (
      <div className="flex w-full animate-pulse items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-[12px] bg-[#EBEBEB]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-[#EBEBEB]" />
          <div className="h-3 w-full rounded bg-[#E4E4E4]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4]">
        <SlottyProSparkleIcon size={20} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[14px] font-semibold tracking-[-0.02em] text-[#111827]">
          Тариф {planLabel}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#6B7280]">{subtitle}</p>
      </div>
      {trailing ?? (
        planId === 'pro' ? (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#F47C8C] ring-2 ring-[#F47C8C]/25"
            title="Pro активен"
            aria-hidden
          />
        ) : null
      )}
    </>
  );
}
