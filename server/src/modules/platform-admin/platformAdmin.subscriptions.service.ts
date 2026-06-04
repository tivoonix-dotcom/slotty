import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { listBillingJobsForSubscription } from '../billing/billingJobs.service.js';
import { getBillingJobsDiagnostics } from '../billing/billingJobs.service.js';
import { getBillingWorkerStatus } from '../billing/billingWorker.js';
import {
  cancelSubscriptionAtPeriodEnd,
  listBillingPayments,
  retryFailedSubscriptionPayment,
} from '../billing/subscriptionBilling.service.js';
import { expireDueSubscriptions } from '../billing/subscriptionBilling.service.js';
import { listBillingEventsForMaster, recordBillingEvent } from '../billing/billingEvents.service.js';
import { isBePaidRecurringConfigured } from '../billing/bepaidRecurring.client.js';
import { writeAdminAuditLog } from './auditLog.service.js';

export async function getBillingAdminDiagnostics() {
  const jobs = await getBillingJobsDiagnostics();
  const worker = getBillingWorkerStatus();
  return {
    recurringEnabled: isBePaidRecurringConfigured(),
    worker,
    jobs,
  };
}

export async function listSubscriptionsForAdmin(filters: {
  status?: string;
  planCode?: string;
  cancelAtPeriodEnd?: boolean;
  pastDue?: boolean;
  nextChargeSoon?: boolean;
  hasFailedPayments?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{
  subscriptions: Array<{
    subscriptionId: string;
    masterId: string;
    masterName: string | null;
    userEmail: string | null;
    planCode: string;
    status: string;
    billingPeriod: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextChargeAt: string | null;
    cancelAtPeriodEnd: boolean;
    cardBrand: string | null;
    cardLast4: string | null;
    hasCardToken: boolean;
    lastPaymentAt: string | null;
    failedPaymentsCount: number;
  }>;
  total: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;
  const clauses: string[] = ['1=1'];
  const params: unknown[] = [];
  let i = 1;

  if (filters.status) {
    clauses.push(`ms.status::text = $${i++}`);
    params.push(filters.status);
  }
  if (filters.planCode) {
    clauses.push(`sp.code = $${i++}`);
    params.push(filters.planCode);
  }
  if (filters.cancelAtPeriodEnd === true) {
    clauses.push(`ms.cancel_at_period_end = true`);
  }
  if (filters.pastDue === true) {
    clauses.push(`ms.status::text in ('past_due', 'payment_failed')`);
  }
  if (filters.nextChargeSoon === true) {
    clauses.push(`ms.next_charge_at is not null and ms.next_charge_at <= now() + interval '7 days'`);
  }
  if (filters.hasFailedPayments === true) {
    clauses.push(`exists (
      select 1 from public.billing_payments bp
       where bp.master_id = ms.master_id and bp.status = 'failed'
    )`);
  }

  const where = clauses.join(' and ');
  const countR = await query<{ total: string }>(
    `select count(*)::text as total
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where ${where}`,
    params,
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const listR = await query<{
    id: string;
    master_id: string;
    full_name: string | null;
    user_email: string | null;
    code: string;
    status: string;
    billing_period: string;
    current_period_start: Date;
    current_period_end: Date;
    next_charge_at: Date | null;
    cancel_at_period_end: boolean;
    card_brand: string | null;
    card_last4: string | null;
    has_token: boolean;
    last_paid: Date | null;
    failed_cnt: number;
  }>(
    `select ms.id,
            ms.master_id,
            pr.full_name,
            (select ai.email from public.auth_identities ai
              where ai.profile_id = pr.id and ai.email is not null limit 1) as user_email,
            sp.code,
            ms.status::text,
            ms.billing_period::text,
            ms.current_period_start,
            ms.current_period_end,
            ms.next_charge_at,
            ms.cancel_at_period_end,
            ms.card_brand,
            ms.card_last4,
            (ms.provider_card_token is not null and length(ms.provider_card_token) > 0) as has_token,
            (select max(bp.paid_at) from public.billing_payments bp where bp.master_id = ms.master_id) as last_paid,
            (select count(*)::int from public.billing_payments bp
              where bp.master_id = ms.master_id and bp.status = 'failed') as failed_cnt
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
       left join public.profiles pr on pr.id = ms.master_id
      where ${where}
      order by ms.updated_at desc
      limit $${i++} offset $${i++}`,
    [...params, pageSize, offset],
  );

  return {
    total,
    subscriptions: listR.rows.map((row) => ({
      subscriptionId: row.id,
      masterId: row.master_id,
      masterName: row.full_name,
      userEmail: row.user_email,
      planCode: row.code,
      status: row.status,
      billingPeriod: row.billing_period,
      currentPeriodStart: new Date(row.current_period_start).toISOString(),
      currentPeriodEnd: new Date(row.current_period_end).toISOString(),
      nextChargeAt: row.next_charge_at ? new Date(row.next_charge_at).toISOString() : null,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      cardBrand: row.card_brand,
      cardLast4: row.card_last4,
      hasCardToken: row.has_token,
      lastPaymentAt: row.last_paid ? new Date(row.last_paid).toISOString() : null,
      failedPaymentsCount: row.failed_cnt,
    })),
  };
}

export async function getSubscriptionDetailForAdmin(masterId: string) {
  const sub = await query<{
    id: string;
    master_id: string;
    status: string;
    billing_period: string;
    current_period_start: Date;
    current_period_end: Date;
    next_charge_at: Date | null;
    cancel_at_period_end: boolean;
    card_brand: string | null;
    card_last4: string | null;
    provider_customer_id: string | null;
    provider_subscription_id: string | null;
    provider_payment_method_id: string | null;
    has_token: boolean;
    code: string;
    full_name: string | null;
  }>(
    `select ms.id, ms.master_id, ms.status::text, ms.billing_period::text,
            ms.current_period_start, ms.current_period_end, ms.next_charge_at,
            ms.cancel_at_period_end, ms.card_brand, ms.card_last4,
            ms.provider_customer_id, ms.provider_subscription_id, ms.provider_payment_method_id,
            sp.code, pr.full_name,
            (ms.provider_card_token is not null and length(ms.provider_card_token) > 0) as has_token
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
       left join public.profiles pr on pr.id = ms.master_id
      where ms.master_id = $1`,
    [masterId],
  );
  const row = sub.rows[0];
  if (!row) throw ApiError.notFound('Подписка не найдена');

  const payments = await listBillingPayments(masterId, { limit: 30 });
  const jobs = await listBillingJobsForSubscription(row.id, 30);
  const billingEvents = await listBillingEventsForMaster(masterId, 30);

  return {
    subscription: {
      subscriptionId: row.id,
      masterId: row.master_id,
      masterName: row.full_name,
      planCode: row.code,
      status: row.status,
      billingPeriod: row.billing_period,
      currentPeriodStart: new Date(row.current_period_start).toISOString(),
      currentPeriodEnd: new Date(row.current_period_end).toISOString(),
      nextChargeAt: row.next_charge_at ? new Date(row.next_charge_at).toISOString() : null,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      cardBrand: row.card_brand,
      cardLast4: row.card_last4,
      providerCustomerId: row.provider_customer_id,
      providerSubscriptionId: row.provider_subscription_id,
      providerPaymentMethodId: row.provider_payment_method_id,
      hasCardToken: row.has_token,
    },
    payments,
    jobs,
    billingEvents,
  };
}

export async function adminCancelSubscription(
  masterId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  await cancelSubscriptionAtPeriodEnd(masterId, `[admin] ${reason}`);
  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'billing.subscription_cancel',
    entityType: 'master_subscription',
    entityId: masterId,
    targetUserId: masterId,
    reason,
  });
}

export async function adminMarkSubscriptionExpired(
  masterId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  await query(
    `update public.master_subscriptions
        set current_period_end = now() - interval '1 minute',
            next_charge_at = null,
            updated_at = now()
      where master_id = $1`,
    [masterId],
  );
  await expireDueSubscriptions(masterId);
  await recordBillingEvent({
    masterId,
    eventType: 'subscription_expired_admin',
    planCode: 'pro',
    status: 'succeeded',
    source: 'platform_admin',
    metadata: { reason, adminId },
  });
  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'billing.subscription_expire',
    entityType: 'master_subscription',
    entityId: masterId,
    targetUserId: masterId,
    reason,
  });
}

export async function adminRetrySubscriptionPayment(
  masterId: string,
  adminId: string,
): Promise<{ paymentUrl: string; paymentId: string }> {
  const result = await retryFailedSubscriptionPayment({
    masterId,
    profileId: masterId,
  });
  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'billing.retry_payment',
    entityType: 'master_subscription',
    entityId: masterId,
    targetUserId: masterId,
    reason: 'admin_retry',
  });
  return result;
}
