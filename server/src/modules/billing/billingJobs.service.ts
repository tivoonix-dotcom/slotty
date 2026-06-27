import { randomUUID } from 'crypto';
import { query, withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { chargeBePaidWithCardToken, isBePaidRecurringConfigured } from './bepaidRecurring.client.js';
import { expireDueSubscriptions } from './subscriptionBilling.service.js';
import { processBePaidWebhook } from '../payments/payments.service.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { subscriptionRenewalReminderNotification } from '../notifications/templates/billingNotificationTemplates.js';
import { recordBillingEvent } from './billingEvents.service.js';
import { INSERT_PENDING_BILLING_PAYMENT_SQL } from './billingPendingPaymentSql.js';
import {
  type BillingPackageMonths,
  packageMonthsToBillingPeriod,
  resolvePackageAmount,
} from './billingPackage.js';

export type BillingWorkerTickReport = {
  scheduledRenewals: number;
  renewalChargesAttempted: number;
  renewalChargesSucceeded: number;
  renewalChargesFailed: number;
  remindersSent: number;
  expiredSubscriptions: number;
  jobsSkipped: number;
  errors: string[];
  durationMs: number;
};

type DueSubscription = {
  id: string;
  master_id: string;
  billing_period: string;
  current_period_end: Date;
  next_charge_at: Date;
  price_amount: string | null;
  currency: string;
  provider_card_token: string | null;
  cancel_at_period_end: boolean;
  status: string;
};

/** Планирует job на списание, если ещё нет pending/processing с тем же idempotency. */
export async function ensureRenewalChargeJob(subscriptionId: string, chargeAt: Date): Promise<void> {
  const sub = await query<{ master_id: string }>(
    `select master_id from public.master_subscriptions where id = $1`,
    [subscriptionId],
  );
  const masterId = sub.rows[0]?.master_id;
  if (!masterId) return;

  const dayKey = chargeAt.toISOString().slice(0, 10);
  const idempotencyKey = `renewal_charge:${subscriptionId}:${dayKey}`;

  await query(
    `insert into public.subscription_billing_jobs (
       subscription_id, master_id, job_type, scheduled_at, idempotency_key
     ) values ($1, $2, 'renewal_charge', $3, $4)
     on conflict (idempotency_key) do nothing`,
    [subscriptionId, masterId, chargeAt, idempotencyKey],
  );
}

/** Напоминания за N дней до списания; не дублируются (renewal_reminder_sent_for). */
export async function sendRenewalRemindersForWorker(daysBefore: number): Promise<number> {
  const r = await query<{ id: string; master_id: string; next_charge_at: Date; price_amount: string }>(
    `select ms.id, ms.master_id, ms.next_charge_at, coalesce(ms.price_amount, sp.price_month)::text as price_amount
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where sp.code = 'pro'
        and ms.status = 'active'::public.subscription_status
        and ms.cancel_at_period_end = false
        and ms.auto_renew_enabled = true
        and ms.next_charge_at is not null
        and ms.next_charge_at > now()
        and ms.next_charge_at <= now() + ($1::int || ' days')::interval
        and (ms.renewal_reminder_sent_for is null
             or ms.renewal_reminder_sent_for < ms.next_charge_at::date)`,
    [daysBefore],
  );

  let sent = 0;
  for (const row of r.rows) {
    const chargeDate = new Date(row.next_charge_at);
    const idempotencyKey = `reminder:${row.id}:${chargeDate.toISOString().slice(0, 10)}`;
    const inserted = await query<{ id: string }>(
      `insert into public.subscription_billing_jobs (
         subscription_id, master_id, job_type, scheduled_at, status, idempotency_key
       ) values ($1, $2, 'renewal_reminder', now(), 'succeeded', $3)
       on conflict (idempotency_key) do nothing
       returning id`,
      [row.id, row.master_id, idempotencyKey],
    );
    if (!inserted.rows[0]) continue;

    const n = subscriptionRenewalReminderNotification(chargeDate, Number(row.price_amount));
    await notifyUser({
      userId: row.master_id,
      type: n.type,
      title: n.title,
      body: n.body,
      telegramHtml: n.telegramHtml,
      masterPreferenceEvent: 'billing',
    }).catch(() => {});

    await recordBillingEvent({
      masterId: row.master_id,
      eventType: 'renewal_reminder_sent',
      planCode: 'pro',
      status: 'succeeded',
      source: 'billing_worker',
      metadata: { nextChargeAt: chargeDate.toISOString() },
    }).catch(() => {});

    await query(
      `update public.master_subscriptions
          set renewal_reminder_sent_for = $2::date, updated_at = now()
        where id = $1`,
      [row.id, chargeDate.toISOString().slice(0, 10)],
    );
    sent += 1;
  }
  return sent;
}

export async function enqueueDueRenewalJobs(): Promise<number> {
  const r = await query<{ id: string; next_charge_at: Date }>(
    `select ms.id, ms.next_charge_at
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where sp.code = 'pro'
        and ms.status = 'active'::public.subscription_status
        and ms.cancel_at_period_end = false
        and ms.auto_renew_enabled = true
        and ms.next_charge_at is not null
        and ms.next_charge_at <= now() + interval '1 hour'`,
  );
  let n = 0;
  for (const row of r.rows) {
    await ensureRenewalChargeJob(row.id, row.next_charge_at);
    n += 1;
  }
  return n;
}

async function claimDueJobs(limit: number): Promise<
  Array<{
    id: string;
    subscription_id: string;
    master_id: string;
    job_type: string;
    idempotency_key: string;
    attempts: number;
  }>
> {
  return withTransaction(async (client) => {
    const claimed = await client.query<{
      id: string;
      subscription_id: string;
      master_id: string;
      job_type: string;
      idempotency_key: string;
      attempts: number;
    }>(
      `select id, subscription_id, master_id, job_type::text, idempotency_key, attempts
         from public.subscription_billing_jobs
        where status = 'pending'
          and scheduled_at <= now()
        order by scheduled_at asc
        limit $1
        for update skip locked`,
      [limit],
    );
    for (const row of claimed.rows) {
      await client.query(
        `update public.subscription_billing_jobs
            set status = 'processing', attempts = attempts + 1, updated_at = now()
          where id = $1`,
        [row.id],
      );
    }
    return claimed.rows;
  });
}

async function finishJob(
  jobId: string,
  status: 'succeeded' | 'failed' | 'skipped',
  patch: { lastError?: string; paymentId?: string; providerPaymentId?: string },
): Promise<void> {
  await query(
    `update public.subscription_billing_jobs
        set status = $2::public.subscription_billing_job_status,
            last_error = $3,
            payment_id = coalesce($4, payment_id),
            provider_payment_id = coalesce($5, provider_payment_id),
            updated_at = now()
      where id = $1`,
    [jobId, status, patch.lastError ?? null, patch.paymentId ?? null, patch.providerPaymentId ?? null],
  );
}

async function processRenewalChargeJob(jobId: string, subscriptionId: string, masterId: string): Promise<'ok' | 'fail' | 'skip'> {
  const subR = await query<DueSubscription>(
    `select ms.id, ms.master_id, ms.billing_period::text, ms.current_period_end, ms.next_charge_at,
            ms.price_amount::text, ms.currency, ms.provider_card_token, ms.cancel_at_period_end, ms.status::text
       from public.master_subscriptions ms
      where ms.id = $1
      for update`,
    [subscriptionId],
  );
  const sub = subR.rows[0];
  if (!sub) {
    await finishJob(jobId, 'skipped', { lastError: 'subscription_not_found' });
    return 'skip';
  }

  if (sub.cancel_at_period_end || sub.status !== 'active') {
    await finishJob(jobId, 'skipped', { lastError: 'cancelled_or_inactive' });
    return 'skip';
  }

  if (!sub.next_charge_at || new Date(sub.next_charge_at).getTime() > Date.now()) {
    await finishJob(jobId, 'skipped', { lastError: 'not_due_yet' });
    return 'skip';
  }

  if (!isBePaidRecurringConfigured()) {
    await finishJob(jobId, 'skipped', { lastError: 'recurring_disabled' });
    return 'skip';
  }

  if (!sub.provider_card_token?.trim()) {
    await finishJob(jobId, 'failed', { lastError: 'missing_card_token' });
    await query(
      `update public.master_subscriptions
          set status = 'past_due'::public.subscription_status, updated_at = now()
        where id = $1`,
      [subscriptionId],
    );
    return 'fail';
  }

  const plan = await query<{ price_month: string; price_year: string }>(
    `select price_month::text, price_year::text from public.subscription_plans where code = 'pro' limit 1`,
  );
  const planPrices = {
    priceMonth: Number(plan.rows[0]?.price_month ?? 29),
    priceYear: Number(plan.rows[0]?.price_year ?? 290),
  };

  const lastPkgRow = await query<{ billing_package_months: number | null }>(
    `select p.billing_package_months
       from public.payments p
      where p.master_id = $1
        and p.status = 'success'::public.payment_status
        and p.payment_type = 'master_pro_plan'
        and p.billing_package_months in (1, 3, 12)
      order by coalesce(p.paid_at, p.updated_at, p.created_at) desc
      limit 1`,
    [masterId],
  );
  const lastPkg = lastPkgRow.rows[0]?.billing_package_months;
  const packageMonths: BillingPackageMonths =
    lastPkg === 3 || lastPkg === 12 || lastPkg === 1
      ? lastPkg
      : sub.billing_period === 'year'
        ? 12
        : 1;

  const pkg = resolvePackageAmount(packageMonths, planPrices);
  const price = sub.price_amount != null ? Number(sub.price_amount) : pkg.amount;
  const amountMinor = Math.round(price * 100);
  const billingPeriod = packageMonthsToBillingPeriod(packageMonths);

  const paymentId = randomUUID();
  const trackingId = paymentId;

  const idempotencyKey = `renewal_charge:${subscriptionId}:${new Date(sub.next_charge_at).toISOString().slice(0, 10)}`;

  await query(
    `insert into public.payments (
       id, profile_id, provider, payment_type, status, amount_minor, currency,
       master_id, billing_period, tracking_id, checkout_purpose, billing_package_months, checkout_idempotency_key
     ) values ($1, $2, 'bepaid', 'master_pro_plan', 'pending', $3, $4, $5, $6::public.billing_period, $7,
               'renewal_charge', $8, $9)`,
    [
      paymentId,
      masterId,
      amountMinor,
      sub.currency,
      masterId,
      billingPeriod,
      trackingId,
      packageMonths,
      idempotencyKey,
    ],
  );

  const bpKey = idempotencyKey;
  await query(INSERT_PENDING_BILLING_PAYMENT_SQL, [
    subscriptionId,
    masterId,
    masterId,
    paymentId,
    paymentId,
    price,
    sub.currency,
    'recurring_payment',
    bpKey,
  ]);

  try {
    const charge = await chargeBePaidWithCardToken({
      trackingId,
      amountMinor,
      currency: sub.currency,
      description: `SLOTTY Master Pro (${packageMonths === 12 ? 'год' : packageMonths === 3 ? '3 месяца' : 'месяц'})`,
      cardToken: sub.provider_card_token,
    });

    const webhookBody = {
      transaction: {
        uid: charge.uid,
        status: charge.status === 'successful' ? 'successful' : 'failed',
        tracking_id: trackingId,
        message: charge.message,
        payment_method_type: 'credit_card',
        credit_card: { brand: charge.brand, last_4: charge.last4, token: sub.provider_card_token },
        paid_at: charge.status === 'successful' ? new Date().toISOString() : undefined,
      },
    };

    await processBePaidWebhook(webhookBody);

    if (charge.status === 'successful') {
      await finishJob(jobId, 'succeeded', { paymentId, providerPaymentId: charge.uid });
      return 'ok';
    }

    await finishJob(jobId, 'failed', {
      paymentId,
      providerPaymentId: charge.uid,
      lastError: charge.message ?? 'charge_failed',
    });
    return 'fail';
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'charge_exception';
    await finishJob(jobId, 'failed', { paymentId, lastError: msg });
    const failWebhook = {
      transaction: {
        uid: `fail-${paymentId}`,
        status: 'failed',
        tracking_id: trackingId,
        message: msg,
      },
    };
    await processBePaidWebhook(failWebhook).catch(() => {});
    return 'fail';
  }
}

export async function processBillingJobsBatch(limit = 20): Promise<BillingWorkerTickReport> {
  const started = Date.now();
  const report: BillingWorkerTickReport = {
    scheduledRenewals: 0,
    renewalChargesAttempted: 0,
    renewalChargesSucceeded: 0,
    renewalChargesFailed: 0,
    remindersSent: 0,
    expiredSubscriptions: 0,
    jobsSkipped: 0,
    errors: [],
    durationMs: 0,
  };

  try {
    report.scheduledRenewals = await enqueueDueRenewalJobs();
    report.remindersSent = await sendRenewalRemindersForWorker(env.BILLING_RENEWAL_REMINDER_DAYS);
    await expireDueSubscriptions();
    report.expiredSubscriptions = 1;

    const jobs = await claimDueJobs(limit);
    for (const job of jobs) {
      try {
        if (job.job_type === 'renewal_charge') {
          report.renewalChargesAttempted += 1;
          const r = await processRenewalChargeJob(job.id, job.subscription_id, job.master_id);
          if (r === 'ok') report.renewalChargesSucceeded += 1;
          else if (r === 'fail') report.renewalChargesFailed += 1;
          else report.jobsSkipped += 1;
        } else {
          await finishJob(job.id, 'skipped', { lastError: 'unknown_job_type' });
          report.jobsSkipped += 1;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        report.errors.push(msg);
        await finishJob(job.id, 'failed', { lastError: msg });
      }
    }
  } catch (e) {
    report.errors.push(e instanceof Error ? e.message : String(e));
  }

  report.durationMs = Date.now() - started;
  return report;
}

export async function getBillingJobsDiagnostics(): Promise<{
  recurringEnabled: boolean;
  pendingJobs: number;
  processingJobs: number;
  failedJobs24h: number;
  dueRenewals: number;
  pastDueCount: number;
  expiringSoon: number;
  lastErrors: Array<{ id: string; jobType: string; lastError: string; updatedAt: string }>;
}> {
  const pending = await query<{ c: string }>(
    `select count(*)::text as c from public.subscription_billing_jobs where status = 'pending'`,
  );
  const processing = await query<{ c: string }>(
    `select count(*)::text as c from public.subscription_billing_jobs where status = 'processing'`,
  );
  const failed = await query<{ c: string }>(
    `select count(*)::text as c from public.subscription_billing_jobs
      where status = 'failed' and updated_at > now() - interval '24 hours'`,
  );
  const dueRenewals = await query<{ c: string }>(
    `select count(*)::text as c
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where sp.code = 'pro'
        and ms.status = 'active'
        and not ms.cancel_at_period_end
        and ms.next_charge_at <= now()`,
  );
  const pastDue = await query<{ c: string }>(
    `select count(*)::text as c from public.master_subscriptions
      where status in ('past_due', 'payment_failed')`,
  );
  const expiring = await query<{ c: string }>(
    `select count(*)::text as c
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where sp.code = 'pro'
        and ms.cancel_at_period_end = true
        and ms.current_period_end > now()
        and ms.current_period_end <= now() + interval '7 days'`,
  );
  const errors = await query<{
    id: string;
    job_type: string;
    last_error: string;
    updated_at: Date;
  }>(
    `select id, job_type::text, last_error, updated_at
       from public.subscription_billing_jobs
      where status = 'failed' and last_error is not null
      order by updated_at desc
      limit 10`,
  );

  return {
    recurringEnabled: isBePaidRecurringConfigured(),
    pendingJobs: Number(pending.rows[0]?.c ?? 0),
    processingJobs: Number(processing.rows[0]?.c ?? 0),
    failedJobs24h: Number(failed.rows[0]?.c ?? 0),
    dueRenewals: Number(dueRenewals.rows[0]?.c ?? 0),
    pastDueCount: Number(pastDue.rows[0]?.c ?? 0),
    expiringSoon: Number(expiring.rows[0]?.c ?? 0),
    lastErrors: errors.rows.map((r) => ({
      id: r.id,
      jobType: r.job_type,
      lastError: r.last_error,
      updatedAt: new Date(r.updated_at).toISOString(),
    })),
  };
}

export async function listBillingJobsForSubscription(
  subscriptionId: string,
  limit = 30,
): Promise<
  Array<{
    id: string;
    jobType: string;
    status: string;
    scheduledAt: string;
    attempts: number;
    lastError: string | null;
    paymentId: string | null;
    createdAt: string;
  }>
> {
  const r = await query<{
    id: string;
    job_type: string;
    status: string;
    scheduled_at: Date;
    attempts: number;
    last_error: string | null;
    payment_id: string | null;
    created_at: Date;
  }>(
    `select id, job_type::text, status::text, scheduled_at, attempts, last_error, payment_id, created_at
       from public.subscription_billing_jobs
      where subscription_id = $1
      order by created_at desc
      limit $2`,
    [subscriptionId, limit],
  );
  return r.rows.map((row) => ({
    id: row.id,
    jobType: row.job_type,
    status: row.status,
    scheduledAt: new Date(row.scheduled_at).toISOString(),
    attempts: row.attempts,
    lastError: row.last_error,
    paymentId: row.payment_id,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}
