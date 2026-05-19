import type { PoolClient } from 'pg';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

function num(v: string): number {
  return Number(v);
}

/** Dev/test или явный флаг в production — переключение тарифа без оплаты (временно). */
export function isSubscriptionMockSwitchAllowed(): boolean {
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
  const sub = await getMasterSubscriptionWithUsage(masterId);
  if (sub.plan.code.toLowerCase() !== 'pro') {
    throw ApiError.forbidden('Акции и наборы доступны на тарифе Pro', 'PRO_REQUIRED');
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
): Promise<MasterSubscriptionWithUsageDto> {
  if (!isSubscriptionMockSwitchAllowed()) {
    throw ApiError.forbidden('Переключение тарифа (mock) отключено в этой среде', 'SUBSCRIPTION_MOCK_DISABLED');
  }
  await ensureMasterSubscription(masterId);
  const plan = await query<{ id: string }>(
    `select id from public.subscription_plans where code = $1 and is_active = true limit 1`,
    [planCode],
  );
  const planId = plan.rows[0]?.id;
  if (!planId) {
    throw ApiError.badRequest('Неизвестный тариф', 'UNKNOWN_PLAN');
  }
  await query(
    `update public.master_subscriptions
        set plan_id = $1,
            billing_period = $2::public.billing_period,
            updated_at = now()
      where master_id = $3`,
    [planId, billingPeriod, masterId],
  );
  return getMasterSubscriptionWithUsage(masterId);
}

export async function assertCanCreateMasterService(masterId: string): Promise<void> {
  await ensureMasterSubscription(masterId);
  const lim = await query<{ max: number | null }>(
    `select sp.max_services as max
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where ms.master_id = $1`,
    [masterId],
  );
  const maxS = lim.rows[0]?.max;
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
  await ensureMasterSubscription(masterId);
  const lim = await query<{ days: number }>(
    `select sp.max_schedule_days_ahead as days
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where ms.master_id = $1`,
    [masterId],
  );
  const days = lim.rows[0]?.days;
  if (days == null || days <= 0) return;
  const horizonMs = days * 24 * 60 * 60 * 1000;
  if (startsAt.getTime() > Date.now() + horizonMs) {
    throw ApiError.forbidden('Дата окна превышает горизонт расписания по тарифу', 'LIMIT_SCHEDULE_DAYS_REACHED');
  }
}

export async function assertMasterMonthlyAppointmentsAllowNew(client: PoolClient, masterId: string): Promise<void> {
  await ensureMasterSubscriptionWithClient(client, masterId);
  const lim = await client.query<{ max: number | null }>(
    `select sp.max_monthly_appointments as max
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where ms.master_id = $1`,
    [masterId],
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
