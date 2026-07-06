import { AdminBottomSheet } from '../admin/shared/AdminBottomSheet';
import { billingOutlineBtn, billingPinkBtn } from '../admin/billing/adminBillingTheme';
import { ONBOARDING_PLAN_COPY } from './onboardingPlanCopy';

type Props = {
  open: boolean;
  activeCount: number;
  onClose: () => void;
  onChoosePro: () => void;
  onAdjustServices: () => void;
};

export function OnboardingFreeLimitSheet({
  open,
  activeCount,
  onClose,
  onChoosePro,
  onAdjustServices,
}: Props) {
  return (
    <AdminBottomSheet open={open} onClose={onClose} title={ONBOARDING_PLAN_COPY.paywallTitle} variant="catalog">
      <div className="space-y-4">
        <p className="text-[14px] leading-relaxed text-[#6B7280]">
          {ONBOARDING_PLAN_COPY.paywallBody(activeCount)}
        </p>
        <div className="flex flex-col gap-2 pt-1">
          <button type="button" onClick={onChoosePro} className={`min-h-12 w-full ${billingPinkBtn}`}>
            Подключить Pro
          </button>
          <button type="button" onClick={onAdjustServices} className={`min-h-12 w-full ${billingOutlineBtn}`}>
            Выбрать до 3 активных услуг
          </button>
          <button type="button" onClick={onClose} className="min-h-11 text-[14px] font-semibold text-[#6B7280]">
            Остаться бесплатно позже
          </button>
        </div>
      </div>
    </AdminBottomSheet>
  );
}
