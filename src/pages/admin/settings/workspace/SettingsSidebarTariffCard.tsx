import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_BILLING_PATH } from '../../../../app/paths';
import { planBadgeLabel, type PlanId } from '../../../../features/billing/model/masterPlans';
import {
  getBillingSubscription,
  type BillingSubscriptionResponse,
  type SubscriptionUiState,
} from '../../../../features/billing/api/masterBillingApi';
import { getApiBaseUrl } from '../../../../shared/api/backendClient';
import { useMasterPlanEntitlements } from '../../../../features/billing/useMasterPlanEntitlements';
import { useAdminMasterCabinet } from '../../AdminMasterCabinetContext';
import { formatBillingDate } from '../../billing/billingFormat';
import { adminSidebarTariffCard } from '../../adminCabinetLayout';
import { AdminTariffSidebarCardContent } from '../../shared/AdminTariffSidebarCardContent';

type Props = {
  onNavigate?: () => void;
};

function resolvePlanId(
  uiState: SubscriptionUiState,
  billing: BillingSubscriptionResponse | null,
  demoPlan: PlanId,
): PlanId {
  if (!billing) return demoPlan;
  if (
    uiState === 'pro_active' ||
    uiState === 'pro_canceled_at_period_end' ||
    uiState === 'past_due'
  ) {
    return 'pro';
  }
  return 'free';
}

function sidebarTariffSubtitle(
  uiState: SubscriptionUiState,
  billing: BillingSubscriptionResponse | null,
  demoPlan: PlanId,
): string {
  if (!billing && demoPlan === 'pro') {
    return 'Подписка активна (demo)';
  }
  if (!billing) {
    return 'До 3 услуг · 20 записей/мес';
  }

  const periodEnd = formatBillingDate(billing.currentPeriodEnd);
  const nextCharge = formatBillingDate(billing.nextChargeAt);

  switch (uiState) {
    case 'pro_active':
      return nextCharge ? `Следующее списание: ${nextCharge}` : 'Управление подпиской и лимитами';
    case 'pro_canceled_at_period_end':
      return periodEnd
        ? `Активен до ${periodEnd} · автопродление выкл.`
        : 'Автопродление отключено';
    case 'past_due':
      return 'Платёж не прошёл — обновите карту';
    case 'expired':
      return 'Pro закончился — подключите снова';
    default:
      return 'До 3 услуг · 20 записей/мес';
  }
}

export function SettingsSidebarTariffCard({ onNavigate }: Props) {
  const { planId } = useMasterPlanEntitlements();
  const { useCabinetApi } = useAdminMasterCabinet();
  const [billing, setBilling] = useState<BillingSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(useCabinetApi && getApiBaseUrl()));

  const reload = useCallback(async () => {
    if (!useCabinetApi || !getApiBaseUrl()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setBilling(await getBillingSubscription());
    } catch {
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const uiState: SubscriptionUiState =
    billing?.uiState ?? (planId === 'pro' ? 'pro_active' : 'free');
  const effectivePlan = resolvePlanId(uiState, billing, planId);
  const subtitle = sidebarTariffSubtitle(uiState, billing, planId);

  return (
    <Link
      to={MASTER_SETTINGS_BILLING_PATH}
      onClick={onNavigate}
      className={`${adminSidebarTariffCard} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/40`}
      aria-label="Управление тарифом"
    >
      <AdminTariffSidebarCardContent
        loading={loading}
        planLabel={planBadgeLabel(effectivePlan)}
        subtitle={subtitle}
        planId={effectivePlan}
      />
    </Link>
  );
}
