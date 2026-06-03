import { randomUUID } from 'crypto';
import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordBillingEvent } from '../billing/billingEvents.service.js';
import { getMasterPlanAccess } from '../billing/billing.service.js';
import {
  assertBePaidReady,
  getBePaidFailUrl,
  getBePaidNotificationUrl,
  getBePaidSuccessUrl,
} from './bepaid.config.js';
import { createBePaidCheckout } from './bepaid.client.js';
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
): Promise<PaymentDto | null> {
  return withTransaction(async (client) => {
    const lock = await client.query<PaymentRow>(
      `select * from public.payments where id = $1 for update`,
      [paymentId],
    );
    const row = lock.rows[0];
    if (!row) return null;

    const current = row.status;
    if (current === nextStatus) {
      return mapPayment(row);
    }
    if (current === 'success' && nextStatus !== 'refunded') {
      return mapPayment(row);
    }
    if (['cancelled', 'refunded'].includes(current) && nextStatus !== 'refunded') {
      return mapPayment(row);
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

    return mapPayment(updated.rows[0]!);
  });
}

async function resolveProPlanAmountMinor(
  billingPeriod: 'month' | 'year',
  planId?: string,
): Promise<{ amountMinor: number; planId: string; description: string }> {
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
  const price = billingPeriod === 'year' ? Number(plan.price_year) : Number(plan.price_month);
  const amountMinor = Math.round(price * 100);
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw ApiError.badRequest('Некорректная цена плана', 'PLAN_PRICE_INVALID');
  }
  return {
    amountMinor,
    planId: plan.id,
    description: `SLOTTY Pro (${billingPeriod === 'year' ? 'год' : 'месяц'})`,
  };
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
  returnUrl?: string;
  customerEmail?: string | null;
}): Promise<CreateBePaidPaymentResult> {
  assertBePaidReady();

  const currency = (input.currency ?? 'BYN').toUpperCase();
  let amountMinor = input.amountMinor;
  let planId: string | null = input.planId ?? null;
  let billingPeriod: 'month' | 'year' | null = input.billingPeriod ?? null;
  let description = 'Оплата SLOTTY';

  if (input.type === 'master_pro_plan') {
    if (!billingPeriod) {
      throw ApiError.badRequest('Укажите billingPeriod', 'BILLING_PERIOD_REQUIRED');
    }
    const pro = await resolveProPlanAmountMinor(billingPeriod, input.planId);
    amountMinor = pro.amountMinor;
    planId = pro.planId;
    description = pro.description;
    const access = await getMasterPlanAccess(input.masterId);
    if (access.isProActive) {
      throw ApiError.badRequest('Тариф Pro уже активен', 'PRO_ALREADY_ACTIVE');
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

  const paymentId = randomUUID();
  const trackingId = paymentId;

  await query<PaymentRow>(
    `insert into public.payments (
       id, profile_id, provider, payment_type, status, amount_minor, currency,
       master_id, appointment_id, plan_id, billing_period, tracking_id
     ) values ($1, $2, 'bepaid', $3, 'pending', $4, $5, $6, $7, $8, $9, $10)
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
    ],
  );

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
      successUrl: getBePaidSuccessUrl(input.returnUrl),
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

async function fulfillMasterProPlan(payment: PaymentDto): Promise<void> {
  if (!payment.masterId || !payment.billingPeriod) return;
  const durationDays = payment.billingPeriod === 'year' ? 365 : 30;
  const { activateMasterProFromManualPayment } = await import('../billing/billing.service.js');
  await activateMasterProFromManualPayment(payment.masterId, payment.billingPeriod, {
    amount: payment.amount,
    metadata: {
      paymentId: payment.id,
      bepaidTransactionUid: payment.bepaidTransactionUid,
      provider: 'bepaid',
      source: 'payment_gateway',
    },
    durationDays,
  });
}

export async function processBePaidWebhook(body: Record<string, unknown>): Promise<{ ok: boolean; paymentId?: string }> {
  const trackingId =
    (body.transaction && typeof body.transaction === 'object'
      ? String((body.transaction as Record<string, unknown>).tracking_id ?? '')
      : '') ||
    (body.order && typeof body.order === 'object'
      ? String((body.order as Record<string, unknown>).tracking_id ?? '')
      : '') ||
    String(body.tracking_id ?? '');

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
  const updated = await transitionPaymentStatus(row.id, mapped.status, 'webhook', {
    bepaidTransactionUid: mapped.transactionUid ?? null,
    paymentMethodBrand: mapped.brand ?? null,
    paymentMethodType: mapped.methodType ?? null,
    errorMessage: mapped.message ?? null,
    providerPayload: body,
    paidAt: mapped.paidAt ?? (mapped.status === 'success' ? new Date() : null),
  });

  if (updated?.status === 'success' && updated.paymentType === 'master_pro_plan') {
    try {
      await fulfillMasterProPlan(updated);
    } catch (e) {
      console.error('[bepaid] fulfill pro after success failed', {
        paymentId: updated.id,
        err: e instanceof Error ? e.message : 'unknown',
      });
    }
  }

  if (updated?.status === 'failed' && updated.masterId) {
    await recordBillingEvent({
      masterId: updated.masterId,
      eventType: 'payment_failed',
      planCode: 'pro',
      billingPeriod: updated.billingPeriod ?? undefined,
      amount: updated.amount,
      status: 'failed',
      source: 'payment_gateway',
      metadata: { paymentId: updated.id },
    }).catch(() => {});
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
