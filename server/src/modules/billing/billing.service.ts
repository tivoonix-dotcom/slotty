import type { PoolClient } from 'pg';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordBillingEvent } from './billingEvents.service.js';
import { quotePromoForCheckout, recordPromoRedemption } from './promoCode.service.js';
import { PORTFOLIO_PHOTO_LIMITS, type EffectivePlanCode } from './planLimits.config.js';

function num(v: string): number {
  return Number(v);
}

export type MasterPlanAccess = {
  subscriptionPlanCode: string;
  isProActive: boolean;
  proExpired: boolean;
  effectivePlanCode: EffectivePlanCode;
  currentPeriodEnd: string | null;
  proExpiresAt: string | null;
};

function isProSubscriptionExpired(
  planCode: string,
  currentPeriodEnd: Date | string | null,
  proExpiresAt: Date | string | null,
): boolean {
  if (planCode.toLowerCase() !== 'pro') return false;
  const now = Date.now();
  const ends: number[] = [];
  if (proExpiresAt) ends.push(new Date(proExpiresAt).getTime());
  if (currentPeriodEnd) ends.push(new Date(currentPeriodEnd).getTime());
  if (ends.length === 0) return false;
  return Math.min(...ends) < now;
}

/** Единая проверка активного Pro (plan + даты окончания). */
export async function getMasterPlanAccess(masterId: string): Promise<MasterPlanAccess> {
  await ensureMasterSubscription(masterId);
  const r = await query<{
    code: string;
    current_period_end: Date;
    pro_expires_at: Date | string | null;
  }>(
    `select sp.code,
            ms.current_period_end,
            mp.pro_expires_at
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
       left join public.master_profiles mp on mp.master_id = ms.master_id
      where ms.master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.internal('Подписка мастера недоступна');
  }
  const subscriptionPlanCode = row.code.toLowerCase();
  const proExpired = isProSubscriptionExpired(
    subscriptionPlanCode,
    row.current_period_end,
    row.pro_expires_at,
  );
  const isProActive = subscriptionPlanCode === 'pro' && !proExpired;
  return {
    subscriptionPlanCode,
    isProActive,
    proExpired,
    effectivePlanCode: isProActive ? 'pro' : 'free',
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end).toISOString() : null,
    proExpiresAt: row.pro_expires_at ? new Date(row.pro_expires_at).toISOString() : null,
  };
}

async function getEffectivePlanLimits(masterId: string): Promise<{
  maxServices: number | null;
  maxMonthlyAppointments: number | null;
  maxScheduleDaysAhead: number;
}> {
  const access = await getMasterPlanAccess(masterId);
  const r = await query<{
    max_services: number | null;
    max_monthly_appointments: number | null;
    max_schedule_days_ahead: number;
  }>(
    `select max_services, max_monthly_appointments, max_schedule_days_ahead
       from public.subscription_plans
      where code = $1 and is_active = true
      limit 1`,
    [access.effectivePlanCode],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.internal(`План ${access.effectivePlanCode} не найден`);
  }
  return {
    maxServices: row.max_services,
    maxMonthlyAppointments: row.max_monthly_appointments,
    maxScheduleDaysAhead: row.max_schedule_days_ahead,
  };
}

/** Mock Pro в production всегда запрещён. В dev/test — по NODE_ENV или ALLOW_SUBSCRIPTION_MOCK. */
export function isSubscriptionMockSwitchAllowed(): boolean {
  if (env.NODE_ENV === 'production') {
    return false;
  }
  return env.NODE_ENV === 'development' || env.NODE_ENV === 'test' || env.ALLOW_SUBSCRIPTION_MOCK === true;
}

export async function listSubscriptionPlans() {
  const r = await query(
    `select id, code, name, price_month::text, price_year::text, max_services, max_monthly_appointments,
            max_schedule_days_ahead, can_use_analytics, can_use_pdf, can_use_priority_listing, sort_order
       from public.subscription_plans
      where is_active = true
      order by sort_order asc, name asc`,
  );
  return r.rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    priceMonth: Number(row.price_month),
    priceYear: Number(row.price_year),
    maxServices: row.max_services,
    maxMonthlyAppointments: row.max_monthly_appointments,
    maxScheduleDaysAhead: row.max_schedule_days_ahead,
    canUseAnalytics: row.can_use_analytics,
    canUsePdf: row.can_use_pdf,
    canUsePriorityListing: row.can_use_priority_listing,
    sortOrder: row.sort_order,
  }));
}

export async function ensureMasterSubscriptionWithClient(client: PoolClient, masterId: string): Promise<void> {
  const plan = await client.query<{ id: string }>(
    `select id from public.subscription_plans where code = 'free' and is_active = true limit 1`,
  );
  const planId = plan.rows[0]?.id;
  if (!planId) {
    throw ApiError.internal('План подписки free не найден в базе');
  }
  await client.query(
    `insert into public.master_subscriptions (
       master_id, plan_id, status, billing_period, current_period_start, current_period_end
     ) values ($1, $2, 'active'::public.subscription_status, 'month'::public.billing_period, now(), now() + interval '400 days')
     on conflict (master_id) do nothing`,
    [masterId, planId],
  );
}

export async function ensureMasterSubscription(masterId: string): Promise<void> {
  const plan = await query<{ id: string }>(
    `select id from public.subscription_plans where code = 'free' and is_active = true limit 1`,
  );
  const planId = plan.rows[0]?.id;
  if (!planId) {
    throw ApiError.internal('План подписки free не найден в базе');
  }
  await query(
    `insert into public.master_subscriptions (
       master_id, plan_id, status, billing_period, current_period_start, current_period_end
     ) values ($1, $2, 'active'::public.subscription_status, 'month'::public.billing_period, now(), now() + interval '400 days')
     on conflict (master_id) do nothing`,
    [masterId, planId],
  );
}

export type MasterSubscriptionPlanDto = {
  code: string;
  name: string;
  priceMonth: number;
  priceYear: number;
  maxServices: number | null;
  maxMonthlyAppointments: number | null;
  maxScheduleDaysAhead: number;
  canUseAnalytics: boolean;
  canUsePdf: boolean;
  canUsePriorityListing: boolean;
};

export type MasterSubscriptionWithUsageDto = {
  id: string;
  masterId: string;
  status: string;
  billingPeriod: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: MasterSubscriptionPlanDto;
  usage: {
    activeServices: number;
    monthlyAppointments: number;
  };
};

function mapJoinedPlanRow(row: {
  code: string;
  name: string;
  price_month: string;
  price_year: string;
  max_services: number | null;
  max_monthly_appointments: number | null;
  max_schedule_days_ahead: number;
  can_use_analytics: boolean;
  can_use_pdf: boolean;
  can_use_priority_listing: boolean;
}): MasterSubscriptionPlanDto {
  return {
    code: row.code,
    name: row.name,
    priceMonth: num(row.price_month),
    priceYear: num(row.price_year),
    maxServices: row.max_services,
    maxMonthlyAppointments: row.max_monthly_appointments,
    maxScheduleDaysAhead: row.max_schedule_days_ahead,
    canUseAnalytics: row.can_use_analytics,
    canUsePdf: row.can_use_pdf,
    canUsePriorityListing: row.can_use_priority_listing,
  };
}

export async function assertMasterHasProPlan(masterId: string): Promise<void> {
  const access = await getMasterPlanAccess(masterId);
  if (access.proExpired) {
    throw ApiError.forbidden(
      'Срок Pro истёк. Продлите тариф в разделе «Тарифы».',
      'SUBSCRIPTION_EXPIRED',
    );
  }
  if (!access.isProActive) {
    throw ApiError.forbidden(
      'Функция доступна по подписке «Мастер Pro». Подключите тариф в разделе «Тарифы».',
      'PRO_REQUIRED',
    );
  }
}

export async function assertCanAddPortfolioItem(masterId: string): Promise<void> {
  const access = await getMasterPlanAccess(masterId);
  const max =
    access.effectivePlanCode === 'pro' ? PORTFOLIO_PHOTO_LIMITS.pro : PORTFOLIO_PHOTO_LIMITS.free;
  const cnt = await query<{ c: number }>(
    `select count(*)::int as c from public.master_portfolio_items where master_id = $1`,
    [masterId],
  );
  if ((cnt.rows[0]?.c ?? 0) >= max) {
    const msg =
      access.effectivePlanCode === 'pro'
        ? `Достигнут лимит портфолио (${max} фото)`
        : `Достигнут лимит Free (${max} фото). Подключите Pro для большего портфолио.`;
    throw ApiError.forbidden(msg, 'PLAN_LIMIT_REACHED');
  }
}

export async function getMasterSubscriptionWithUsage(masterId: string): Promise<MasterSubscriptionWithUsageDto> {
  await ensureMasterSubscription(masterId);
  const r = await query<{
    id: string;
    master_id: string;
    status: string;
    billing_period: string;
    current_period_start: Date;
    current_period_end: Date;
    code: string;
    name: string;
    price_month: string;
    price_year: string;
    max_services: number | null;
    max_monthly_appointments: number | null;
    max_schedule_days_ahead: number;
    can_use_analytics: boolean;
    can_use_pdf: boolean;
    can_use_priority_listing: boolean;
    active_services: number;
    monthly_appointments: number;
  }>(
    `select ms.id,
            ms.master_id,
            ms.status::text as status,
            ms.billing_period::text as billing_period,
            ms.current_period_start,
            ms.current_period_end,
            sp.code,
            sp.name,
            sp.price_month::text,
            sp.price_year::text,
            sp.max_services,
            sp.max_monthly_appointments,
            sp.max_schedule_days_ahead,
            sp.can_use_analytics,
            sp.can_use_pdf,
            sp.can_use_priority_listing,
            (select count(*)::int
               from public.master_services s
              where s.master_id = ms.master_id
                and s.is_active = true) as active_services,
            (select count(*)::int
               from public.appointments a
              where a.master_id = ms.master_id
                and a.starts_at >= date_trunc('month', now())
                and a.starts_at < date_trunc('month', now()) + interval '1 month'
                and a.status not in (
                  'cancelled_by_client'::public.appointment_status,
                  'cancelled_by_master'::public.appointment_status
                )) as monthly_appointments
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where ms.master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.internal('Подписка мастера недоступна');
  }
  return {
    id: row.id,
    masterId: row.master_id,
    status: row.status,
    billingPeriod: row.billing_period,
    currentPeriodStart: (row.current_period_start as Date).toISOString(),
    currentPeriodEnd: (row.current_period_end as Date).toISOString(),
    plan: mapJoinedPlanRow(row),
    usage: {
      activeServices: row.active_services,
      monthlyAppointments: row.monthly_appointments,
    },
  };
}

export async function switchMasterSubscriptionMock(
  masterId: string,
  planCode: 'free' | 'pro',
  billingPeriod: 'month' | 'year',
  options?: { promoCode?: string | null },
): Promise<MasterSubscriptionWithUsageDto> {
  if (!isSubscriptionMockSwitchAllowed()) {
    throw ApiError.forbidden('Переключение тарифа (mock) отключено в этой среде', 'SUBSCRIPTION_MOCK_DISABLED');
  }
  await ensureMasterSubscription(masterId);
  const before = await getMasterSubscriptionWithUsage(masterId);
  const plan = await query<{ id: string; price_month: string; price_year: string }>(
    `select id, price_month::text, price_year::text
       from public.subscription_plans where code = $1 and is_active = true limit 1`,
    [planCode],
  );
  const planRow = plan.rows[0];
  if (!planRow?.id) {
    throw ApiError.badRequest('Неизвестный тариф', 'UNKNOWN_PLAN');
  }
  await query(
    `update public.master_subscriptions
        set plan_id = $1,
            billing_period = $2::public.billing_period,
            updated_at = now()
      where master_id = $3`,
    [planRow.id, billingPeriod, masterId],
  );

  let amount =
    planCode === 'pro'
      ? billingPeriod === 'year'
        ? Number(planRow.price_year)
        : Number(planRow.price_month)
      : 0;

  let eventMetadata: Record<string, unknown> = {
    fromPlan: before.plan.code,
    toPlan: planCode,
    fromPeriod: before.billingPeriod,
    toPeriod: billingPeriod,
  };

  if (planCode === 'pro' && options?.promoCode?.trim()) {
    const quote = await quotePromoForCheckout(options.promoCode.trim(), billingPeriod, 'pro');
    amount = quote.finalAmount;
    eventMetadata = {
      ...eventMetadata,
      promoCode: quote.code,
      promoCodeId: quote.promoCodeId,
      discountPercent: quote.discountPercent,
      baseAmount: quote.baseAmount,
      discountAmount: quote.discountAmount,
      finalAmount: quote.finalAmount,
    };
    await recordPromoRedemption({
      promoCodeId: quote.promoCodeId,
      masterId,
      billingPeriod,
      baseAmount: quote.baseAmount,
      discountAmount: quote.discountAmount,
      finalAmount: quote.finalAmount,
    });
  }

  await recordBillingEvent({
    masterId,
    eventType: planCode === 'pro' ? 'subscription_purchased' : 'plan_changed',
    planCode,
    billingPeriod,
    amount,
    status: 'succeeded',
    source: 'mock',
    metadata: eventMetadata,
  });

  if (planCode === 'pro') {
    await query(
      `update public.master_profiles
          set master_plan = 'pro',
              pro_status = 'active',
              pro_started_at = coalesce(pro_started_at, now()),
              pro_expires_at = case
                when $2::text = 'year' then now() + interval '1 year'
                else now() + interval '1 month'
              end,
              updated_at = now()
        where master_id = $1`,
      [masterId, billingPeriod],
    );
  } else {
    await query(
      `update public.master_profiles
          set master_plan = 'basic',
              pro_status = coalesce(pro_status, 'inactive'),
              updated_at = now()
        where master_id = $1`,
      [masterId],
    );
  }

  return getMasterSubscriptionWithUsage(masterId);
}

/** Активация Pro после ручного подтверждения оплаты админом (не mock). */
export async function activateMasterProFromManualPayment(
  masterId: string,
  billingPeriod: 'month' | 'year',
  options: {
    amount: number;
    metadata: Record<string, unknown>;
    durationDays?: number;
  },
): Promise<MasterSubscriptionWithUsageDto> {
  await ensureMasterSubscription(masterId);

  const planRow = await query<{ id: string; price_month: string; price_year: string }>(
    `select id, price_month::text, price_year::text
       from public.subscription_plans
      where code = 'pro' and is_active = true
      limit 1`,
  );
  const plan = planRow.rows[0];
  if (!plan) {
    throw ApiError.internal('План Pro не найден');
  }

  const durationDays = Math.min(Math.max(options.durationDays ?? 30, 1), 366);

  await query(
    `update public.master_subscriptions
        set plan_id = $1,
            billing_period = $2::public.billing_period,
            current_period_start = now(),
            current_period_end = now() + ($3::int || ' days')::interval,
            updated_at = now()
      where master_id = $4`,
    [plan.id, billingPeriod, durationDays, masterId],
  );

  await recordBillingEvent({
    masterId,
    eventType: 'subscription_purchased',
    planCode: 'pro',
    billingPeriod,
    amount: options.amount,
    status: 'succeeded',
    source: 'manual_payment',
    metadata: { ...options.metadata, durationDays },
  });

  await query(
    `update public.master_profiles
        set master_plan = 'pro',
            pro_status = 'active',
            pro_started_at = coalesce(pro_started_at, now()),
            pro_expires_at = now() + ($2::int || ' days')::interval,
            updated_at = now()
      where master_id = $1`,
    [masterId, durationDays],
  );

  return getMasterSubscriptionWithUsage(masterId);
}

export async function recordMasterCheckoutStarted(
  masterId: string,
  billingPeriod: 'month' | 'year',
): Promise<void> {
  const plan = await query<{ price_month: string; price_year: string }>(
    `select price_month::text, price_year::text
       from public.subscription_plans where code = 'pro' and is_active = true limit 1`,
  );
  const row = plan.rows[0];
  const amount = row
    ? billingPeriod === 'year'
      ? Number(row.price_year)
      : Number(row.price_month)
    : null;
  await recordBillingEvent({
    masterId,
    eventType: 'checkout_started',
    planCode: 'pro',
    billingPeriod,
    amount,
    status: 'pending',
    source: 'mock',
    metadata: { step: 'pro_checkout_modal' },
  });
}

export async function assertCanCreateMasterService(masterId: string): Promise<void> {
  const limits = await getEffectivePlanLimits(masterId);
  const maxS = limits.maxServices;
  if (maxS == null) return;
  const cnt = await query<{ c: number }>(
    `select count(*)::int as c
       from public.master_services
      where master_id = $1
        and is_active = true`,
    [masterId],
  );
  if ((cnt.rows[0]?.c ?? 0) >= maxS) {
    throw ApiError.forbidden('Достигнут лимит числа услуг по тарифу', 'LIMIT_SERVICES_REACHED');
  }
}

export async function assertSlotWithinPlanHorizon(masterId: string, startsAt: Date): Promise<void> {
  const limits = await getEffectivePlanLimits(masterId);
  const days = limits.maxScheduleDaysAhead;
  if (days == null || days <= 0) return;
  const horizonMs = days * 24 * 60 * 60 * 1000;
  if (startsAt.getTime() > Date.now() + horizonMs) {
    throw ApiError.forbidden('Дата окна превышает горизонт расписания по тарифу', 'LIMIT_SCHEDULE_DAYS_REACHED');
  }
}

export async function assertMasterMonthlyAppointmentsAllowNew(client: PoolClient, masterId: string): Promise<void> {
  await ensureMasterSubscriptionWithClient(client, masterId);
  const access = await getMasterPlanAccess(masterId);
  const lim = await client.query<{ max: number | null }>(
    `select max_monthly_appointments as max
       from public.subscription_plans
      where code = $1 and is_active = true
      limit 1`,
    [access.effectivePlanCode],
  );
  const maxM = lim.rows[0]?.max;
  if (maxM == null) return;
  const cnt = await client.query<{ c: number }>(
    `select count(*)::int as c
       from public.appointments a
      where a.master_id = $1
        and a.starts_at >= date_trunc('month', now())
        and a.starts_at < date_trunc('month', now()) + interval '1 month'
        and a.status not in (
          'cancelled_by_client'::public.appointment_status,
          'cancelled_by_master'::public.appointment_status
        )`,
    [masterId],
  );
  if ((cnt.rows[0]?.c ?? 0) >= maxM) {
    throw ApiError.forbidden('У мастера достигнут лимит записей на месяц по тарифу', 'LIMIT_MONTHLY_APPOINTMENTS_REACHED');
  }
}
