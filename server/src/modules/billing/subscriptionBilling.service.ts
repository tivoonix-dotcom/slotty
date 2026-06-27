import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordBillingEvent } from './billingEvents.service.js';
import {
  ensureMasterSubscription,
  getMasterSubscriptionWithUsage,
  type MasterSubscriptionWithUsageDto,
} from './billing.service.js';
import {
  availableBillingActions,
  deriveSubscriptionUiState,
  type BillingAction,
  type SubscriptionUiState,
} from './subscriptionBilling.state.js';
import { notifyUser } from '../notifications/notifyUser.js';
import {
  subscriptionActivatedNotification,
  subscriptionAutoRenewCanceledNotification,
  subscriptionAutoRenewResumedNotification,
  subscriptionPaymentFailedNotification,
  subscriptionRenewedNotification,
  subscriptionRenewalReminderNotification,
} from '../notifications/templates/billingNotificationTemplates.js';
import type { PaymentDto } from '../payments/payment.types.js';
import type { BillingCheckoutPurpose } from './billingCheckoutPurpose.js';
import {
  purposeExtendsProPeriod,
  purposeMarksPastDueOnFail,
  purposeToPaymentKind,
} from './billingCheckoutPurpose.js';
import {
  type BillingPackageMonths,
  computePeriodBounds,
  inferSubscriptionPackageMonths,
  packageMonthsToBillingPeriod,
  resolvePackageAmount,
} from './billingPackage.js';
import { createBePaidPayment } from '../payments/payments.service.js';
import { getCardUpdateAmountMinor } from '../payments/bepaid.config.js';
import { isBePaidRecurringConfigured } from './bepaidRecurring.client.js';
import { ensureSubscriptionStatusEnum } from '../../lib/ensureSubscriptionStatusEnum.js';
import { INSERT_PENDING_BILLING_PAYMENT_SQL } from './billingPendingPaymentSql.js';

export type BillingSubscriptionDto = {
  subscription: MasterSubscriptionWithUsageDto;
  uiState: SubscriptionUiState;
  isProEntitled: boolean;
  planCode: string;
  status: string;
  billingPeriod: 'month' | 'year';
  priceAmount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextChargeAt: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  availableActions: BillingAction[];
  limits: {
    maxServices: number | null;
    maxMonthlyAppointments: number | null;
    maxScheduleDaysAhead: number;
  };
  lastPayment: BillingPaymentListItem | null;
  nextPaymentHint: string | null;
  autoRenewCapable: boolean;
  autoRenewLegalAllowed: boolean;
  autoRenewEnabled: boolean;
  billingPackageMonths: BillingPackageMonths;
};

export type BillingPaymentListItem = {
  id: string;
  paymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentKind: string;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  receiptUrl: string | null;
  invoiceNumber: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  createdAt: string;
};

type SubscriptionDbRow = {
  id: string;
  master_id: string;
  status: string;
  billing_period: string;
  current_period_start: Date;
  current_period_end: Date;
  next_charge_at: Date | null;
  cancel_at_period_end: boolean;
  cancelled_at: Date | null;
  price_amount: string | null;
  currency: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  code: string;
  pro_expires_at: Date | null;
  provider_card_token: string | null;
  auto_renew_enabled: boolean;
};

async function loadSubscriptionRow(masterId: string): Promise<SubscriptionDbRow> {
  await ensureMasterSubscription(masterId);
  const r = await query<SubscriptionDbRow>(
    `select ms.id,
            ms.master_id,
            ms.status::text as status,
            ms.billing_period::text as billing_period,
            ms.current_period_start,
            ms.current_period_end,
            ms.next_charge_at,
            ms.cancel_at_period_end,
            ms.cancelled_at,
            ms.price_amount::text,
            ms.currency,
            ms.card_brand,
            ms.card_last4,
            ms.card_exp_month,
            ms.card_exp_year,
            sp.code,
            mp.pro_expires_at,
            ms.provider_card_token,
            ms.auto_renew_enabled
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

async function insertPendingBillingPayment(input: {
  subscriptionId: string;
  masterId: string;
  profileId: string;
  paymentId: string;
  amount: number;
  currency: string;
  purpose: BillingCheckoutPurpose;
  idempotencyKey: string;
}): Promise<void> {
  const kind = purposeToPaymentKind(input.purpose);
  await query(INSERT_PENDING_BILLING_PAYMENT_SQL, [
    input.subscriptionId,
    input.masterId,
    input.profileId,
    input.paymentId,
    input.paymentId,
    input.amount,
    input.currency,
    kind,
    input.idempotencyKey,
  ]);
}

async function createProCheckout(input: {
  masterId: string;
  profileId: string;
  packageMonths: BillingPackageMonths;
  purpose: BillingCheckoutPurpose;
  returnUrl?: string;
  consentAccepted?: boolean;
}): Promise<{ paymentUrl: string; paymentId: string }> {
  const billing = await getBillingSubscription(input.masterId);
  const pkg = resolvePackageAmount(input.packageMonths, {
    priceMonth: billing.subscription.plan.priceMonth,
    priceYear: billing.subscription.plan.priceYear,
  });

  const result = await createBePaidPayment({
    profileId: input.profileId,
    masterId: input.masterId,
    type: 'master_pro_plan',
    billingPackageMonths: input.packageMonths,
    billingPeriod: packageMonthsToBillingPeriod(input.packageMonths),
    returnUrl: input.returnUrl,
    checkoutPurpose: input.purpose,
  });

  const subRow = await loadSubscriptionRow(input.masterId);
  await insertPendingBillingPayment({
    subscriptionId: subRow.id,
    masterId: input.masterId,
    profileId: input.profileId,
    paymentId: result.paymentId,
    amount: pkg.amount,
    currency: billing.currency,
    purpose: input.purpose,
    idempotencyKey: `billing_payment:${result.paymentId}`,
  });

  const url = result.checkout?.redirectUrl?.trim();
  if (!url) throw ApiError.internal('Не получена ссылка на оплату');
  return { paymentUrl: url, paymentId: result.paymentId };
}

export async function expireDueSubscriptions(masterId?: string): Promise<void> {
  await ensureSubscriptionStatusEnum();

  const masterFilter = masterId ? 'and ms.master_id = $1' : '';
  const expireParams = masterId ? [masterId] : [];

  const { recordTrialExpired, recordTrialDowngradedToFree } = await import('./trial.service.js');

  const expiredTrials = await query<{ master_id: string }>(
    `update public.master_subscriptions ms
        set status = 'expired'::public.subscription_status,
            next_charge_at = null,
            updated_at = now()
      from public.subscription_plans sp
      where sp.id = ms.plan_id
        and sp.code = 'pro'
        and ms.status::text = 'trialing'
        and ms.trial_ends_at is not null
        and ms.trial_ends_at < now()
        ${masterFilter}
      returning ms.master_id`,
    expireParams,
  );

  await query(
    `update public.master_subscriptions ms
        set status = 'expired'::public.subscription_status,
            next_charge_at = null,
            updated_at = now()
      from public.subscription_plans sp
      where sp.id = ms.plan_id
        and sp.code = 'pro'
        and ms.current_period_end < now()
        and ms.status::text in (
          'active',
          'canceled_at_period_end',
          'past_due',
          'payment_failed',
          'cancelled'
        )
        ${masterFilter}`,
    expireParams,
  );

  const freePlan = await query<{ id: string }>(
    `select id from public.subscription_plans where code = 'free' and is_active = true limit 1`,
  );
  const freeId = freePlan.rows[0]?.id;
  if (!freeId) return;

  const downgradeParams = masterId ? [freeId, masterId] : [freeId];
  const downgradeFilter = masterId ? 'and ms.master_id = $2' : '';

  await query(
    `update public.master_subscriptions ms
        set plan_id = $1,
            status = 'active'::public.subscription_status,
            cancel_at_period_end = false,
            cancelled_at = null,
            next_charge_at = null,
            card_brand = null,
            card_last4 = null,
            card_exp_month = null,
            card_exp_year = null,
            updated_at = now()
      from public.subscription_plans sp
      where sp.id = ms.plan_id
        and sp.code = 'pro'
        and ms.status::text = 'expired'
        and ms.current_period_end < now()
        ${downgradeFilter}`,
    downgradeParams,
  );

  for (const row of expiredTrials.rows) {
    await recordTrialExpired(row.master_id).catch(() => {});
  }

  if (masterId && expiredTrials.rows.length > 0) {
    await query(
      `update public.master_profiles
          set master_plan = 'basic',
              pro_status = 'inactive',
              updated_at = now()
        where master_id = $1`,
      [masterId],
    );
    await recordTrialDowngradedToFree(masterId).catch(() => {});
  } else if (!masterId && expiredTrials.rows.length > 0) {
    const ids = expiredTrials.rows.map((r) => r.master_id);
    await query(
      `update public.master_profiles
          set master_plan = 'basic',
              pro_status = 'inactive',
              updated_at = now()
        where master_id = any($1::uuid[])`,
      [ids],
    );
    for (const id of ids) {
      await recordTrialDowngradedToFree(id).catch(() => {});
    }
  }

  if (masterId) {
    await query(
      `update public.master_profiles
          set master_plan = 'basic',
              pro_status = 'inactive',
              updated_at = now()
        where master_id = $1
          and pro_expires_at is not null
          and pro_expires_at < now()`,
      [masterId],
    );
  } else {
    await query(
      `update public.master_profiles mp
          set master_plan = 'basic',
              pro_status = 'inactive',
              updated_at = now()
        from public.master_subscriptions ms
        join public.subscription_plans sp on sp.id = ms.plan_id
       where mp.master_id = ms.master_id
         and sp.code = 'free'
         and mp.pro_expires_at is not null
         and mp.pro_expires_at < now()`,
    );
  }
}

async function getLastBillingPayment(masterId: string): Promise<BillingPaymentListItem | null> {
  const r = await query<{
    id: string;
    payment_id: string | null;
    amount: string;
    currency: string;
    status: string;
    payment_kind: string;
    paid_at: Date | null;
    failed_at: Date | null;
    failure_reason: string | null;
    receipt_url: string | null;
    invoice_number: string | null;
    created_at: Date;
    card_brand: string | null;
    card_last4: string | null;
  }>(
    `select bp.id, bp.payment_id, bp.amount::text, bp.currency, bp.status::text,
            bp.payment_kind::text, bp.paid_at, bp.failed_at, bp.failure_reason,
            bp.receipt_url, bp.invoice_number, bp.created_at,
            ms.card_brand, ms.card_last4
       from public.billing_payments bp
       join public.master_subscriptions ms on ms.id = bp.subscription_id
      where bp.master_id = $1
      order by bp.created_at desc
      limit 1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) return null;
  return mapBillingPaymentRow(row);
}

function mapBillingPaymentRow(row: {
  id: string;
  payment_id: string | null;
  amount: string;
  currency: string;
  status: string;
  payment_kind: string;
  paid_at: Date | null;
  failed_at: Date | null;
  failure_reason: string | null;
  receipt_url: string | null;
  invoice_number: string | null;
  created_at: Date;
  card_brand?: string | null;
  card_last4?: string | null;
}): BillingPaymentListItem {
  return {
    id: row.id,
    paymentId: row.payment_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    paymentKind: row.payment_kind,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    failedAt: row.failed_at ? new Date(row.failed_at).toISOString() : null,
    failureReason: row.failure_reason,
    receiptUrl: row.receipt_url,
    invoiceNumber: row.invoice_number,
    cardBrand: row.card_brand ?? null,
    cardLast4: row.card_last4 ?? null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getBillingSubscription(masterId: string): Promise<BillingSubscriptionDto> {
  await expireDueSubscriptions(masterId);
  const { getMasterEntitlements } = await import('./entitlements.service.js');
  const ent = await getMasterEntitlements(masterId);
  const sub = await getMasterSubscriptionWithUsage(masterId);
  const row = await loadSubscriptionRow(masterId);

  const lite = {
    planCode: row.code,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    proExpiresAt: row.pro_expires_at,
    trialEndsAt: ent.trial.endsAt,
  };
  const uiState = deriveSubscriptionUiState(lite);
  const entitled = ent.isProEntitled;
  const lastPayment = await getLastBillingPayment(masterId);

  const priceAmount =
    row.price_amount != null
      ? Number(row.price_amount)
      : sub.billingPeriod === 'year'
        ? sub.plan.priceYear
        : sub.plan.priceMonth;

  let nextPaymentHint: string | null = null;
  if (uiState === 'pro_active' && row.next_charge_at) {
    nextPaymentHint = new Date(row.next_charge_at).toISOString();
  }

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
  const billingPackageMonths: BillingPackageMonths =
    lastPkg === 1 || lastPkg === 3 || lastPkg === 12
      ? lastPkg
      : inferSubscriptionPackageMonths({
          billingPeriod: sub.billingPeriod as 'month' | 'year',
          priceAmount,
          priceMonth: sub.plan.priceMonth,
          priceYear: sub.plan.priceYear,
        });

  return {
    subscription: sub,
    uiState,
    isProEntitled: entitled,
    planCode: sub.plan.code,
    status: row.status,
    billingPeriod: sub.billingPeriod as 'month' | 'year',
    priceAmount,
    currency: row.currency ?? 'BYN',
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    nextChargeAt: row.next_charge_at ? new Date(row.next_charge_at).toISOString() : null,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null,
    cardBrand: row.card_brand,
    cardLast4: row.card_last4,
    cardExpMonth: row.card_exp_month,
    cardExpYear: row.card_exp_year,
    availableActions: availableBillingActions(uiState),
    limits: {
      maxServices: ent.limits.maxServices,
      maxMonthlyAppointments: ent.limits.maxMonthlyAppointments,
      maxScheduleDaysAhead: ent.limits.scheduleHorizonDays,
    },
    lastPayment,
    nextPaymentHint,
    autoRenewCapable: isBePaidRecurringConfigured() && Boolean(row.provider_card_token?.trim()),
    autoRenewLegalAllowed: isBePaidRecurringConfigured(),
    autoRenewEnabled: Boolean(row.auto_renew_enabled),
    billingPackageMonths,
  };
}

export async function listBillingPayments(
  masterId: string,
  options?: { limit?: number },
): Promise<BillingPaymentListItem[]> {
  const limit = Math.min(50, Math.max(1, options?.limit ?? 25));
  const r = await query<{
    id: string;
    payment_id: string | null;
    amount: string;
    currency: string;
    status: string;
    payment_kind: string;
    paid_at: Date | null;
    failed_at: Date | null;
    failure_reason: string | null;
    receipt_url: string | null;
    invoice_number: string | null;
    created_at: Date;
    card_brand: string | null;
    card_last4: string | null;
  }>(
    `select bp.id, bp.payment_id, bp.amount::text, bp.currency, bp.status::text,
            bp.payment_kind::text, bp.paid_at, bp.failed_at, bp.failure_reason,
            bp.receipt_url, bp.invoice_number, bp.created_at,
            p.payment_method_brand as card_brand,
            ms.card_last4
       from public.billing_payments bp
       join public.master_subscriptions ms on ms.id = bp.subscription_id
       left join public.payments p on p.id = bp.payment_id
      where bp.master_id = $1
      order by bp.created_at desc
      limit $2`,
    [masterId, limit],
  );
  return r.rows.map((row) => mapBillingPaymentRow(row));
}

export async function createBillingCheckout(input: {
  masterId: string;
  profileId: string;
  billingPackageMonths: BillingPackageMonths;
  returnUrl?: string;
  consentAccepted: boolean;
}): Promise<{ paymentUrl: string; paymentId: string }> {
  if (!input.consentAccepted) {
    throw ApiError.badRequest(
      'Подтвердите согласие на автоматическое продление подписки',
      'CONSENT_REQUIRED',
    );
  }

  const billing = await getBillingSubscription(input.masterId);
  if (
    (billing.uiState === 'pro_active' || billing.uiState === 'pro_canceled_at_period_end') &&
    billing.status !== 'trialing'
  ) {
    throw ApiError.badRequest(
      'Тариф Pro уже активен. Используйте «Продлить» для добавления оплаченного периода.',
      'PRO_ALREADY_ACTIVE',
    );
  }

  await query(
    `update public.master_subscriptions
        set auto_renew_consent_at = now(),
            updated_at = now()
      where master_id = $1`,
    [input.masterId],
  );

  const result = await createProCheckout({
    masterId: input.masterId,
    profileId: input.profileId,
    packageMonths: input.billingPackageMonths,
    purpose: 'initial_purchase',
    returnUrl: input.returnUrl,
    consentAccepted: true,
  });

  await recordBillingEvent({
    masterId: input.masterId,
    eventType: 'checkout_started',
    planCode: 'pro',
    billingPeriod: packageMonthsToBillingPeriod(input.billingPackageMonths),
    amount: resolvePackageAmount(input.billingPackageMonths, {
      priceMonth: billing.subscription.plan.priceMonth,
      priceYear: billing.subscription.plan.priceYear,
    }).amount,
    status: 'pending',
    source: 'bepaid',
    metadata: { paymentId: result.paymentId, consentAccepted: true, packageMonths: input.billingPackageMonths },
  });

  return result;
}

export async function createManualTopupCheckout(input: {
  masterId: string;
  profileId: string;
  billingPackageMonths: BillingPackageMonths;
  returnUrl?: string;
}): Promise<{ paymentUrl: string; paymentId: string }> {
  const billing = await getBillingSubscription(input.masterId);
  if (
    billing.uiState !== 'pro_active' &&
    billing.uiState !== 'pro_canceled_at_period_end' &&
    billing.status !== 'trialing'
  ) {
    throw ApiError.badRequest(
      'Ручное продление доступно только при активной подписке Pro',
      'TOPUP_NOT_ALLOWED',
    );
  }

  const result = await createProCheckout({
    masterId: input.masterId,
    profileId: input.profileId,
    packageMonths: input.billingPackageMonths,
    purpose: 'manual_topup',
    returnUrl: input.returnUrl,
  });

  await recordBillingEvent({
    masterId: input.masterId,
    eventType: 'checkout_started',
    planCode: 'pro',
    billingPeriod: packageMonthsToBillingPeriod(input.billingPackageMonths),
    amount: resolvePackageAmount(input.billingPackageMonths, {
      priceMonth: billing.subscription.plan.priceMonth,
      priceYear: billing.subscription.plan.priceYear,
    }).amount,
    status: 'pending',
    source: 'bepaid',
    metadata: { paymentId: result.paymentId, purpose: 'manual_topup', packageMonths: input.billingPackageMonths },
  });

  return result;
}

export async function deletePaymentMethod(masterId: string): Promise<BillingSubscriptionDto> {
  const row = await loadSubscriptionRow(masterId);
  if (!row.provider_card_token && !row.card_last4) {
    throw ApiError.badRequest('Нет привязанной карты', 'NO_PAYMENT_METHOD');
  }

  await query(
    `update public.master_subscriptions
        set provider_card_token = null,
            card_brand = null,
            card_last4 = null,
            card_exp_month = null,
            card_exp_year = null,
            auto_renew_enabled = false,
            next_charge_at = null,
            updated_at = now()
      where master_id = $1`,
    [masterId],
  );

  await query(
    `update public.subscription_billing_jobs
        set status = 'skipped'::public.subscription_billing_job_status,
            last_error = 'payment_method_removed',
            updated_at = now()
      where subscription_id = $1
        and job_type = 'renewal_charge'
        and status = 'pending'`,
    [row.id],
  );

  await recordBillingEvent({
    masterId,
    eventType: 'payment_method_removed',
    planCode: row.code,
    status: 'succeeded',
    source: 'master',
    metadata: {},
  });

  return getBillingSubscription(masterId);
}

export async function cancelSubscriptionAtPeriodEnd(
  masterId: string,
  reason?: string,
): Promise<BillingSubscriptionDto> {
  await ensureSubscriptionStatusEnum();
  const row = await loadSubscriptionRow(masterId);
  if (row.code !== 'pro') {
    throw ApiError.badRequest('Нет активной подписки Pro', 'NO_PRO_SUBSCRIPTION');
  }

  const subId = row.id;
  await query(
    `update public.master_subscriptions
        set status = 'canceled_at_period_end'::public.subscription_status,
            cancel_at_period_end = true,
            cancelled_at = now(),
            cancellation_reason = $2,
            next_charge_at = null,
            auto_renew_enabled = false,
            updated_at = now()
      where master_id = $1`,
    [masterId, reason?.trim() || null],
  );

  await query(
    `update public.subscription_billing_jobs
        set status = 'skipped'::public.subscription_billing_job_status,
            last_error = 'cancel_at_period_end',
            updated_at = now()
      where subscription_id = $1
        and job_type = 'renewal_charge'
        and status = 'pending'`,
    [subId],
  );

  await recordBillingEvent({
    masterId,
    eventType: 'subscription_cancelled',
    planCode: 'pro',
    billingPeriod: row.billing_period as 'month' | 'year',
    status: 'succeeded',
    source: 'master',
    metadata: { cancelAtPeriodEnd: true, reason: reason ?? null },
  });

  const dto = await getBillingSubscription(masterId);
  const n = subscriptionAutoRenewCanceledNotification(dto.currentPeriodEnd);
  await notifyUser({
    userId: masterId,
    type: n.type,
    title: n.title,
    body: n.body,
    telegramHtml: n.telegramHtml,
    masterPreferenceEvent: 'billing',
  }).catch(() => {});

  return dto;
}

export async function resumeSubscriptionAutoRenew(masterId: string): Promise<BillingSubscriptionDto> {
  const row = await loadSubscriptionRow(masterId);
  if (row.code !== 'pro') {
    throw ApiError.badRequest('Нет подписки Pro', 'NO_PRO_SUBSCRIPTION');
  }
  if (!row.cancel_at_period_end && row.status !== 'canceled_at_period_end') {
    throw ApiError.badRequest('Автопродление уже включено', 'AUTO_RENEW_ALREADY_ON');
  }
  if (new Date(row.current_period_end).getTime() <= Date.now()) {
    throw ApiError.badRequest('Оплаченный период уже завершён', 'PERIOD_ENDED');
  }

  await query(
    `update public.master_subscriptions
        set status = 'active'::public.subscription_status,
            cancel_at_period_end = false,
            cancelled_at = null,
            cancellation_reason = null,
            next_charge_at = current_period_end,
            auto_renew_enabled = true,
            updated_at = now()
      where master_id = $1`,
    [masterId],
  );

  if (isBePaidRecurringConfigured() && row.provider_card_token) {
    const { ensureRenewalChargeJob } = await import('./billingJobs.service.js');
    await ensureRenewalChargeJob(row.id, row.current_period_end);
  }

  await recordBillingEvent({
    masterId,
    eventType: 'subscription_resumed',
    planCode: 'pro',
    billingPeriod: row.billing_period as 'month' | 'year',
    status: 'succeeded',
    source: 'master',
    metadata: {},
  });

  const dto = await getBillingSubscription(masterId);
  const n = subscriptionAutoRenewResumedNotification(dto.nextChargeAt ?? dto.currentPeriodEnd);
  await notifyUser({
    userId: masterId,
    type: n.type,
    title: n.title,
    body: n.body,
    telegramHtml: n.telegramHtml,
    masterPreferenceEvent: 'billing',
  }).catch(() => {});

  return dto;
}

export async function createUpdatePaymentMethodCheckout(input: {
  masterId: string;
  profileId: string;
  returnUrl?: string;
}): Promise<{ paymentUrl: string; paymentId: string }> {
  const billing = await getBillingSubscription(input.masterId);
  if (!billing.isProEntitled) {
    throw ApiError.badRequest('Сначала подключите Pro', 'PRO_REQUIRED');
  }

  const result = await createBePaidPayment({
    profileId: input.profileId,
    masterId: input.masterId,
    type: 'master_pro_plan',
    billingPeriod: billing.billingPeriod,
    returnUrl: input.returnUrl,
    checkoutPurpose: 'update_card',
  });

  const subRow = await loadSubscriptionRow(input.masterId);
  await insertPendingBillingPayment({
    subscriptionId: subRow.id,
    masterId: input.masterId,
    profileId: input.profileId,
    paymentId: result.paymentId,
    amount: getCardUpdateAmountMinor() / 100,
    currency: billing.currency,
    purpose: 'update_card',
    idempotencyKey: `billing_payment:${result.paymentId}`,
  });

  const url = result.checkout?.redirectUrl?.trim();
  if (!url) throw ApiError.internal('Не получена ссылка на оплату');
  return { paymentUrl: url, paymentId: result.paymentId };
}

export async function retryFailedSubscriptionPayment(input: {
  masterId: string;
  profileId: string;
  returnUrl?: string;
}): Promise<{ paymentUrl: string; paymentId: string }> {
  const billing = await getBillingSubscription(input.masterId);
  if (billing.uiState !== 'past_due') {
    throw ApiError.badRequest('Повтор оплаты недоступен в текущем статусе', 'RETRY_NOT_ALLOWED');
  }

  const packageMonths: BillingPackageMonths = billing.billingPackageMonths;

  return createProCheckout({
    masterId: input.masterId,
    profileId: input.profileId,
    packageMonths,
    purpose: 'retry_payment',
    returnUrl: input.returnUrl,
  });
}

function extractCardFromWebhook(body: Record<string, unknown>): {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  token: string | null;
} {
  const transaction =
    body.transaction && typeof body.transaction === 'object'
      ? (body.transaction as Record<string, unknown>)
      : null;
  const cc =
    transaction?.credit_card && typeof transaction.credit_card === 'object'
      ? (transaction.credit_card as Record<string, unknown>)
      : null;
  if (!cc) return { brand: null, last4: null, expMonth: null, expYear: null, token: null };
  const token = cc.token ? String(cc.token) : null;
  const last4 = cc.last_4 ? String(cc.last_4).slice(-4) : cc.last4 ? String(cc.last4).slice(-4) : null;
  const brand = cc.brand ? String(cc.brand) : null;
  const exp = cc.exp_date ? String(cc.exp_date) : null;
  let expMonth: number | null = null;
  let expYear: number | null = null;
  if (exp && exp.includes('/')) {
    const [m, y] = exp.split('/');
    expMonth = Number(m) || null;
    const yr = Number(y);
    expYear = yr < 100 ? 2000 + yr : yr;
  }
  return { brand, last4, expMonth, expYear, token };
}

export async function fulfillSubscriptionFromPayment(
  payment: PaymentDto,
  webhookBody?: Record<string, unknown>,
): Promise<void> {
  if (!payment.masterId) return;

  const purpose: BillingCheckoutPurpose =
    payment.checkoutPurpose ?? 'initial_purchase';
  const packageMonths: BillingPackageMonths =
    payment.billingPackageMonths ?? (payment.billingPeriod === 'year' ? 12 : 1);

  const alreadyPaid = await query<{ id: string }>(
    `select id from public.billing_payments
      where payment_id = $1 and status = 'paid'::public.billing_payment_status
      limit 1`,
    [payment.id],
  );
  if (alreadyPaid.rows[0]) {
    return;
  }

  const card = webhookBody
    ? extractCardFromWebhook(webhookBody)
    : { brand: null, last4: null, expMonth: null, expYear: null, token: null };
  const brand = payment.paymentMethodBrand ?? card.brand;

  if (purpose === 'update_card') {
    await withTransaction(async (client: PoolClient) => {
      await client.query(
        `update public.master_subscriptions
            set card_brand = coalesce($2, card_brand),
                card_last4 = coalesce($3, card_last4),
                card_exp_month = coalesce($4, card_exp_month),
                card_exp_year = coalesce($5, card_exp_year),
                provider_card_token = coalesce($6, provider_card_token),
                provider = 'bepaid',
                last_payment_id = $7,
                updated_at = now()
          where master_id = $1`,
        [
          payment.masterId,
          brand,
          card.last4,
          card.expMonth,
          card.expYear,
          card.token,
          payment.id,
        ],
      );

      const providerPaymentId = payment.bepaidTransactionUid ?? payment.id;
      await client.query(
        `update public.billing_payments
            set status = 'paid'::public.billing_payment_status,
                paid_at = coalesce($2, now()),
                provider_payment_id = $3,
                updated_at = now()
          where payment_id = $1`,
        [payment.id, payment.paidAt ? new Date(payment.paidAt) : new Date(), providerPaymentId],
      );
    });

    await recordBillingEvent({
      masterId: payment.masterId,
      eventType: 'payment_method_updated',
      planCode: 'pro',
      amount: payment.amount,
      status: 'succeeded',
      source: 'bepaid',
      metadata: { paymentId: payment.id },
    });
    return;
  }

  if (!purposeExtendsProPeriod(purpose)) return;

  const planRow = await query<{ id: string; price_month: string; price_year: string }>(
    `select id, price_month::text, price_year::text
       from public.subscription_plans where code = 'pro' and is_active = true limit 1`,
  );
  const plan = planRow.rows[0];
  if (!plan) throw ApiError.internal('План Pro не найден');

  const pkg = resolvePackageAmount(packageMonths, {
    priceMonth: Number(plan.price_month),
    priceYear: Number(plan.price_year),
  });
  const price = pkg.amount;
  const billingPeriod = packageMonthsToBillingPeriod(packageMonths);

  const isRenewalLike =
    purpose === 'retry_payment' ||
    purpose === 'renewal_charge' ||
    purpose === 'manual_topup';

  let scheduleRenewalSubId: string | null = null;
  let scheduleRenewalPeriodEnd: Date | null = null;
  let wasTrialing = false;
  let previousCancelAtPeriodEnd = false;

  await withTransaction(async (client: PoolClient) => {
    const sub = await client.query<{
      id: string;
      current_period_end: Date;
      current_period_start: Date;
      status: string;
      trial_ends_at: Date | null;
      auto_renew_enabled: boolean;
      cancel_at_period_end: boolean;
    }>(
      `select id, current_period_end, current_period_start, status::text as status,
              trial_ends_at, auto_renew_enabled, cancel_at_period_end
         from public.master_subscriptions where master_id = $1 for update`,
      [payment.masterId],
    );
    const subRow = sub.rows[0];
    if (!subRow) return;

    wasTrialing = subRow.status === 'trialing';
    previousCancelAtPeriodEnd = subRow.cancel_at_period_end;

    const now = new Date();
    const isProPeriodActive = subRow.current_period_end.getTime() > now.getTime();
    const bounds = computePeriodBounds({
      purpose,
      packageMonths,
      now,
      currentPeriodEnd: subRow.current_period_end,
      subscriptionStatus: subRow.status,
      trialEndsAt: subRow.trial_ends_at,
      isProPeriodActive,
    });

    const periodStart = bounds.periodStart;
    const periodEnd = bounds.periodEnd;

    const enableAutoRenew =
      purpose === 'initial_purchase' ||
      (purpose === 'retry_payment' && !previousCancelAtPeriodEnd);

    if (enableAutoRenew && card.token) {
      scheduleRenewalSubId = subRow.id;
      scheduleRenewalPeriodEnd = periodEnd;
    }

    const nextChargeAt =
      enableAutoRenew && !previousCancelAtPeriodEnd ? periodEnd : subRow.cancel_at_period_end ? null : periodEnd;

    await client.query(
      `update public.master_subscriptions
          set plan_id = $1,
              status = 'active'::public.subscription_status,
              billing_period = $2::public.billing_period,
              current_period_start = case
                when $14::text = 'manual_topup' then current_period_start
                else $3
              end,
              current_period_end = $4,
              next_charge_at = case
                when $14::text = 'manual_topup' and cancel_at_period_end then null
                when $14::text = 'manual_topup' then coalesce(next_charge_at, $4)
                else $5
              end,
              cancel_at_period_end = case
                when $14::text = 'manual_topup' then cancel_at_period_end
                when $14::text in ('initial_purchase', 'retry_payment') then false
                else cancel_at_period_end
              end,
              cancelled_at = case
                when $14::text in ('initial_purchase', 'retry_payment') then null
                else cancelled_at
              end,
              cancellation_reason = case
                when $14::text in ('initial_purchase', 'retry_payment') then null
                else cancellation_reason
              end,
              price_amount = $6,
              currency = $7,
              provider = 'bepaid',
              card_brand = coalesce($8, card_brand),
              card_last4 = coalesce($9, card_last4),
              card_exp_month = coalesce($10, card_exp_month),
              card_exp_year = coalesce($11, card_exp_year),
              provider_card_token = coalesce($12, provider_card_token),
              auto_renew_enabled = case
                when $14::text = 'manual_topup' then auto_renew_enabled
                when $14::text = 'retry_payment' then true
                else true
              end,
              last_payment_id = $13,
              updated_at = now()
        where master_id = $15`,
      [
        plan.id,
        billingPeriod,
        periodStart,
        periodEnd,
        nextChargeAt,
        price,
        payment.currency,
        brand,
        card.last4,
        card.expMonth,
        card.expYear,
        card.token,
        payment.id,
        purpose,
        payment.masterId,
      ],
    );

    if (wasTrialing && subRow.trial_ends_at) {
      await client.query(
        `update public.master_subscriptions
            set trial_consumed = true, updated_at = now()
          where master_id = $1`,
        [payment.masterId],
      );
    }

    await client.query(
      `update public.master_profiles
          set master_plan = 'pro',
              pro_status = 'active',
              pro_started_at = coalesce(pro_started_at, now()),
              pro_expires_at = $2,
              updated_at = now()
        where master_id = $1`,
      [payment.masterId, periodEnd],
    );

    const providerPaymentId = payment.bepaidTransactionUid ?? payment.id;
    await client.query(
      `update public.billing_payments
          set status = 'paid'::public.billing_payment_status,
              paid_at = coalesce($2, now()),
              provider_payment_id = $3,
              updated_at = now()
        where payment_id = $1`,
      [payment.id, payment.paidAt ? new Date(payment.paidAt) : new Date(), providerPaymentId],
    );

    const existingBp = await client.query<{ id: string }>(
      `select id from public.billing_payments where payment_id = $1`,
      [payment.id],
    );
    if (!existingBp.rows[0]) {
      const kind = purposeToPaymentKind(purpose);
      await client.query(
        `insert into public.billing_payments (
           subscription_id, master_id, profile_id, payment_id, provider_payment_id,
           amount, currency, status, payment_kind, paid_at, invoice_number
         ) values ($1, $2, $3, $4, $5, $6, $7, 'paid', $8::public.billing_payment_kind, now(), $9)`,
        [
          subRow.id,
          payment.masterId,
          payment.profileId,
          payment.id,
          providerPaymentId,
          payment.amount,
          payment.currency,
          kind,
          `INV-${payment.id.slice(0, 8).toUpperCase()}`,
        ],
      );
    }
  });

  const eventType =
    purpose === 'manual_topup' || isRenewalLike ? 'subscription_renewed' : 'subscription_purchased';

  await recordBillingEvent({
    masterId: payment.masterId,
    eventType,
    planCode: 'pro',
    billingPeriod,
    amount: payment.amount,
    status: 'succeeded',
    source: 'bepaid',
    metadata: { paymentId: payment.id, purpose, packageMonths },
  });

  if (wasTrialing && purpose === 'initial_purchase') {
    const { recordTrialConvertedToPaid } = await import('./trial.service.js');
    await recordTrialConvertedToPaid(payment.masterId).catch(() => {});
  }

  const dto = await getBillingSubscription(payment.masterId);
  const n = isRenewalLike
    ? subscriptionRenewedNotification(dto.currentPeriodEnd)
    : subscriptionActivatedNotification(dto.nextChargeAt ?? dto.currentPeriodEnd);
  await notifyUser({
    userId: payment.masterId,
    type: n.type,
    title: n.title,
    body: n.body,
    telegramHtml: n.telegramHtml,
    masterPreferenceEvent: 'billing',
  }).catch(() => {});

  if (
    scheduleRenewalSubId &&
    scheduleRenewalPeriodEnd &&
    isBePaidRecurringConfigured() &&
    !previousCancelAtPeriodEnd
  ) {
    const { ensureRenewalChargeJob } = await import('./billingJobs.service.js');
    await ensureRenewalChargeJob(scheduleRenewalSubId, scheduleRenewalPeriodEnd).catch(() => {});
  }
}

/** @deprecated use fulfillSubscriptionFromPayment */
export async function activateSubscriptionFromPayment(
  payment: PaymentDto,
  webhookBody?: Record<string, unknown>,
): Promise<void> {
  return fulfillSubscriptionFromPayment(payment, webhookBody);
}

export async function markSubscriptionPaymentFailed(payment: PaymentDto): Promise<void> {
  if (!payment.masterId) return;

  const purpose: BillingCheckoutPurpose = payment.checkoutPurpose ?? 'initial_purchase';
  if (!purposeMarksPastDueOnFail(purpose)) {
    await query(
      `update public.billing_payments
          set status = 'failed'::public.billing_payment_status,
              failed_at = now(),
              failure_reason = $2,
              updated_at = now()
        where payment_id = $1`,
      [payment.id, payment.errorMessage ?? 'payment_failed'],
    );
    return;
  }

  await query(
    `update public.master_subscriptions
        set status = 'past_due'::public.subscription_status,
            updated_at = now()
      where master_id = $1`,
    [payment.masterId],
  );

  await query(
    `update public.billing_payments
        set status = 'failed'::public.billing_payment_status,
            failed_at = now(),
            failure_reason = $2,
            updated_at = now()
      where payment_id = $1`,
    [payment.id, payment.errorMessage ?? 'payment_failed'],
  );

  await recordBillingEvent({
    masterId: payment.masterId,
    eventType: 'payment_failed',
    planCode: 'pro',
    billingPeriod: payment.billingPeriod ?? undefined,
    amount: payment.amount,
    status: 'failed',
    source: 'bepaid',
    metadata: { paymentId: payment.id },
  });

  const n = subscriptionPaymentFailedNotification();
  await notifyUser({
    userId: payment.masterId,
    type: n.type,
    title: n.title,
    body: n.body,
    telegramHtml: n.telegramHtml,
    masterPreferenceEvent: 'billing',
  }).catch(() => {});
}

/** Напоминание о скором списании (вызывать из cron/worker). */
export async function sendRenewalReminders(daysBefore = 3): Promise<number> {
  const r = await query<{ master_id: string; next_charge_at: Date; price_amount: string }>(
    `select ms.master_id, ms.next_charge_at, coalesce(ms.price_amount, sp.price_month)::text as price_amount
       from public.master_subscriptions ms
       join public.subscription_plans sp on sp.id = ms.plan_id
      where sp.code = 'pro'
        and ms.status = 'active'::public.subscription_status
        and ms.cancel_at_period_end = false
        and ms.next_charge_at is not null
        and ms.next_charge_at > now()
        and ms.next_charge_at <= now() + ($1::int || ' days')::interval`,
    [daysBefore],
  );
  let sent = 0;
  for (const row of r.rows) {
    const n = subscriptionRenewalReminderNotification(
      row.next_charge_at,
      Number(row.price_amount),
    );
    await notifyUser({
      userId: row.master_id,
      type: n.type,
      title: n.title,
      body: n.body,
      telegramHtml: n.telegramHtml,
    }).catch(() => {});
    sent += 1;
  }
  return sent;
}
