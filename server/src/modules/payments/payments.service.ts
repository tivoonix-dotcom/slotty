import { randomUUID } from 'crypto';
import { query, withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { getMasterPlanAccess } from '../billing/billing.service.js';
import type { BillingCheckoutPurpose } from '../billing/billingCheckoutPurpose.js';
import {
  type BillingPackageMonths,
  packageMonthsToBillingPeriod,
  resolvePackageAmount,
  uniqueCheckoutIdempotencyKey,
} from '../billing/billingPackage.js';
import {
  assertBePaidReady,
  getBePaidFailUrl,
  getBePaidNotificationUrl,
  getBePaidSuccessUrl,
  getCardUpdateAmountMinor,
  getPendingCheckoutTtlMinutes,
} from './bepaid.config.js';
import { createBePaidCheckout } from './bepaid.client.js';
import {
  extractWebhookTrackingId,
  validateWebhookAgainstPayment,
} from './bepaidWebhookValidation.js';
import { sanitizePayloadForLog } from './paymentLogSanitizer.js';
import type {
  CreateBePaidPaymentResult,
  PaymentDto,
  PaymentStatus,
  PaymentStatusEventDto,
  PaymentType,
} from './payment.types.js';

type PaymentRow = {
  id: string;
  profile_id: string;
  provider: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  amount_minor: number;
  currency: string;
  master_id: string | null;
  appointment_id: string | null;
  plan_id: string | null;
  billing_period: 'month' | 'year' | null;
  checkout_purpose: BillingCheckoutPurpose | null;
  billing_package_months: number | null;
  checkout_idempotency_key: string | null;
  tracking_id: string;
  bepaid_checkout_token: string | null;
  bepaid_transaction_uid: string | null;
  bepaid_redirect_url: string | null;
  payment_method_brand: string | null;
  payment_method_type: string | null;
  error_message: string | null;
  provider_payload: unknown;
  paid_at: Date | string | null;
  created_at: Date;
  updated_at: Date;
};

function mapPayment(row: PaymentRow): PaymentDto {
  return {
    id: row.id,
    profileId: row.profile_id,
    provider: 'bepaid',
    paymentType: row.payment_type,
    status: row.status,
    amountMinor: row.amount_minor,
    amount: row.amount_minor / 100,
    currency: row.currency,
    masterId: row.master_id,
    appointmentId: row.appointment_id,
    planId: row.plan_id,
    billingPeriod: row.billing_period,
    checkoutPurpose: row.checkout_purpose,
    billingPackageMonths: (row.billing_package_months === 1 ||
    row.billing_package_months === 3 ||
    row.billing_package_months === 12
      ? row.billing_package_months
      : null) as BillingPackageMonths | null,
    trackingId: row.tracking_id,
    bepaidCheckoutToken: row.bepaid_checkout_token,
    bepaidTransactionUid: row.bepaid_transaction_uid,
    bepaidRedirectUrl: row.bepaid_redirect_url,
    paymentMethodBrand: row.payment_method_brand,
    paymentMethodType: row.payment_method_type,
    errorMessage: row.error_message,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    providerPayload: row.provider_payload ?? undefined,
  };
}

async function insertStatusEvent(
  paymentId: string,
  fromStatus: PaymentStatus | null,
  toStatus: PaymentStatus,
  source: string,
  note?: string,
  payload?: unknown,
): Promise<void> {
  await query(
    `insert into public.payment_status_events (payment_id, from_status, to_status, source, note, payload)
     values ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      paymentId,
      fromStatus,
      toStatus,
      source,
      note ?? null,
      payload ? JSON.stringify(sanitizePayloadForLog(payload)) : null,
    ],
  );
}

async function transitionPaymentStatus(
  paymentId: string,
  nextStatus: PaymentStatus,
  source: string,
  patch: {
    bepaidTransactionUid?: string | null;
    paymentMethodBrand?: string | null;
    paymentMethodType?: string | null;
    errorMessage?: string | null;
    providerPayload?: unknown;
    paidAt?: Date | null;
  },
): Promise<{ payment: PaymentDto | null; transitioned: boolean }> {
  return withTransaction(async (client) => {
    const lock = await client.query<PaymentRow>(
      `select * from public.payments where id = $1 for update`,
      [paymentId],
    );
    const row = lock.rows[0];
    if (!row) return { payment: null, transitioned: false };

    const current = row.status;
    if (current === nextStatus) {
      return { payment: mapPayment(row), transitioned: false };
    }
    if (current === 'success' && nextStatus !== 'refunded') {
      return { payment: mapPayment(row), transitioned: false };
    }
    if (['cancelled', 'refunded'].includes(current) && nextStatus !== 'refunded') {
      return { payment: mapPayment(row), transitioned: false };
    }

    const paidAt =
      patch.paidAt !== undefined
        ? patch.paidAt
        : nextStatus === 'success'
          ? new Date()
          : row.paid_at;

    const updated = await client.query<PaymentRow>(
      `update public.payments
          set status = $2,
              bepaid_transaction_uid = coalesce($3, bepaid_transaction_uid),
              payment_method_brand = coalesce($4, payment_method_brand),
              payment_method_type = coalesce($5, payment_method_type),
              error_message = coalesce($6, error_message),
              provider_payload = coalesce($7::jsonb, provider_payload),
              paid_at = coalesce($8, paid_at),
              updated_at = now()
        where id = $1
        returning *`,
      [
        paymentId,
        nextStatus,
        patch.bepaidTransactionUid ?? null,
        patch.paymentMethodBrand ?? null,
        patch.paymentMethodType ?? null,
        patch.errorMessage ?? null,
        patch.providerPayload ? JSON.stringify(patch.providerPayload) : null,
        paidAt,
      ],
    );

    await client.query(
      `insert into public.payment_status_events (payment_id, from_status, to_status, source, payload)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [
        paymentId,
        current,
        nextStatus,
        source,
        patch.providerPayload ? JSON.stringify(sanitizePayloadForLog(patch.providerPayload)) : null,
      ],
    );

    return { payment: mapPayment(updated.rows[0]!), transitioned: true };
  });
}

async function recordRejectedWebhook(
  paymentId: string | null,
  code: string,
  body: Record<string, unknown>,
): Promise<void> {
  if (!paymentId) return;
  await insertStatusEvent(paymentId, null, 'pending', 'webhook_rejected', code, body);
}

async function resolveProPlanPricing(
  packageMonths: BillingPackageMonths,
  planId?: string,
): Promise<{ amountMinor: number; amount: number; planId: string; description: string; billingPeriod: 'month' | 'year' }> {
  const r = planId
    ? await query<{ id: string; code: string; price_month: string; price_year: string; name: string }>(
        `select id, code, name, price_month::text, price_year::text
           from public.subscription_plans where id = $1 and is_active = true limit 1`,
        [planId],
      )
    : await query<{ id: string; code: string; price_month: string; price_year: string; name: string }>(
        `select id, code, name, price_month::text, price_year::text
           from public.subscription_plans where code = 'pro' and is_active = true limit 1`,
      );
  const plan = r.rows[0];
  if (!plan || plan.code !== 'pro') {
    throw ApiError.badRequest('План Pro не найден', 'PLAN_NOT_FOUND');
  }
  const pkg = resolvePackageAmount(packageMonths, {
    priceMonth: Number(plan.price_month),
    priceYear: Number(plan.price_year),
  });
  if (!Number.isFinite(pkg.amountMinor) || pkg.amountMinor <= 0) {
    throw ApiError.badRequest('Некорректная цена плана', 'PLAN_PRICE_INVALID');
  }
  return {
    amountMinor: pkg.amountMinor,
    amount: pkg.amount,
    planId: plan.id,
    description: pkg.description,
    billingPeriod: packageMonthsToBillingPeriod(packageMonths),
  };
}

async function findReusablePendingCheckout(input: {
  masterId: string;
  purpose: BillingCheckoutPurpose;
  packageMonths: BillingPackageMonths;
}): Promise<{ paymentId: string; redirectUrl: string } | null> {
  const ttlMin = getPendingCheckoutTtlMinutes();
  const r = await query<{ id: string; bepaid_redirect_url: string | null }>(
    `select id, bepaid_redirect_url
       from public.payments
      where master_id = $1
        and checkout_purpose = $2
        and billing_package_months = $3
        and status = 'pending'::public.payment_status
        and bepaid_redirect_url is not null
        and created_at > now() - ($4::int || ' minutes')::interval
      order by created_at desc
      limit 1`,
    [input.masterId, input.purpose, input.packageMonths, ttlMin],
  );
  const row = r.rows[0];
  const url = row?.bepaid_redirect_url?.trim();
  if (!row || !url) return null;
  return { paymentId: row.id, redirectUrl: url };
}

export async function createBePaidPayment(input: {
  profileId: string;
  masterId: string;
  type: PaymentType;
  amountMinor?: number;
  currency?: string;
  appointmentId?: string;
  planId?: string;
  billingPeriod?: 'month' | 'year';
  billingPackageMonths?: BillingPackageMonths;
  returnUrl?: string;
  customerEmail?: string | null;
  checkoutPurpose?: BillingCheckoutPurpose;
  skipIdempotency?: boolean;
}): Promise<CreateBePaidPaymentResult> {
  assertBePaidReady();

  const currency = (input.currency ?? env.BEPAID_CURRENCY ?? 'BYN').toUpperCase();
  let amountMinor = input.amountMinor;
  let planId: string | null = input.planId ?? null;
  let billingPeriod: 'month' | 'year' | null = input.billingPeriod ?? null;
  let packageMonths: BillingPackageMonths = input.billingPackageMonths ?? (billingPeriod === 'year' ? 12 : 1);
  let description = 'Оплата SLOTTY';
  const purpose: BillingCheckoutPurpose = input.checkoutPurpose ?? 'initial_purchase';

  if (input.type === 'master_pro_plan') {
    if (purpose === 'update_card') {
      amountMinor = getCardUpdateAmountMinor();
      billingPeriod = billingPeriod ?? 'month';
      packageMonths = 1;
      description = 'SLOTTY — привязка карты';
      const access = await getMasterPlanAccess(input.masterId);
      if (!access.isProEntitled && !access.proExpired) {
        throw ApiError.badRequest('Сначала подключите Pro', 'PRO_REQUIRED');
      }
    } else {
      if (!input.billingPackageMonths && !billingPeriod) {
        throw ApiError.badRequest('Укажите billingPackageMonths или billingPeriod', 'BILLING_PERIOD_REQUIRED');
      }
      if (input.billingPackageMonths) {
        packageMonths = input.billingPackageMonths;
      } else if (billingPeriod === 'year') {
        packageMonths = 12;
      } else {
        packageMonths = 1;
      }
      const pro = await resolveProPlanPricing(packageMonths, input.planId);
      amountMinor = pro.amountMinor;
      planId = pro.planId;
      billingPeriod = pro.billingPeriod;
      description = pro.description;

      const access = await getMasterPlanAccess(input.masterId);
      if (purpose === 'initial_purchase') {
        if (access.isProActive && access.subscriptionStatus !== 'trialing') {
          throw ApiError.badRequest(
            'Тариф Pro уже активен. Используйте «Продлить» для добавления оплаченного периода.',
            'PRO_ALREADY_ACTIVE',
          );
        }
      }
      if (purpose === 'retry_payment' && access.subscriptionStatus !== 'past_due' && access.uiState !== 'past_due') {
        throw ApiError.badRequest('Повтор оплаты недоступен в текущем статусе', 'RETRY_NOT_ALLOWED');
      }
      if (purpose === 'manual_topup') {
        if (!access.isProEntitled && access.uiState !== 'expired' && access.uiState !== 'free') {
          throw ApiError.badRequest('Продление недоступно', 'TOPUP_NOT_ALLOWED');
        }
        if (access.uiState === 'free' || access.uiState === 'expired') {
          throw ApiError.badRequest(
            'Для первой покупки используйте «Подключить Pro»',
            'USE_INITIAL_CHECKOUT',
          );
        }
      }
    }
  } else if (input.type === 'appointment_prepayment') {
    throw ApiError.badRequest(
      'Предоплата записи пока недоступна',
      'APPOINTMENT_PREPAYMENT_DISABLED',
    );
  }

  if (!amountMinor || amountMinor <= 0) {
    throw ApiError.badRequest('Некорректная сумма', 'AMOUNT_INVALID');
  }

  if (!input.skipIdempotency) {
    const reusable = await findReusablePendingCheckout({
      masterId: input.masterId,
      purpose,
      packageMonths,
    });
    if (reusable) {
      return {
        paymentId: reusable.paymentId,
        provider: 'bepaid',
        status: 'pending',
        checkout: { token: '', redirectUrl: reusable.redirectUrl },
        reused: true,
      };
    }
  }

  const paymentId = randomUUID();
  const trackingId = paymentId;
  const idempotencyKey = uniqueCheckoutIdempotencyKey({
    masterId: input.masterId,
    purpose,
    packageMonths,
    attemptId: paymentId,
  });

  const insertPaymentRow = async (key: string) => {
    await query<PaymentRow>(
      `insert into public.payments (
         id, profile_id, provider, payment_type, status, amount_minor, currency,
         master_id, appointment_id, plan_id, billing_period, tracking_id,
         checkout_purpose, billing_package_months, checkout_idempotency_key
       ) values ($1, $2, 'bepaid', $3, 'pending', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       returning *`,
      [
        paymentId,
        input.profileId,
        input.type,
        amountMinor,
        currency,
        input.masterId,
        input.appointmentId ?? null,
        planId,
        billingPeriod,
        trackingId,
        purpose,
        packageMonths,
        key,
      ],
    );
  };

  try {
    await insertPaymentRow(idempotencyKey);
  } catch (e) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
    if (code === '23505') {
      const retryKey = uniqueCheckoutIdempotencyKey({
        masterId: input.masterId,
        purpose,
        packageMonths,
        attemptId: randomUUID(),
      });
      try {
        await insertPaymentRow(retryKey);
      } catch {
        throw ApiError.internal('Не удалось создать платёж. Попробуйте ещё раз.', 'CHECKOUT_CREATE_FAILED');
      }
    } else {
      throw e;
    }
  }

  await insertStatusEvent(paymentId, null, 'pending', 'api', 'created');

  const notificationUrl = getBePaidNotificationUrl();
  if (!notificationUrl) {
    console.warn('[bepaid] BEPAID_NOTIFICATION_URL / PUBLIC_API_URL not set — webhook will not be called by bePaid');
  }

  let checkout;
  try {
    checkout = await createBePaidCheckout({
      trackingId,
      amountMinor,
      currency,
      description,
      notificationUrl,
      successUrl: getBePaidSuccessUrl(
        input.returnUrl
          ? `${input.returnUrl}${input.returnUrl.includes('?') ? '&' : '?'}payment_id=${paymentId}`
          : `${getBePaidSuccessUrl()}?payment_id=${paymentId}`,
      ),
      failUrl: getBePaidFailUrl(),
      customerEmail: input.customerEmail,
    });
  } catch (e) {
    await transitionPaymentStatus(paymentId, 'failed', 'api', {
      errorMessage: e instanceof Error ? e.message : 'checkout_failed',
    });
    throw e;
  }

  const updated = await query<PaymentRow>(
    `update public.payments
        set bepaid_checkout_token = $2,
            bepaid_redirect_url = $3,
            updated_at = now()
      where id = $1
      returning *`,
    [paymentId, checkout.token, checkout.redirectUrl],
  );

  return {
    paymentId,
    provider: 'bepaid',
    status: mapPayment(updated.rows[0]!).status,
    checkout: {
      token: checkout.token,
      redirectUrl: checkout.redirectUrl,
    },
  };
}

function mapWebhookToStatus(body: Record<string, unknown>): {
  status: PaymentStatus;
  transactionUid?: string;
  brand?: string;
  methodType?: string;
  message?: string;
  paidAt?: Date;
} {
  const transaction =
    body.transaction && typeof body.transaction === 'object'
      ? (body.transaction as Record<string, unknown>)
      : null;

  if (transaction) {
    const raw = String(transaction.status ?? '').toLowerCase();
    const brand =
      transaction.credit_card && typeof transaction.credit_card === 'object'
        ? String((transaction.credit_card as Record<string, unknown>).brand ?? '')
        : undefined;
    const uid = transaction.uid ? String(transaction.uid) : undefined;
    const message = transaction.message ? String(transaction.message) : undefined;
    const paidAt = transaction.paid_at ? new Date(String(transaction.paid_at)) : undefined;
    if (raw === 'successful') {
      return { status: 'success', transactionUid: uid, brand, methodType: String(transaction.payment_method_type ?? ''), paidAt };
    }
    if (raw === 'failed' || raw === 'error') {
      return { status: 'failed', transactionUid: uid, brand, message };
    }
    if (raw === 'expired') {
      return { status: 'expired', transactionUid: uid, message };
    }
    return { status: 'pending', transactionUid: uid, message };
  }

  const expired = body.expired === true;
  const finished = body.finished === true;
  const status = String(body.status ?? '').toLowerCase();
  if (expired) {
    return { status: 'expired', message: String(body.message ?? 'expired') };
  }
  if (finished && status === 'successful') {
    return { status: 'success', message: String(body.message ?? '') };
  }
  if (status === 'error' || status === 'failed') {
    return { status: 'failed', message: String(body.message ?? '') };
  }
  return { status: 'pending', message: String(body.message ?? '') };
}

async function fulfillMasterProPlan(
  payment: PaymentDto,
  webhookBody?: Record<string, unknown>,
): Promise<void> {
  if (!payment.masterId) return;
  const { fulfillSubscriptionFromPayment } = await import('../billing/subscriptionBilling.service.js');
  await fulfillSubscriptionFromPayment(payment, webhookBody);
}

export async function processBePaidWebhook(body: Record<string, unknown>): Promise<{
  ok: boolean;
  paymentId?: string;
  rejected?: boolean;
  rejectCode?: string;
}> {
  const trackingId = extractWebhookTrackingId(body);
  const token = body.token ? String(body.token) : undefined;

  let find = trackingId
    ? await query<PaymentRow>(`select * from public.payments where tracking_id = $1 limit 1`, [trackingId])
    : { rows: [] as PaymentRow[] };

  if (!find.rows[0] && token) {
    find = await query<PaymentRow>(
      `select * from public.payments where bepaid_checkout_token = $1 limit 1`,
      [token],
    );
  }

  const row = find.rows[0];
  if (!row) {
    console.warn('[bepaid] webhook: payment not found', {
      trackingId: trackingId || undefined,
      hasToken: Boolean(token),
    });
    return { ok: true };
  }

  const mapped = mapWebhookToStatus(body);

  if (mapped.status === 'success') {
    const validation = validateWebhookAgainstPayment(body, {
      id: row.id,
      trackingId: row.tracking_id,
      amountMinor: row.amount_minor,
      currency: row.currency,
      status: row.status,
    });
    if (!validation.ok) {
      console.warn('[bepaid] webhook rejected', { paymentId: row.id, code: validation.code });
      await recordRejectedWebhook(row.id, validation.code, body);
      return { ok: false, paymentId: row.id, rejected: true, rejectCode: validation.code };
    }
  }

  const { payment: updated, transitioned } = await transitionPaymentStatus(row.id, mapped.status, 'webhook', {
    bepaidTransactionUid: mapped.transactionUid ?? null,
    paymentMethodBrand: mapped.brand ?? null,
    paymentMethodType: mapped.methodType ?? null,
    errorMessage: mapped.message ?? null,
    providerPayload: body,
    paidAt: mapped.paidAt ?? (mapped.status === 'success' ? new Date() : null),
  });

  if (updated?.status === 'success' && updated.paymentType === 'master_pro_plan') {
    try {
      await fulfillMasterProPlan(updated, body);
    } catch (e) {
      console.error('[bepaid] fulfill pro after success failed', {
        paymentId: updated.id,
        err: e instanceof Error ? e.message : 'unknown',
      });
      throw e;
    }
  }

  if (
    transitioned &&
    updated?.status === 'failed' &&
    updated.masterId &&
    updated.paymentType === 'master_pro_plan'
  ) {
    const { markSubscriptionPaymentFailed } = await import('../billing/subscriptionBilling.service.js');
    await markSubscriptionPaymentFailed(updated).catch(() => {});
  }

  return { ok: true, paymentId: row.id };
}

export async function getPaymentById(paymentId: string): Promise<PaymentDto | null> {
  const r = await query<PaymentRow>(`select * from public.payments where id = $1`, [paymentId]);
  return r.rows[0] ? mapPayment(r.rows[0]) : null;
}

export async function getPaymentForUser(paymentId: string, profileId: string): Promise<PaymentDto | null> {
  const r = await query<PaymentRow>(
    `select * from public.payments where id = $1 and profile_id = $2`,
    [paymentId, profileId],
  );
  return r.rows[0] ? mapPayment(r.rows[0]) : null;
}

export async function listPaymentStatusEvents(paymentId: string): Promise<PaymentStatusEventDto[]> {
  const r = await query<{
    id: string;
    from_status: PaymentStatus | null;
    to_status: PaymentStatus;
    source: string;
    note: string | null;
    created_at: Date;
  }>(
    `select id, from_status, to_status, source, note, created_at
       from public.payment_status_events
      where payment_id = $1
      order by created_at asc`,
    [paymentId],
  );
  return r.rows.map((row) => ({
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    source: row.source,
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export type AdminPaymentListRow = PaymentDto & {
  userDisplayName: string | null;
  userEmail: string | null;
};

export async function listPaymentsForAdmin(filters: {
  status?: PaymentStatus;
  type?: PaymentType;
  profileId?: string;
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  pageSize?: number;
}): Promise<{ payments: AdminPaymentListRow[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;
  const clauses: string[] = ['1=1'];
  const params: unknown[] = [];
  let i = 1;

  if (filters.status) {
    clauses.push(`p.status = $${i++}`);
    params.push(filters.status);
  }
  if (filters.type) {
    clauses.push(`p.payment_type = $${i++}`);
    params.push(filters.type);
  }
  if (filters.profileId) {
    clauses.push(`p.profile_id = $${i++}`);
    params.push(filters.profileId);
  }
  if (filters.provider) {
    clauses.push(`p.provider = $${i++}`);
    params.push(filters.provider);
  }
  if (filters.dateFrom) {
    clauses.push(`p.created_at >= $${i++}::timestamptz`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    clauses.push(`p.created_at <= $${i++}::timestamptz`);
    params.push(filters.dateTo);
  }
  if (filters.amountMin !== undefined) {
    clauses.push(`p.amount_minor >= $${i++}`);
    params.push(Math.round(filters.amountMin * 100));
  }
  if (filters.amountMax !== undefined) {
    clauses.push(`p.amount_minor <= $${i++}`);
    params.push(Math.round(filters.amountMax * 100));
  }

  const where = clauses.join(' and ');
  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.payments p where ${where}`,
    params,
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const listR = await query<
    PaymentRow & { full_name: string | null; user_email: string | null }
  >(
    `select p.*, pr.full_name,
            (select ai.email from public.auth_identities ai
              where ai.profile_id = pr.id and ai.email is not null
              order by case when ai.provider = 'email' then 0 else 1 end
              limit 1) as user_email
       from public.payments p
       left join public.profiles pr on pr.id = p.profile_id
      where ${where}
      order by p.created_at desc
      limit $${i++} offset $${i++}`,
    [...params, pageSize, offset],
  );

  return {
    total,
    payments: listR.rows.map((row) => ({
      ...mapPayment(row),
      userDisplayName: row.full_name,
      userEmail: row.user_email,
    })),
  };
}

export function paymentProviderPayloadForAdmin(payload: unknown): unknown {
  return sanitizePayloadForLog(payload);
}
