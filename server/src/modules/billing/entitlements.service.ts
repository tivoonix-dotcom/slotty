import type { PoolClient } from 'pg';
import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { ensureMasterSubscription, ensureMasterSubscriptionWithClient } from './billing.service.js';
import { PORTFOLIO_PHOTO_LIMITS } from './planLimits.config.js';
import {
  deriveSubscriptionUiState,
  isProEntitled as isProEntitledFromState,
  type SubscriptionRowLite,
} from './subscriptionBilling.state.js';
import type { EffectiveMasterPlan, EntitlementSource, MasterEntitlements } from './entitlements.types.js';
import { assertProFeature } from './trial.service.js';

type SubscriptionEntitlementRow = {
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: Date;
  trial_started_at: Date | null;
  trial_ends_at: Date | null;
  trial_consumed: boolean;
  plan_code: string;
  pro_expires_at: Date | null;
  max_services: number | null;
  max_monthly_appointments: number | null;
  max_schedule_days_ahead: number;
  can_use_analytics: boolean;
  can_use_pdf: boolean;
  can_use_priority_listing: boolean;
};

function daysLeft(endsAt: Date | null, now = Date.now()): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function isTrialActive(row: SubscriptionEntitlementRow, now = Date.now()): boolean {
  if (row.status !== 'trialing') return false;
  if (!row.trial_ends_at) return false;
  return new Date(row.trial_ends_at).getTime() > now;
}

function toLite(row: SubscriptionEntitlementRow): SubscriptionRowLite {
  return {
    planCode: row.plan_code,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    proExpiresAt: row.pro_expires_at,
    trialEndsAt: row.trial_ends_at,
  };
}

function resolveEntitlementSource(
  row: SubscriptionEntitlementRow,
  uiState: ReturnType<typeof deriveSubscriptionUiState>,
  entitled: boolean,
  now = Date.now(),
): EntitlementSource {
  if (!entitled) return 'free';
  if (isTrialActive(row, now)) return 'trial';
  if (uiState === 'past_due') return 'grace';
  const proExpires = row.pro_expires_at ? new Date(row.pro_expires_at).getTime() : null;
  const periodEnd = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const paidActive =
    row.plan_code === 'pro' &&
    row.status !== 'trialing' &&
    periodEnd != null &&
    periodEnd > now;
  if (paidActive) return 'paid';
  if (proExpires != null && proExpires > now) return 'complimentary';
  return 'paid';
}

function resolveEffectivePlan(
  row: SubscriptionEntitlementRow,
  entitled: boolean,
  now = Date.now(),
): EffectiveMasterPlan {
  if (!entitled) return 'free';
  if (isTrialActive(row, now)) return 'trial_pro';
  return 'pro';
}

function buildFeatures(entitled: boolean, proPlanFlags: Pick<SubscriptionEntitlementRow, 'can_use_analytics' | 'can_use_pdf' | 'can_use_priority_listing'>) {
  return {
    advancedAnalytics: entitled && proPlanFlags.can_use_analytics,
    bundlesAndPromotions: entitled,
    smartPromotions: entitled,
    catalogBoost: entitled && proPlanFlags.can_use_priority_listing,
    priorityListing: entitled && proPlanFlags.can_use_priority_listing,
    proBadge: entitled,
    pdfExport: entitled && proPlanFlags.can_use_pdf,
    dataExport: entitled,
    advancedCrm: false,
  };
}

async function loadEntitlementRow(masterId: string): Promise<SubscriptionEntitlementRow> {
  const { expireDueSubscriptions } = await import('./subscriptionBilling.service.js');
  await expireDueSubscriptions(masterId);
  await ensureMasterSubscription(masterId);

  const r = await query<SubscriptionEntitlementRow>(
    `select ms.status::text as status,
            ms.cancel_at_period_end,
            ms.current_period_end,
            ms.trial_started_at,
            ms.trial_ends_at,
            coalesce(ms.trial_consumed, true) as trial_consumed,
            sp.code as plan_code,
            mp.pro_expires_at,
            sp.max_services,
            sp.max_monthly_appointments,
            sp.max_schedule_days_ahead,
            sp.can_use_analytics,
            sp.can_use_pdf,
            sp.can_use_priority_listing
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
       left join public.master_profiles mp on mp.master_id = ms.master_id
      where ms.master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.internal('Подписка мастера недоступна');
  return row;
}

async function loadEntitlementRowWithClient(client: PoolClient, masterId: string): Promise<SubscriptionEntitlementRow> {
  await ensureMasterSubscriptionWithClient(client, masterId);
  const r = await client.query<SubscriptionEntitlementRow>(
    `select ms.status::text as status,
            ms.cancel_at_period_end,
            ms.current_period_end,
            ms.trial_started_at,
            ms.trial_ends_at,
            coalesce(ms.trial_consumed, true) as trial_consumed,
            sp.code as plan_code,
            mp.pro_expires_at,
            sp.max_services,
            sp.max_monthly_appointments,
            sp.max_schedule_days_ahead,
            sp.can_use_analytics,
            sp.can_use_pdf,
            sp.can_use_priority_listing
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
       left join public.master_profiles mp on mp.master_id = ms.master_id
      where ms.master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.internal('Подписка мастера недоступна');
  return row;
}

function buildEntitlementsFromRow(row: SubscriptionEntitlementRow, now = Date.now()): MasterEntitlements {
  const lite = toLite(row);
  const uiState = deriveSubscriptionUiState(lite, now);
  const entitled = isProEntitledFromState(lite, now);
  const effectivePlan = resolveEffectivePlan(row, entitled, now);
  const source = resolveEntitlementSource(row, uiState, entitled, now);
  const trialActive = isTrialActive(row, now);

  return {
    effectivePlan,
    isProEntitled: entitled,
    source,
    trial: {
      isActive: trialActive,
      startedAt: row.trial_started_at ? new Date(row.trial_started_at).toISOString() : null,
      endsAt: row.trial_ends_at ? new Date(row.trial_ends_at).toISOString() : null,
      daysLeft: trialActive ? daysLeft(row.trial_ends_at, now) : row.trial_consumed ? 0 : null,
      consumed: row.trial_consumed,
    },
    subscription: {
      status: row.status,
      currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end).toISOString() : null,
      cancelAtPeriodEnd: row.cancel_at_period_end,
    },
    limits: {
      maxServices: entitled ? row.max_services : row.max_services,
      maxMonthlyAppointments: entitled ? row.max_monthly_appointments : row.max_monthly_appointments,
      scheduleHorizonDays: entitled ? row.max_schedule_days_ahead : 14,
      maxPortfolioPhotos: entitled ? PORTFOLIO_PHOTO_LIMITS.pro : PORTFOLIO_PHOTO_LIMITS.free,
    },
    features: buildFeatures(entitled, row),
  };
}

export async function getMasterEntitlements(masterId: string): Promise<MasterEntitlements> {
  let row = await loadEntitlementRow(masterId);
  if (!row) throw ApiError.internal('Подписка мастера недоступна');

  if (!isProEntitledFromState(toLite(row)) && row.plan_code === 'pro') {
    const freeLimits = await query<{
      max_services: number | null;
      max_monthly_appointments: number | null;
      max_schedule_days_ahead: number;
    }>(
      `select max_services, max_monthly_appointments, max_schedule_days_ahead
         from public.subscription_plans
        where code = 'free' and is_active = true
        limit 1`,
    );
    const free = freeLimits.rows[0];
    if (free) {
      row = {
        ...row,
        max_services: free.max_services,
        max_monthly_appointments: free.max_monthly_appointments,
        max_schedule_days_ahead: free.max_schedule_days_ahead,
      };
    }
  } else if (isProEntitledFromState(toLite(row)) && row.plan_code === 'free') {
    const proLimits = await query<{
      max_services: number | null;
      max_monthly_appointments: number | null;
      max_schedule_days_ahead: number;
      can_use_analytics: boolean;
      can_use_pdf: boolean;
      can_use_priority_listing: boolean;
    }>(
      `select max_services, max_monthly_appointments, max_schedule_days_ahead,
              can_use_analytics, can_use_pdf, can_use_priority_listing
         from public.subscription_plans
        where code = 'pro' and is_active = true
        limit 1`,
    );
    const pro = proLimits.rows[0];
    if (pro) {
      row = { ...row, ...pro, plan_code: 'pro' };
    }
  }

  const ent = buildEntitlementsFromRow(row);
  if (!ent.isProEntitled) {
    const freeLimits = await query<{
      max_services: number | null;
      max_monthly_appointments: number | null;
    }>(
      `select max_services, max_monthly_appointments
         from public.subscription_plans
        where code = 'free' and is_active = true
        limit 1`,
    );
    const free = freeLimits.rows[0];
    if (free) {
      ent.limits.maxServices = free.max_services;
      ent.limits.maxMonthlyAppointments = free.max_monthly_appointments;
      ent.limits.scheduleHorizonDays = 14;
      ent.limits.maxPortfolioPhotos = PORTFOLIO_PHOTO_LIMITS.free;
    }
  }
  return ent;
}

export async function getMasterEntitlementsWithClient(
  client: PoolClient,
  masterId: string,
): Promise<MasterEntitlements> {
  const row = await loadEntitlementRowWithClient(client, masterId);
  const ent = buildEntitlementsFromRow(row);
  if (!ent.isProEntitled) {
    const freeLimits = await client.query<{
      max_services: number | null;
      max_monthly_appointments: number | null;
    }>(
      `select max_services, max_monthly_appointments
         from public.subscription_plans
        where code = 'free' and is_active = true
        limit 1`,
    );
    const free = freeLimits.rows[0];
    if (free) {
      ent.limits.maxServices = free.max_services;
      ent.limits.maxMonthlyAppointments = free.max_monthly_appointments;
      ent.limits.scheduleHorizonDays = 14;
      ent.limits.maxPortfolioPhotos = PORTFOLIO_PHOTO_LIMITS.free;
    }
  }
  return ent;
}

export async function assertCanCreateService(masterId: string): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  const maxS = ent.limits.maxServices;
  if (maxS == null) return;
  const cnt = await query<{ c: number }>(
    `select count(*)::int as c from public.master_services where master_id = $1 and is_active = true`,
    [masterId],
  );
  if ((cnt.rows[0]?.c ?? 0) >= maxS) {
    const msg = ent.isProEntitled
      ? 'Достигнут лимит числа услуг по тарифу'
      : 'На Free можно создать до 3 услуг. Перейдите на Pro для большего.';
    throw ApiError.forbidden(msg, 'LIMIT_SERVICES_REACHED');
  }
}

export async function assertCanCreateBookingWindow(masterId: string, startsAt: Date): Promise<void> {
  await assertSlotWithinPlanHorizon(masterId, startsAt);
}

export async function assertCanCreateMonthlySlots(
  masterId: string,
  _startsAt?: Date,
  _endAt?: Date,
): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  const maxM = ent.limits.maxMonthlyAppointments;
  if (maxM == null) return;
  const cnt = await query<{ c: number }>(
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
    throw ApiError.forbidden(
      ent.isProEntitled
        ? 'У мастера достигнут лимит записей на месяц по тарифу'
        : 'На Free доступно до 20 записей в месяц. Перейдите на Pro.',
      'LIMIT_MONTHLY_APPOINTMENTS_REACHED',
    );
  }
}

export async function assertCanUploadPortfolioPhoto(masterId: string): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  const max = ent.limits.maxPortfolioPhotos;
  const cnt = await query<{ c: number }>(
    `select count(*)::int as c from public.master_portfolio_items where master_id = $1`,
    [masterId],
  );
  if ((cnt.rows[0]?.c ?? 0) >= max) {
    throw ApiError.forbidden(
      ent.isProEntitled
        ? `Достигнут лимит портфолио (${max} фото)`
        : `Достигнут лимит Free (${max} фото). Подключите Pro для большего портфолио.`,
      'PLAN_LIMIT_REACHED',
    );
  }
}

export async function assertCanUseAdvancedAnalytics(masterId: string): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  assertProFeature(
    ent.features.advancedAnalytics,
    'Перейдите на Pro, чтобы использовать расширенную аналитику',
  );
}

export async function assertCanUseBundlesAndPromotions(masterId: string): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  assertProFeature(ent.features.bundlesAndPromotions, 'Акции и наборы услуг доступны на Pro');
}

export async function assertCanUseSmartPromotions(masterId: string): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  assertProFeature(ent.features.smartPromotions, 'Умные акции доступны на Pro');
}

export async function assertCanUsePdfExport(masterId: string): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  assertProFeature(ent.features.pdfExport, 'Эта функция доступна на Pro');
}

export async function assertCanUseCatalogBoost(masterId: string): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  assertProFeature(ent.features.catalogBoost, 'Продвижение в каталоге доступно на Pro');
}

export async function assertCanUseDataExport(masterId: string): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  assertProFeature(ent.features.dataExport, 'Экспорт данных доступен на Pro');
}

export async function assertMasterHasProEntitlement(masterId: string): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  if (ent.trial.consumed && !ent.trial.isActive && !ent.isProEntitled && ent.effectivePlan === 'free') {
    throw ApiError.forbidden('Пробный Pro закончился. Перейдите на Pro в разделе «Тарифы».', 'TRIAL_EXPIRED');
  }
  if (!ent.isProEntitled) {
    throw ApiError.forbidden('Эта функция доступна на Pro', 'PRO_REQUIRED');
  }
}

export async function assertSlotWithinPlanHorizon(masterId: string, startsAt: Date): Promise<void> {
  const ent = await getMasterEntitlements(masterId);
  const days = ent.limits.scheduleHorizonDays;
  if (days == null || days <= 0) return;
  const horizonMs = days * 24 * 60 * 60 * 1000;
  if (startsAt.getTime() > Date.now() + horizonMs) {
    const msg = ent.isProEntitled
      ? 'Дата окна превышает горизонт расписания по тарифу'
      : 'На Free расписание доступно на 14 дней вперёд. Перейдите на Pro для 90 дней.';
    throw ApiError.forbidden(msg, 'LIMIT_SCHEDULE_DAYS_REACHED');
  }
}

export async function assertMasterMonthlyAppointmentsAllowNew(
  client: PoolClient,
  masterId: string,
): Promise<void> {
  await ensureMasterSubscriptionWithClient(client, masterId);
  const ent = await getMasterEntitlementsWithClient(client, masterId);
  const maxM = ent.limits.maxMonthlyAppointments;
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
    throw ApiError.forbidden(
      'У мастера достигнут лимит записей на месяц по тарифу',
      'LIMIT_MONTHLY_APPOINTMENTS_REACHED',
    );
  }
}
