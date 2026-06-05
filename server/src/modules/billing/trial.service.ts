import type { PoolClient } from 'pg';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { ensureMasterSubscription, ensureMasterSubscriptionWithClient } from './billing.service.js';
import { recordBillingEvent } from './billingEvents.service.js';

export const PRO_TRIAL_DAYS = 7;

function isAutoStartProTrialEnabled(): boolean {
  if (env.AUTO_START_PRO_TRIAL_ENABLED === false) return false;
  if (env.AUTO_START_PRO_TRIAL_ENABLED === true) return true;
  return env.NODE_ENV !== 'production';
}

async function startProTrialWithClient(client: PoolClient, masterId: string): Promise<boolean> {
  if (!isAutoStartProTrialEnabled()) return false;

  const sub = await client.query<{
    trial_consumed: boolean;
    status: string;
    plan_code: string;
    current_period_end: Date;
    trial_ends_at: Date | null;
  }>(
    `select ms.trial_consumed,
            ms.status::text as status,
            sp.code as plan_code,
            ms.current_period_end,
            ms.trial_ends_at
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where ms.master_id = $1
      for update`,
    [masterId],
  );
  const row = sub.rows[0];
  if (!row || row.trial_consumed) return false;

  const now = Date.now();
  const hasPaidPro =
    row.plan_code === 'pro' &&
    row.status !== 'trialing' &&
    new Date(row.current_period_end).getTime() > now;
  if (hasPaidPro) return false;

  const proPlan = await client.query<{ id: string }>(
    `select id from public.subscription_plans where code = 'pro' and is_active = true limit 1`,
  );
  const proPlanId = proPlan.rows[0]?.id;
  if (!proPlanId) return false;

  const trialEnds = new Date(now + PRO_TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await client.query(
    `update public.master_subscriptions
        set plan_id = $2,
            status = 'trialing'::public.subscription_status,
            billing_period = 'month'::public.billing_period,
            current_period_start = now(),
            current_period_end = $3,
            trial_started_at = now(),
            trial_ends_at = $3,
            trial_consumed = true,
            trial_source = 'onboarding',
            trial_activated_by = 'system',
            cancel_at_period_end = false,
            cancelled_at = null,
            next_charge_at = null,
            updated_at = now()
      where master_id = $1`,
    [masterId, proPlanId, trialEnds],
  );

  await client.query(
    `update public.master_profiles
        set master_plan = 'pro',
            pro_status = 'active',
            pro_started_at = coalesce(pro_started_at, now()),
            pro_expires_at = $2,
            updated_at = now()
      where master_id = $1`,
    [masterId, trialEnds],
  );

  return true;
}

/** Старт 7-дневного Pro trial после onboarding (один раз на master_id). */
export async function tryStartProTrial(masterId: string): Promise<boolean> {
  if (!isAutoStartProTrialEnabled()) return false;
  await ensureMasterSubscription(masterId);

  const { withTransaction } = await import('../../config/db.js');
  let didStart = false;
  await withTransaction(async (client) => {
    didStart = await startProTrialWithClient(client, masterId);
  });

  if (didStart) {
    await recordBillingEvent({
      masterId,
      eventType: 'trial_started',
      planCode: 'pro',
      billingPeriod: 'month',
      status: 'succeeded',
      source: 'onboarding',
      metadata: { trialDays: PRO_TRIAL_DAYS },
    }).catch(() => {});
  }

  return didStart;
}

export async function tryStartProTrialWithClient(client: PoolClient, masterId: string): Promise<boolean> {
  if (!isAutoStartProTrialEnabled()) return false;
  await ensureMasterSubscriptionWithClient(client, masterId);
  return startProTrialWithClient(client, masterId);
}

export async function recordTrialConvertedToPaid(masterId: string): Promise<void> {
  await recordBillingEvent({
    masterId,
    eventType: 'trial_converted_to_paid',
    planCode: 'pro',
    status: 'succeeded',
    source: 'billing',
  }).catch(() => {});
}

export async function recordTrialDowngradedToFree(masterId: string): Promise<void> {
  await recordBillingEvent({
    masterId,
    eventType: 'trial_downgraded_to_free',
    planCode: 'free',
    status: 'succeeded',
    source: 'billing_worker',
  }).catch(() => {});
}

export async function recordTrialExpired(masterId: string): Promise<void> {
  await recordBillingEvent({
    masterId,
    eventType: 'trial_expired',
    planCode: 'pro',
    status: 'succeeded',
    source: 'billing_worker',
  }).catch(() => {});
}

export function assertProFeature(
  entitled: boolean,
  message = 'Эта функция доступна на Pro',
  code: 'PRO_REQUIRED' | 'TRIAL_EXPIRED' = 'PRO_REQUIRED',
): void {
  if (!entitled) {
    throw ApiError.forbidden(message, code);
  }
}
