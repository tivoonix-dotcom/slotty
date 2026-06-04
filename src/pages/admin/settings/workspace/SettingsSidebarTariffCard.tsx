import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_BILLING_PATH } from '../../../../app/paths';
import {
  getBillingSubscription,
  type BillingSubscriptionResponse,
  type SubscriptionUiState,
} from '../../../../features/billing/api/masterBillingApi';
import { getApiBaseUrl } from '../../../../shared/api/backendClient';
import { useMasterPlanEntitlements } from '../../../../features/billing/useMasterPlanEntitlements';
import { useAdminMasterCabinet } from '../../AdminMasterCabinetContext';
import { formatBillingDate } from '../../billing/billingFormat';
import { SettingsStatusBadge } from './settingsUi';

type Props = {
  onNavigate?: () => void;
};

function sidebarTariffCopy(
  uiState: SubscriptionUiState,
  billing: BillingSubscriptionResponse | null,
  demoPlan: 'free' | 'pro',
): { title: string; subtitle: string } {
  if (!billing && demoPlan === 'pro') {
    return { title: 'Master Pro', subtitle: 'Подписка активна (demo)' };
  }
  if (!billing) {
    return {
      title: 'Free',
      subtitle: 'До 3 услуг · 20 записей/мес',
    };
  }

  const periodEnd = formatBillingDate(billing.currentPeriodEnd);
  const nextCharge = formatBillingDate(billing.nextChargeAt);

  switch (uiState) {
    case 'pro_active':
      return {
        title: 'Master Pro',
        subtitle: nextCharge ? `Следующее списание: ${nextCharge}` : 'Подписка активна',
      };
    case 'pro_canceled_at_period_end':
      return {
        title: 'Master Pro',
        subtitle: periodEnd
          ? `Активен до ${periodEnd} · автопродление выкл.`
          : 'Автопродление отключено',
      };
    case 'past_due':
      return {
        title: 'Master Pro',
        subtitle: 'Платёж не прошёл — обновите карту',
      };
    case 'expired':
      return {
        title: 'Free',
        subtitle: 'Pro закончился — подключите снова',
      };
    default:
      return {
        title: 'Free',
        subtitle: 'До 3 услуг · 20 записей/мес',
      };
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
  const copy = sidebarTariffCopy(uiState, billing, planId);

  return (
    <Link
      to={MASTER_SETTINGS_BILLING_PATH}
      onClick={onNavigate}
      className="block rounded-[14px] bg-[#FFF1F4] p-3.5 no-underline transition hover:bg-[#FFE8EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/40"
      aria-label="Управление тарифом"
    >
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-24 rounded bg-[#FDE8ED]" />
          <div className="h-3 w-full rounded bg-[#FDE8ED]" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-[#ff5f7a]">{copy.title}</p>
            {uiState === 'past_due' ? (
              <SettingsStatusBadge tone="warning">!</SettingsStatusBadge>
            ) : null}
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-[#6B7280]">{copy.subtitle}</p>
          <span className="mt-2 inline-flex min-h-[40px] items-center gap-1 text-[12px] font-semibold text-[#ff5f7a]">
            Управление тарифом
            <span aria-hidden>→</span>
          </span>
        </>
      )}
    </Link>
  );
}
