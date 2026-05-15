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
import { getBillingPlans, switchMySubscriptionMock, getMySubscription, type BillingPlanDto, type MasterSubscriptionDto } from '../../../features/admin/api/adminBillingApi';
import { getMasterDraft } from '../../../features/master/model/masterDraftStorage';
import { ensureDemoAppointmentsSeeded } from '../../../features/master/model/demoMasterAppointments';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';

function progressClass(ratio: number): string {
  if (ratio >= 1) return 'bg-[#E29595]';
  if (ratio >= 0.85) return 'bg-amber-400';
  return 'bg-[#E29595]/80';
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
  const { useCabinetApi } = useAdminMasterCabinet();

  const [planState, setPlanState] = useState<MasterPlanState>(() => getCurrentMasterPlan());
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(() => getCurrentMasterPlan().billingPeriod);
  const [mockProOpen, setMockProOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [billingFallback, setBillingFallback] = useState(false);
  const [apiLoading, setApiLoading] = useState(() => Boolean(useCabinetApi));
  const [apiPlans, setApiPlans] = useState<BillingPlanDto[] | null>(null);
  const [apiSub, setApiSub] = useState<MasterSubscriptionDto | null>(null);

  useEffect(() => {
    if (!useCabinetApi) {
      setApiLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setApiLoading(true);
      try {
        const [plans, sub] = await Promise.all([getBillingPlans(), getMySubscription()]);
        if (cancelled) return;
        setApiPlans(plans);
        setApiSub(sub);
        setBillingFallback(false);
      } catch {
        if (cancelled) return;
        setBillingFallback(true);
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useCabinetApi]);

  const useLiveBilling = Boolean(useCabinetApi && !billingFallback && apiSub);

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
          const sub = await switchMySubscriptionMock(apiSub.plan.code as 'free' | 'pro', next);
          setApiSub(sub);
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
    [apiSub, planState, useLiveBilling],
  );

  const applyPlan = useCallback(
    async (plan: PlanId) => {
      if (useLiveBilling) {
        try {
          const sub = await switchMySubscriptionMock(plan, billingPeriodView);
          setApiSub(sub);
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
    [billingPeriod, billingPeriodView, showToast, useLiveBilling],
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
        const sub = await switchMySubscriptionMock('pro', billingPeriodView);
        setApiSub(sub);
        setMockProOpen(false);
        showToast('Тариф Pro подключён');
      } catch (e) {
        setToast(e instanceof Error ? e.message : 'Не удалось подключить Pro');
        window.setTimeout(() => setToast(null), 3200);
      }
      return;
    }
    confirmMockDemo();
  }, [billingPeriodView, confirmMockDemo, showToast, useLiveBilling]);

  const maxSvc = Math.max(1, limits.maxServices ?? 3);
  const maxAppt = Math.max(1, limits.maxMonthlyAppointments ?? 20);

  return (
    <div className="space-y-4">
      {toast ? (
        <div className="rounded-full bg-[#EAFBF2] px-5 py-3 text-center text-[14px] font-semibold text-[#2F8A5B] shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
          {toast}
        </div>
      ) : null}

      {apiLoading ? (
        <p className="text-center text-[13px] font-medium text-neutral-500">Загрузка тарифов…</p>
      ) : null}

      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Сейчас</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[34px] font-semibold leading-none tracking-[-0.065em] text-neutral-950">
                {planBadgeLabel(planStateView.plan)}
              </p>
              <p className="mt-2 text-[15px] font-semibold text-[#E29595]">Активен сейчас</p>
            </div>
            <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-semibold text-neutral-600">
              {planStateView.billingPeriod === 'year' ? 'Год' : 'Месяц'}
            </span>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
            {planStateView.plan === 'free'
              ? 'Вы можете пользоваться SLOTTY бесплатно. Когда понадобится больше услуг и записей — откройте Pro.'
              : 'У вас открыт полный доступ для одного мастера.'}
          </p>
        </div>
      </section>

      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-neutral-950">Использование</h2>

          {planStateView.plan === 'free' ? (
            <>
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
            </>
          ) : null}

          {planStateView.plan === 'pro' ? (
            <>
              <UsageRow label="Услуги" value="безлимит" />
              <UsageRow label="Записи" value="безлимит" />
              <UsageRow label="График работы" value={`${limits.scheduleHorizonDays} дней`} />
            </>
          ) : null}
        </div>
      </section>

      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <p className="text-[13px] font-semibold text-neutral-500">Период оплаты</p>
          <div className="mt-3 flex rounded-full bg-[#F1EFEF] p-1">
            <button
              type="button"
              onClick={() => void persistPeriod('month')}
              className={`min-h-11 flex-1 rounded-full px-3 text-[14px] font-semibold transition active:scale-[0.98] ${
                billingPeriodView === 'month' ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.06)]' : 'text-neutral-500'
              }`}
            >
              Месяц
            </button>
            <button
              type="button"
              onClick={() => void persistPeriod('year')}
              className={`min-h-11 flex-1 rounded-full px-3 text-[14px] font-semibold transition active:scale-[0.98] ${
                billingPeriodView === 'year' ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.06)]' : 'text-neutral-500'
              }`}
            >
              Год
            </button>
          </div>
          <p className="mt-3 text-center text-[13px] font-medium leading-snug text-neutral-500">
            2 месяца бесплатно при оплате за год
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <PlanCard
          planId="free"
          active={planStateView.plan === 'free'}
          billingPeriod={billingPeriodView}
          priceLineOverride={useLiveBilling && apiPlans ? formatPriceFromPlans(apiPlans, 'free', billingPeriodView) : undefined}
          recommended={false}
          onPrimary={() => void applyPlan('free')}
        />
        <PlanCard
          planId="pro"
          active={planStateView.plan === 'pro'}
          billingPeriod={billingPeriodView}
          priceLineOverride={useLiveBilling && apiPlans ? formatPriceFromPlans(apiPlans, 'pro', billingPeriodView) : undefined}
          recommended
          onPrimary={() => setMockProOpen(true)}
        />
      </div>

      <AdminBottomSheet open={mockProOpen} onClose={() => setMockProOpen(false)} title="Подключить Pro">
        <MockPaymentBody
          billingPeriod={billingPeriodView}
          proPrice={useLiveBilling && apiPlans ? formatPriceFromPlans(apiPlans, 'pro', billingPeriodView) : null}
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
      <span className="font-medium text-neutral-500">{label}</span>
      <span className="font-semibold tabular-nums text-neutral-950">{value}</span>
    </div>
  );
}

function PlanCard({
  planId,
  active,
  billingPeriod,
  priceLineOverride,
  recommended,
  onPrimary,
}: {
  planId: PlanId;
  active: boolean;
  billingPeriod: BillingPeriod;
  priceLineOverride?: string;
  recommended?: boolean;
  onPrimary: () => void;
}) {
  const meta = PLAN_UI[planId];
  const priceLine = priceLineOverride ?? formatPlanPrice(planId, billingPeriod);

  const label =
    planId === 'free'
      ? active
        ? 'Текущий тариф'
        : 'Перейти на Free'
      : active
        ? 'Текущий тариф'
        : 'Открыть Pro';

  return (
    <section
      className={`rounded-[36px] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)] ${
        active ? 'bg-[#E29595]/18 ring-2 ring-[#E29595]/35' : 'bg-[#F1EFEF]'
      }`}
    >
      <div className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[22px] font-semibold tracking-[-0.05em] text-neutral-950">{meta.name}</p>
            <p className="mt-1 text-[15px] font-semibold text-neutral-800">{priceLine}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">{meta.tagline}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {active ? (
              <span className="rounded-full bg-[#E29595] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Активен
              </span>
            ) : null}
            {recommended ? (
              <span className="rounded-full bg-[#F1EFEF] px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                Рекомендуем
              </span>
            ) : null}
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-[14px] leading-snug text-neutral-700">
          {meta.includes.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-[#E29595]" aria-hidden>
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {meta.limits.length ? (
          <div className="mt-4 rounded-[22px] bg-[#F1EFEF] px-4 py-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Ограничения</p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-neutral-600">
              {meta.limits.map((line) => (
                <li key={line}>— {line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (!active) onPrimary();
          }}
          disabled={active}
          className={`mt-5 flex min-h-[3.1rem] w-full items-center justify-center rounded-full px-4 text-[15px] font-semibold transition active:scale-[0.98] ${
            active
              ? 'cursor-default bg-[#F1EFEF] text-neutral-500'
              : 'bg-[#E29595] text-white shadow-[0_12px_30px_rgba(226,149,149,0.24)]'
          }`}
        >
          {label}
        </button>
      </div>
    </section>
  );
}

function MockPaymentBody({
  billingPeriod,
  proPrice,
  onBack,
  onDemo,
}: {
  billingPeriod: BillingPeriod;
  proPrice: string | null;
  onBack: () => void;
  onDemo: () => void | Promise<void>;
}) {
  const meta = PLAN_UI.pro;
  const amountLabel = proPrice ?? `${priceForPlan('pro', billingPeriod)} BYN`;
  return (
    <div className="space-y-4">
      <p className="text-[16px] font-semibold text-neutral-950">{meta.name}</p>
      <p className="text-[14px] text-neutral-600">
        Период:{' '}
        <span className="font-semibold text-neutral-900">{billingPeriod === 'year' ? 'год' : 'месяц'}</span>
        {' · '}
        <span className="font-semibold text-neutral-900">{amountLabel}</span>
      </p>
      <ul className="space-y-1.5 text-[14px] text-neutral-700">
        {meta.includes.slice(0, 6).map((x) => (
          <li key={x}>— {x}</li>
        ))}
      </ul>
      <p className="rounded-[20px] bg-[#F1EFEF] px-4 py-3 text-[13px] leading-relaxed text-neutral-600">
        Оплата будет подключена позже. Сейчас тариф активируется в demo-режиме.
      </p>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={() => void Promise.resolve(onDemo())}
          className="flex min-h-12 flex-[1.15] items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
        >
          Подключить в demo
        </button>
      </div>
    </div>
  );
}
