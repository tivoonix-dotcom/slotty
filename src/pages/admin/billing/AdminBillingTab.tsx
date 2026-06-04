import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BillingPeriod, MasterPlanState, PlanId } from '../../../features/billing/model/masterPlans';
import {
  countAppointmentsInCurrentMonth,
  formatPlanPrice,
  getCurrentMasterPlan,
  getPlanLimits,
  priceForPlan,
  saveCurrentMasterPlan,
} from '../../../features/billing/model/masterPlans';
import {
  getBillingPlans,
  switchMySubscriptionMock,
  type BillingPlanDto,
} from '../../../features/admin/api/adminBillingApi';
import {
  cancelSubscriptionAutoRenew,
  createBillingCheckout,
  getBillingSubscription,
  listBillingPayments,
  resumeSubscriptionAutoRenew,
  retrySubscriptionPayment,
  updatePaymentMethodCheckout,
  type BillingPaymentDto,
  type BillingSubscriptionResponse,
} from '../../../features/billing/api/masterBillingApi';
import { getMasterDraft } from '../../../features/master/model/masterDraftStorage';
import { ensureDemoAppointmentsSeeded } from '../../../features/master/model/demoMasterAppointments';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminToast } from '../shared/AdminToast';
import { useAdminToast } from '../shared/useAdminToast';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { BillingDesktopHero } from './BillingDesktopHero';
import { BillingMobileHeader } from './BillingMobileHeader';
import { BillingPlansSection } from './BillingPlansSection';
import { getProManualPaymentState } from '../../../features/billing/api/proPaymentRequestApi';
import { isDevDemoAllowed } from '../../../shared/lib/appMode';
import { PAYMENT_SUCCESS_PATH } from '../../../app/paths';
import { readPublicAppOrigin } from '../../../shared/lib/masterBookingLink';
import {
  billingErrorBanner,
  billingOutlineBtn,
  billingPinkBtn,
  billingShellCard,
  billingSoftNote,
  BILLING_PAGE_BG,
} from './adminBillingTheme';
import { BillingSubscriptionStatusPanel } from './BillingSubscriptionStatusPanel';
import { BillingPaymentHistory } from './BillingPaymentHistory';
import { BillingPaymentDetailSheet } from './BillingPaymentDetailSheet';
import { ProSubscriptionConsentModal } from './ProSubscriptionConsentModal';

function planCodeToPlanId(code: string): PlanId {
  return code === 'pro' ? 'pro' : 'free';
}

function formatPriceFromPlans(plans: BillingPlanDto[], planId: PlanId, period: BillingPeriod): string {
  const p = plans.find((x) => x.code === planId);
  if (!p) return formatPlanPrice(planId, period);
  if (p.code === 'free') return '0 BYN / месяц';
  const n = period === 'year' ? p.priceYear : p.priceMonth;
  const unit = period === 'year' ? 'год' : 'месяц';
  return `${n} BYN / ${unit}`;
}

function splitPlanPrice(line: string): { value: string; unit: string } {
  const idx = line.indexOf(' / ');
  if (idx === -1) return { value: line, unit: '' };
  return { value: line.slice(0, idx), unit: line.slice(idx + 1) };
}

export function AdminBillingTab() {
  const { useCabinetApi, subscription, applySubscription, cabinetLoading, refreshSubscription } =
    useAdminMasterCabinet();

  const [planState, setPlanState] = useState<MasterPlanState>(() => getCurrentMasterPlan());
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(() => getCurrentMasterPlan().billingPeriod);
  const [mockProOpen, setMockProOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [proPaymentPending, setProPaymentPending] = useState(false);
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();

  const [plansError, setPlansError] = useState(false);
  const [apiLoading, setApiLoading] = useState(() => Boolean(useCabinetApi));
  const [apiPlans, setApiPlans] = useState<BillingPlanDto[] | null>(null);
  const [billingDetail, setBillingDetail] = useState<BillingSubscriptionResponse | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [payments, setPayments] = useState<BillingPaymentDto[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<BillingPaymentDto | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const reloadBilling = useCallback(async () => {
    if (!useCabinetApi) return;
    try {
      const b = await getBillingSubscription();
      setBillingDetail(b);
      applySubscription(b.subscription);
    } catch {
      setBillingDetail(null);
    }
  }, [applySubscription, useCabinetApi]);

  useEffect(() => {
    if (!useCabinetApi) {
      setApiLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setApiLoading(true);
      try {
        const [plans, billing] = await Promise.all([getBillingPlans(), getBillingSubscription()]);
        if (cancelled) return;
        setApiPlans(plans);
        setBillingDetail(billing);
        applySubscription(billing.subscription);
        setPlansError(false);
      } catch {
        if (cancelled) return;
        setPlansError(true);
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useCabinetApi, applySubscription]);

  useEffect(() => {
    if (!subscription) return;
    setBillingPeriod(subscription.billingPeriod === 'year' ? 'year' : 'month');
  }, [subscription?.id]);

  const apiSub = subscription;
  const useLiveBilling = Boolean(useCabinetApi && apiSub);
  const uiState = billingDetail?.uiState;
  const isProEntitled = billingDetail?.isProEntitled ?? apiSub?.plan.code === 'pro';

  const appointments = useMemo(() => ensureDemoAppointmentsSeeded(), []);
  const monthlyCountDemo = useMemo(() => countAppointmentsInCurrentMonth(appointments), [appointments]);

  const planStateView: MasterPlanState = useLiveBilling && apiSub
    ? {
        plan: isProEntitled ? 'pro' : planCodeToPlanId(apiSub.plan.code),
        billingPeriod: (apiSub.billingPeriod === 'year' ? 'year' : 'month') as BillingPeriod,
        updatedAt: apiSub.currentPeriodStart,
      }
    : planState;

  const billingPeriodView: BillingPeriod = billingPeriod;

  useEffect(() => {
    if (!useLiveBilling) {
      setProPaymentPending(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const st = await getProManualPaymentState(billingPeriodView);
        if (!cancelled) setProPaymentPending(Boolean(st.pendingRequest));
      } catch {
        if (!cancelled) setProPaymentPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useLiveBilling, billingPeriodView, consentOpen, subscription?.plan.code]);

  const limits = useLiveBilling && apiSub
    ? {
        maxServices: apiSub.plan.maxServices,
        maxMonthlyAppointments: apiSub.plan.maxMonthlyAppointments,
        scheduleHorizonDays: apiSub.plan.maxScheduleDaysAhead,
      }
    : getPlanLimits(planStateView.plan);

  const servicesLen = useLiveBilling && apiSub ? apiSub.usage.activeServices : getMasterDraft().services.length;
  const monthlyCount = useLiveBilling && apiSub ? apiSub.usage.monthlyAppointments : monthlyCountDemo;

  const persistPeriod = useCallback(
    (next: BillingPeriod) => {
      if (next === billingPeriod) return;
      setBillingPeriod(next);
      if (useLiveBilling) return;
      const merged: MasterPlanState = {
        ...planState,
        billingPeriod: next,
        updatedAt: new Date().toISOString(),
      };
      saveCurrentMasterPlan(merged);
      setPlanState(merged);
    },
    [billingPeriod, planState, useLiveBilling],
  );

  const applyPlan = useCallback(
    async (plan: PlanId) => {
      if (useLiveBilling) {
        try {
          const updated = await switchMySubscriptionMock(plan, billingPeriodView);
          applySubscription(updated);
          await reloadBilling();
          setBillingPeriod(updated.billingPeriod === 'year' ? 'year' : 'month');
          showToast(plan === 'free' ? 'Тариф Free' : 'Тариф обновлён');
        } catch (e) {
          showErrorToast(e instanceof Error ? e.message : 'Не удалось сменить тариф');
        }
        return;
      }
      const next: MasterPlanState = {
        plan,
        billingPeriod,
        updatedAt: new Date().toISOString(),
      };
      saveCurrentMasterPlan(next);
      setPlanState(next);
    },
    [applySubscription, billingPeriod, billingPeriodView, reloadBilling, showErrorToast, showToast, useLiveBilling],
  );

  const confirmMockDemo = useCallback(() => {
    const next: MasterPlanState = {
      plan: 'pro',
      billingPeriod,
      updatedAt: new Date().toISOString(),
    };
    saveCurrentMasterPlan(next);
    setPlanState(next);
    setMockProOpen(false);
    showToast('Тариф Pro подключён');
  }, [billingPeriod, showToast]);

  const confirmMock = useCallback(
    async (promoCode?: string | null) => {
      if (useLiveBilling) {
        try {
          const updated = await switchMySubscriptionMock('pro', billingPeriodView, {
            promoCode: promoCode ?? null,
          });
          applySubscription(updated);
          await reloadBilling();
          setBillingPeriod(updated.billingPeriod === 'year' ? 'year' : 'month');
          setMockProOpen(false);
          showToast('Тариф Pro подключён');
        } catch (e) {
          showErrorToast(e instanceof Error ? e.message : 'Не удалось подключить Pro');
        }
        return;
      }
      confirmMockDemo();
    },
    [applySubscription, billingPeriodView, confirmMockDemo, reloadBilling, showErrorToast, showToast, useLiveBilling],
  );

  const loadPayments = useCallback(async () => {
    if (!useLiveBilling) return;
    setPaymentsLoading(true);
    try {
      setPayments(await listBillingPayments());
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [useLiveBilling]);

  useEffect(() => {
    if (showHistory && useLiveBilling) void loadPayments();
  }, [showHistory, useLiveBilling, loadPayments]);

  const handleCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const origin = readPublicAppOrigin();
      const returnUrl = `${origin}${PAYMENT_SUCCESS_PATH}?from=pro`;
      const result = await createBillingCheckout({
        billingPeriod: billingPeriodView,
        returnUrl,
        consentAccepted: true,
      });
      setConsentOpen(false);
      window.location.assign(result.paymentUrl);
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Не удалось создать платёж');
    } finally {
      setCheckoutLoading(false);
    }
  }, [billingPeriodView, showErrorToast]);

  const runBillingAction = useCallback(
    async (fn: () => Promise<void>) => {
      setBillingBusy(true);
      try {
        await fn();
        await reloadBilling();
        void refreshSubscription?.();
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : 'Ошибка');
      } finally {
        setBillingBusy(false);
      }
    },
    [reloadBilling, refreshSubscription, showErrorToast],
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

  const maxSvc = Math.max(1, limits.maxServices ?? 3);
  const maxAppt = Math.max(1, limits.maxMonthlyAppointments ?? 20);
  const isPro = planStateView.plan === 'pro';
  const servicesHeroLabel = isPro ? '∞' : `${servicesLen}/${maxSvc}`;
  const appointmentsHeroLabel = isPro ? '∞' : `${monthlyCount}/${maxAppt}`;

  const freePriceLine =
    useLiveBilling && apiPlans
      ? formatPriceFromPlans(apiPlans, 'free', billingPeriodView)
      : formatPlanPrice('free', billingPeriodView);

  const proPriceLine =
    useLiveBilling && apiPlans
      ? formatPriceFromPlans(apiPlans, 'pro', billingPeriodView)
      : formatPlanPrice('pro', billingPeriodView);

  const proPriceParts = splitPlanPrice(proPriceLine);

  const showProCheckoutCta =
    !useLiveBilling || !billingDetail || uiState === 'free' || uiState === 'expired' || uiState === 'past_due';
  const proActiveCard = isProEntitled && uiState !== 'past_due';

  const statusBanners = (
    <>
      {apiLoading || (useCabinetApi && cabinetLoading) ? (
        <div className="flex min-h-[10rem] items-center justify-center rounded-[22px] border border-[#FDE8ED] bg-white py-8 shadow-[0_8px_28px_rgba(255,95,122,0.06)]">
          <LoadingVideo size="md" label="Загрузка тарифов…" />
        </div>
      ) : null}

      {useCabinetApi && !cabinetLoading && !subscription ? (
        <p className={billingErrorBanner}>
          Не удалось загрузить подписку. Обновите страницу или повторите позже.
        </p>
      ) : null}

      {plansError ? (
        <p className={billingErrorBanner}>Не удалось загрузить список тарифов.</p>
      ) : null}
    </>
  );

  const freeActive = !isProEntitled;
  const proActive = proActiveCard;
  const freePriceValue = freePriceLine.split(' / ')[0] ?? freePriceLine;
  const freePriceUnit = freePriceLine.includes(' / ') ? ` / ${freePriceLine.split(' / ')[1]}` : '';
  const proPriceUnit =
    proPriceParts.unit && proPriceParts.unit.startsWith('/')
      ? proPriceParts.unit
      : proPriceParts.unit
        ? ` / ${proPriceParts.unit}`
        : '/ месяц';

  const demoNote = !useLiveBilling ? (
    <p className={billingSoftNote}>
      Оплата картой появится позже. Сейчас Pro можно активировать в demo-режиме для проверки кабинета.
    </p>
  ) : null;

  const subscriptionPanel =
    useLiveBilling && billingDetail ? (
      <BillingSubscriptionStatusPanel
        billing={billingDetail}
        busy={billingBusy}
        onConnectPro={() => setConsentOpen(true)}
        onCancelAutoRenew={() =>
          void runBillingAction(async () => {
            await cancelSubscriptionAutoRenew();
            showToast('Автопродление отключено');
          })
        }
        onResumeAutoRenew={() =>
          void runBillingAction(async () => {
            await resumeSubscriptionAutoRenew();
            showToast('Автопродление включено');
          })
        }
        onUpdateCard={() =>
          void redirectToPayment(() =>
            updatePaymentMethodCheckout(`${readPublicAppOrigin()}${PAYMENT_SUCCESS_PATH}?from=card`),
          )
        }
        onRetryPayment={() =>
          void redirectToPayment(() =>
            retrySubscriptionPayment(`${readPublicAppOrigin()}${PAYMENT_SUCCESS_PATH}?from=retry`),
          )
        }
        onShowHistory={() => setShowHistory(true)}
      />
    ) : null;

  const plansSection = (
    <BillingPlansSection
      plan={planStateView.plan}
      billingPeriod={billingPeriodView}
      onPeriodChange={persistPeriod}
      servicesLen={servicesLen}
      maxSvc={maxSvc}
      monthlyCount={monthlyCount}
      maxAppt={maxAppt}
      scheduleHorizonDays={limits.scheduleHorizonDays}
      freePriceValue={freePriceValue}
      freePriceUnit={freePriceUnit}
      proPriceValue={proPriceParts.value}
      proPriceUnit={proPriceUnit}
      freeActive={freeActive}
      proActive={proActive}
      showProCheckoutCta={showProCheckoutCta}
      proCtaLabel="Подключить Pro"
      useLiveBilling={useLiveBilling}
      showPaymentLogos
      proPaymentPendingBanner={
        useLiveBilling && proPaymentPending && !isProEntitled ? (
          <p className="rounded-[18px] bg-[#FFFBEB] px-4 py-3 text-[14px] font-semibold text-[#92400E] ring-1 ring-[#FDE68A]">
            Заявка на проверке. Мы проверяем оплату и активируем Pro после подтверждения.
          </p>
        ) : null
      }
      liveBillingNote={null}
      demoNote={demoNote}
      onSelectFree={() => void applyPlan('free')}
      onSelectPro={() => {
        if (useLiveBilling) setConsentOpen(true);
        else setMockProOpen(true);
      }}
    />
  );

  return (
    <>
      <section className={`-mx-4 min-w-0 space-y-3 overflow-x-hidden px-4 pb-8 lg:hidden ${BILLING_PAGE_BG}`}>
        <BillingMobileHeader plan={planStateView.plan} period={billingPeriodView} />
        {statusBanners}
        {!apiLoading && !(useCabinetApi && cabinetLoading) ? (
          <>
            {subscriptionPanel}
            {demoNote}
            <div className="lg:hidden">{plansSection}</div>
            {showHistory ? (
              <BillingPaymentHistory
                payments={payments}
                loading={paymentsLoading}
                onView={(p) => setSelectedPayment(p)}
              />
            ) : null}
          </>
        ) : null}
      </section>

      <div className={`${billingShellCard} w-full min-w-0 space-y-4`}>
        <BillingDesktopHero
          plan={planStateView.plan}
          period={billingPeriodView}
          servicesLabel={servicesHeroLabel}
          appointmentsLabel={appointmentsHeroLabel}
          scheduleDays={limits.scheduleHorizonDays}
          isPro={isPro}
        />
        <div className="w-full min-w-0 space-y-4 pb-6">
          {statusBanners}
          {!apiLoading && !(useCabinetApi && cabinetLoading) ? (
            <div className="hidden w-full min-w-0 space-y-4 lg:block">
              {subscriptionPanel}
              {plansSection}
              {showHistory ? (
                <BillingPaymentHistory
                  payments={payments}
                  loading={paymentsLoading}
                  onView={(p) => setSelectedPayment(p)}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <ProSubscriptionConsentModal
        open={consentOpen && useLiveBilling}
        onClose={() => setConsentOpen(false)}
        amountLabel={proPriceParts.value}
        billingPeriod={billingPeriodView}
        autoRenewLegalAllowed={billingDetail?.autoRenewLegalAllowed ?? false}
        loading={checkoutLoading}
        onConfirm={handleCheckout}
      />

      <AdminBottomSheet
        open={mockProOpen}
        onClose={() => setMockProOpen(false)}
        title="Подключить Pro"
        variant="catalog"
      >
        <MockPaymentBody
          billingPeriod={billingPeriodView}
          proPrice={proPriceLine}
          useCabinetApi={false}
          onBack={() => setMockProOpen(false)}
          onDemo={confirmMock}
          showDevDemo={isDevDemoAllowed()}
        />
      </AdminBottomSheet>

      <BillingPaymentDetailSheet
        open={Boolean(selectedPayment)}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />

      <AdminToast toast={toast} onDismiss={clearToast} />
    </>
  );
}

function MockPaymentBody({
  billingPeriod,
  proPrice,
  onBack,
  onDemo,
  showDevDemo,
}: {
  billingPeriod: BillingPeriod;
  proPrice: string;
  useCabinetApi?: boolean;
  onBack: () => void;
  onDemo: (promoCode?: string | null) => void | Promise<void>;
  showDevDemo?: boolean;
}) {
  const amountLabel = proPrice || `${priceForPlan('pro', billingPeriod)} BYN`;

  return (
    <div className="space-y-4">
      <p className="text-[16px] font-semibold text-[#111827]">Мастер Pro</p>
      <p className="text-[14px] text-[#6B7280]">
        Период:{' '}
        <span className="font-semibold text-[#111827]">{billingPeriod === 'year' ? 'год' : 'месяц'}</span>
        {' · '}
        <span className="font-semibold text-[#111827]">{amountLabel}</span>
      </p>
      <p className="rounded-[18px] bg-[#F9FAFB] px-4 py-3 text-[13px] leading-relaxed text-[#6B7280] ring-1 ring-[#F3F4F6]">
        Оплата будет подключена позже. Сейчас тариф активируется в demo-режиме.
      </p>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onBack} className={`min-h-12 flex-1 ${billingOutlineBtn}`}>
          Назад
        </button>
        {showDevDemo ? (
          <button
            type="button"
            onClick={() => void Promise.resolve(onDemo())}
            className={`min-h-12 flex-[1.15] ${billingPinkBtn}`}
          >
            Подключить в demo
          </button>
        ) : null}
      </div>
    </div>
  );
}
