import { useCallback, useEffect, useState } from 'react';
import {
  cancelSubscriptionAutoRenew,
  getBillingSubscription,
  listBillingPayments,
  resumeSubscriptionAutoRenew,
  retrySubscriptionPayment,
  updatePaymentMethodCheckout,
  type BillingPaymentDto,
  type BillingSubscriptionResponse,
} from '../../../../../features/billing/api/masterBillingApi';
import { PAYMENT_SUCCESS_PATH } from '../../../../../app/paths';
import { readPublicAppOrigin } from '../../../../../shared/lib/masterBookingLink';
import { useAdminMasterCabinet } from '../../../AdminMasterCabinetContext';
import { getMyMasterEntitlements, type MasterEntitlementsDto } from '../../../../../features/billing/api/masterEntitlementsApi';
import { billingPlanDisplayFromEntitlements } from '../../../../../features/billing/billingTrialCopy';
import { useAdminToast } from '../../../shared/useAdminToast';

const RECENT_PAYMENTS_LIMIT = 5;

export function useSettingsBilling() {
  const { useCabinetApi, cabinetLoading, refreshSubscription } = useAdminMasterCabinet();
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();

  const [apiLoading, setApiLoading] = useState(() => Boolean(useCabinetApi));
  const [billingDetail, setBillingDetail] = useState<BillingSubscriptionResponse | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [payments, setPayments] = useState<BillingPaymentDto[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<BillingPaymentDto | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<MasterEntitlementsDto | null>(null);

  const reloadBilling = useCallback(async () => {
    if (!useCabinetApi) return;
    try {
      const [billing, ent] = await Promise.all([getBillingSubscription(), getMyMasterEntitlements()]);
      setBillingDetail(billing);
      setEntitlements(ent);
      setLoadError(null);
    } catch {
      setBillingDetail(null);
      setEntitlements(null);
      setLoadError('Не удалось загрузить данные подписки');
    }
  }, [useCabinetApi]);

  const loadPayments = useCallback(async () => {
    if (!useCabinetApi) {
      setPayments([]);
      return;
    }
    setPaymentsLoading(true);
    try {
      setPayments(await listBillingPayments(30));
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    if (!useCabinetApi) {
      setApiLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setApiLoading(true);
      try {
        const [billing, ent] = await Promise.all([getBillingSubscription(), getMyMasterEntitlements()]);
        if (!cancelled) {
          setBillingDetail(billing);
          setEntitlements(ent);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setBillingDetail(null);
          setEntitlements(null);
          setLoadError('Не удалось загрузить данные подписки');
        }
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useCabinetApi]);

  useEffect(() => {
    if (!apiLoading && !(useCabinetApi && cabinetLoading)) void loadPayments();
  }, [apiLoading, useCabinetApi, cabinetLoading, loadPayments]);

  const uiState = billingDetail?.uiState ?? 'free';
  const isProEntitled = entitlements?.isProEntitled ?? billingDetail?.isProEntitled ?? false;
  const planDisplay = billingPlanDisplayFromEntitlements(entitlements, uiState);

  const runBillingAction = useCallback(
    async (fn: () => Promise<void>) => {
      setBillingBusy(true);
      try {
        await fn();
        await reloadBilling();
        void refreshSubscription?.();
        void loadPayments();
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : 'Ошибка');
      } finally {
        setBillingBusy(false);
      }
    },
    [reloadBilling, refreshSubscription, loadPayments, showErrorToast],
  );

  const redirectToPayment = useCallback(
    async (createUrl: () => Promise<{ paymentUrl: string }>) => {
      setBillingBusy(true);
      try {
        const { paymentUrl } = await createUrl();
        window.location.assign(paymentUrl);
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : 'Не удалось открыть оплату');
        setBillingBusy(false);
      }
    },
    [showErrorToast],
  );

  const recentPayments = historyExpanded ? payments : payments.slice(0, RECENT_PAYMENTS_LIMIT);

  return {
    apiLoading: apiLoading || (useCabinetApi && cabinetLoading),
    loadError,
    useCabinetApi,
    billingDetail,
    billingBusy,
    uiState,
    isProEntitled,
    entitlements,
    planDisplay,
    payments,
    recentPayments,
    paymentsLoading,
    historyExpanded,
    setHistoryExpanded,
    canExpandHistory: payments.length > RECENT_PAYMENTS_LIMIT,
    selectedPayment,
    setSelectedPayment,
    toast,
    clearToast,
    onUpdateCard: () =>
      void redirectToPayment(() =>
        updatePaymentMethodCheckout(`${readPublicAppOrigin()}${PAYMENT_SUCCESS_PATH}?from=card`),
      ),
    onRetryPayment: () =>
      void redirectToPayment(() =>
        retrySubscriptionPayment(`${readPublicAppOrigin()}${PAYMENT_SUCCESS_PATH}?from=retry`),
      ),
    onCancelAutoRenew: () =>
      void runBillingAction(async () => {
        await cancelSubscriptionAutoRenew();
        showToast('Автопродление отключено');
      }),
    onResumeAutoRenew: () =>
      void runBillingAction(async () => {
        await resumeSubscriptionAutoRenew();
        showToast('Автопродление включено');
      }),
    reload: () => {
      void reloadBilling();
      void loadPayments();
    },
  };
}

export type SettingsBillingState = ReturnType<typeof useSettingsBilling>;
