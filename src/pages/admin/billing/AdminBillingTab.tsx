import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BillingPeriod, MasterPlanState, PlanId } from '../../../features/billing/model/masterPlans';
import {
  countAppointmentsInCurrentMonth,
  formatPlanPrice,
  getCurrentMasterPlan,
  getPlanLimits,
  planBadgeLabel,
  priceForPlan,
  saveCurrentMasterPlan,
} from '../../../features/billing/model/masterPlans';
import { getBillingPlans, switchMySubscriptionMock, type BillingPlanDto } from '../../../features/admin/api/adminBillingApi';
import { getMasterDraft } from '../../../features/master/model/masterDraftStorage';
import { ensureDemoAppointmentsSeeded } from '../../../features/master/model/demoMasterAppointments';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { BillingLandingFreeCard } from './BillingLandingFreeCard';
import { BillingLandingProCard } from './BillingLandingProCard';
import { billingLandingPanel, homeOutlineBtn, homePinkBtn } from './adminBillingLandingTheme';

function progressClass(ratio: number): string {
  if (ratio >= 1) return 'bg-[#EF4444]';
  if (ratio >= 0.85) return 'bg-amber-400';
  return 'bg-gradient-to-r from-[#F47C8C] to-[#F26D83]';
}

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

const PLAN_UI: Record<
  PlanId,
  {
    name: string;
    tagline: string;
    includes: string[];
    limits: string[];
  }
> = {
  free: {
    name: 'Free',
    tagline: 'Попробуйте SLOTTY бесплатно',
    includes: [
      'Профиль мастера',
      'До 3 услуг',
      'До 20 записей в месяц',
      'График работы на 30 дней',
      'Базовая сводка',
      'Заявки клиентов',
      'Ручное управление записями',
    ],
    limits: [
      'Не больше 3 услуг',
      'После 20 записей в месяц — предложение перейти на Pro',
      'Нет расширенной аналитики',
      'Нет командной работы',
    ],
  },
  pro: {
    name: 'Pro',
    tagline: 'Для активной работы мастера',
    includes: [
      'Всё из Free',
      'Безлимит услуг и записей',
      'График работы на 365 дней',
      'Расширенная сводка',
      'История клиентов',
      'Напоминания клиентам',
      'Приоритет в поиске',
      'Предпросмотр профиля',
      'Быстрые действия с заявками',
    ],
    limits: [],
  },
};

export function AdminBillingTab() {
  const { useCabinetApi, subscription, refreshSubscription, cabinetLoading } = useAdminMasterCabinet();

  const [planState, setPlanState] = useState<MasterPlanState>(() => getCurrentMasterPlan());
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(() => getCurrentMasterPlan().billingPeriod);
  const [mockProOpen, setMockProOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [plansError, setPlansError] = useState(false);
  const [apiLoading, setApiLoading] = useState(() => Boolean(useCabinetApi));
  const [apiPlans, setApiPlans] = useState<BillingPlanDto[] | null>(null);

  useEffect(() => {
    if (!useCabinetApi) {
      setApiLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setApiLoading(true);
      try {
        const plans = await getBillingPlans();
        if (cancelled) return;
        setApiPlans(plans);
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
  }, [useCabinetApi]);

  const apiSub = subscription;
  const useLiveBilling = Boolean(useCabinetApi && apiSub);

  const appointments = useMemo(() => ensureDemoAppointmentsSeeded(), []);
  const monthlyCountDemo = useMemo(() => countAppointmentsInCurrentMonth(appointments), [appointments]);

  const planStateView: MasterPlanState = useLiveBilling && apiSub
    ? {
        plan: planCodeToPlanId(apiSub.plan.code),
        billingPeriod: (apiSub.billingPeriod === 'year' ? 'year' : 'month') as BillingPeriod,
        updatedAt: apiSub.currentPeriodStart,
      }
    : planState;

  const billingPeriodView: BillingPeriod = useLiveBilling && apiSub
    ? ((apiSub.billingPeriod === 'year' ? 'year' : 'month') as BillingPeriod)
    : billingPeriod;

  const limits = useLiveBilling && apiSub
    ? {
        maxServices: apiSub.plan.maxServices,
        maxMonthlyAppointments: apiSub.plan.maxMonthlyAppointments,
        scheduleHorizonDays: apiSub.plan.maxScheduleDaysAhead,
      }
    : getPlanLimits(planStateView.plan);

  const servicesLen = useLiveBilling && apiSub ? apiSub.usage.activeServices : getMasterDraft().services.length;
  const monthlyCount = useLiveBilling && apiSub ? apiSub.usage.monthlyAppointments : monthlyCountDemo;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const persistPeriod = useCallback(
    async (next: BillingPeriod) => {
      if (useLiveBilling && apiSub) {
        try {
          await switchMySubscriptionMock(apiSub.plan.code as 'free' | 'pro', next);
          await refreshSubscription();
        } catch (e) {
          setToast(e instanceof Error ? e.message : 'Не удалось сохранить период');
          window.setTimeout(() => setToast(null), 3200);
        }
        return;
      }
      setBillingPeriod(next);
      const merged: MasterPlanState = {
        ...planState,
        billingPeriod: next,
        updatedAt: new Date().toISOString(),
      };
      saveCurrentMasterPlan(merged);
      setPlanState(merged);
    },
    [apiSub, planState, refreshSubscription, useLiveBilling],
  );

  const applyPlan = useCallback(
    async (plan: PlanId) => {
      if (useLiveBilling) {
        try {
          await switchMySubscriptionMock(plan, billingPeriodView);
          await refreshSubscription();
          showToast(plan === 'free' ? 'Тариф Free' : 'Тариф обновлён');
        } catch (e) {
          setToast(e instanceof Error ? e.message : 'Не удалось сменить тариф');
          window.setTimeout(() => setToast(null), 3200);
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
    [billingPeriod, billingPeriodView, refreshSubscription, showToast, useLiveBilling],
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

  const confirmMock = useCallback(async () => {
    if (useLiveBilling) {
      try {
        await switchMySubscriptionMock('pro', billingPeriodView);
        await refreshSubscription();
        setMockProOpen(false);
        showToast('Тариф Pro подключён');
      } catch (e) {
        setToast(e instanceof Error ? e.message : 'Не удалось подключить Pro');
        window.setTimeout(() => setToast(null), 3200);
      }
      return;
    }
    confirmMockDemo();
  }, [billingPeriodView, confirmMockDemo, refreshSubscription, showToast, useLiveBilling]);

  const maxSvc = Math.max(1, limits.maxServices ?? 3);
  const maxAppt = Math.max(1, limits.maxMonthlyAppointments ?? 20);

  const freePriceLine =
    useLiveBilling && apiPlans
      ? formatPriceFromPlans(apiPlans, 'free', billingPeriodView)
      : formatPlanPrice('free', billingPeriodView);

  const proPriceLine =
    useLiveBilling && apiPlans
      ? formatPriceFromPlans(apiPlans, 'pro', billingPeriodView)
      : formatPlanPrice('pro', billingPeriodView);

  const proPriceParts = splitPlanPrice(proPriceLine);

  return (
    <div className="mt-8 space-y-6 sm:mt-10">
      {toast ? (
        <div className="rounded-full bg-[#FFF1F4] px-5 py-3 text-center text-[14px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED]">
          {toast}
        </div>
      ) : null}

      {apiLoading || (useCabinetApi && cabinetLoading) ? (
        <LoadingVideo size="sm" label="Загрузка тарифов…" className="py-2" />
      ) : null}

      {useCabinetApi && !cabinetLoading && !subscription ? (
        <p className="rounded-[20px] border border-[#FECACA] bg-[#FFF0F0] px-4 py-3 text-center text-[14px] font-semibold text-[#9B2C2C]">
          Не удалось загрузить подписку. Обновите страницу или повторите позже.
        </p>
      ) : null}

      {plansError ? (
        <p className="rounded-[20px] border border-[#FECACA] bg-[#FFF0F0] px-4 py-3 text-center text-[14px] font-semibold text-[#9B2C2C]">
          Не удалось загрузить список тарифов.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <section className={billingLandingPanel}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Сейчас</p>
          <p className="mt-2 text-[32px] font-bold leading-none tracking-[-0.05em] text-[#111827] lg:text-[36px]">
            {planBadgeLabel(planStateView.plan)}
          </p>
          <p className="mt-2 text-[14px] font-semibold text-[#F47C8C]">Активен · {billingPeriodView === 'year' ? 'год' : 'месяц'}</p>
          <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
            {planStateView.plan === 'free'
              ? 'Бесплатный старт — перейдите на Pro, когда понадобится больше услуг и записей.'
              : 'Полный доступ для одного мастера — все разделы кабинета открыты.'}
          </p>
        </section>

        <section className={billingLandingPanel}>
          <p className="text-[13px] font-semibold text-[#6B7280]">Период оплаты</p>
          <div className="mt-3 flex rounded-full bg-[#F1EFEF] p-1">
            <button
              type="button"
              onClick={() => void persistPeriod('month')}
              className={`min-h-11 flex-1 rounded-full px-3 text-[14px] font-semibold transition active:scale-[0.98] ${
                billingPeriodView === 'month'
                  ? 'bg-white text-[#111827] shadow-[0_8px_20px_rgba(17,17,17,0.06)]'
                  : 'text-[#6B7280]'
              }`}
            >
              Месяц
            </button>
            <button
              type="button"
              onClick={() => void persistPeriod('year')}
              className={`min-h-11 flex-1 rounded-full px-3 text-[14px] font-semibold transition active:scale-[0.98] ${
                billingPeriodView === 'year'
                  ? 'bg-white text-[#111827] shadow-[0_8px_20px_rgba(17,17,17,0.06)]'
                  : 'text-[#6B7280]'
              }`}
            >
              Год
            </button>
          </div>
          <p className="mt-3 text-center text-[13px] font-medium text-[#9CA3AF]">2 месяца бесплатно при оплате за год</p>
        </section>
      </div>

      {planStateView.plan === 'free' ? (
        <section className={billingLandingPanel}>
          <h2 className="text-[18px] font-semibold tracking-tight text-[#111827]">Использование на Free</h2>
          <UsageRow label="Услуги" value={`${servicesLen} / ${maxSvc}`} />
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1EFEF]">
            <div
              className={`h-full rounded-full transition-all ${progressClass(servicesLen / maxSvc)}`}
              style={{ width: `${Math.min(100, (servicesLen / maxSvc) * 100)}%` }}
            />
          </div>
          <UsageRow label="Записи в этом месяце" value={`${monthlyCount} / ${maxAppt}`} />
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1EFEF]">
            <div
              className={`h-full rounded-full transition-all ${progressClass(monthlyCount / maxAppt)}`}
              style={{ width: `${Math.min(100, (monthlyCount / maxAppt) * 100)}%` }}
            />
          </div>
          <UsageRow label="График работы" value={`${limits.scheduleHorizonDays} дней`} />
        </section>
      ) : (
        <section className={billingLandingPanel}>
          <h2 className="text-[18px] font-semibold tracking-tight text-[#111827]">Ваш Pro</h2>
          <UsageRow label="Услуги" value="безлимит" />
          <UsageRow label="Записи" value="безлимит" />
          <UsageRow label="График работы" value={`${limits.scheduleHorizonDays} дней`} />
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <BillingLandingFreeCard
          name={PLAN_UI.free.name}
          priceLine={freePriceLine}
          tagline={PLAN_UI.free.tagline}
          includes={PLAN_UI.free.includes}
          limits={PLAN_UI.free.limits}
          active={planStateView.plan === 'free'}
          onSelect={() => void applyPlan('free')}
        />
        <BillingLandingProCard
          priceValue={proPriceParts.value}
          priceUnit={proPriceParts.unit || '/ месяц'}
          includes={PLAN_UI.pro.includes}
          active={planStateView.plan === 'pro'}
          onSelect={() => setMockProOpen(true)}
        />
      </div>

      <AdminBottomSheet open={mockProOpen} onClose={() => setMockProOpen(false)} title="Подключить Pro">
        <MockPaymentBody
          billingPeriod={billingPeriodView}
          proPrice={proPriceLine}
          onBack={() => setMockProOpen(false)}
          onDemo={confirmMock}
        />
      </AdminBottomSheet>
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-[15px] first:mt-3">
      <span className="font-medium text-[#6B7280]">{label}</span>
      <span className="font-semibold tabular-nums text-[#111827]">{value}</span>
    </div>
  );
}

function MockPaymentBody({
  billingPeriod,
  proPrice,
  onBack,
  onDemo,
}: {
  billingPeriod: BillingPeriod;
  proPrice: string;
  onBack: () => void;
  onDemo: () => void | Promise<void>;
}) {
  const meta = PLAN_UI.pro;
  const amountLabel = proPrice || `${priceForPlan('pro', billingPeriod)} BYN`;
  return (
    <div className="space-y-4">
      <p className="text-[16px] font-semibold text-[#111827]">{meta.name}</p>
      <p className="text-[14px] text-[#6B7280]">
        Период:{' '}
        <span className="font-semibold text-[#111827]">{billingPeriod === 'year' ? 'год' : 'месяц'}</span>
        {' · '}
        <span className="font-semibold text-[#111827]">{amountLabel}</span>
      </p>
      <ul className="space-y-1.5 text-[14px] text-[#374151]">
        {meta.includes.slice(0, 6).map((x) => (
          <li key={x} className="flex gap-2">
            <span className="text-[#F47C8C]" aria-hidden>
              •
            </span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
      <p className="rounded-[18px] bg-[#F9FAFB] px-4 py-3 text-[13px] leading-relaxed text-[#6B7280] ring-1 ring-[#F3F4F6]">
        Оплата будет подключена позже. Сейчас тариф активируется в demo-режиме.
      </p>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onBack} className={`min-h-12 flex-1 ${homeOutlineBtn}`}>
          Назад
        </button>
        <button type="button" onClick={() => void Promise.resolve(onDemo())} className={`min-h-12 flex-[1.15] ${homePinkBtn}`}>
          Подключить в demo
        </button>
      </div>
    </div>
  );
}
