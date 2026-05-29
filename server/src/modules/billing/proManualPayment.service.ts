import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  activateMasterProFromManualPayment,
  getMasterSubscriptionWithUsage,
  isSubscriptionMockSwitchAllowed,
} from './billing.service.js';
import {
  buildPaymentPurpose,
  getManualPaymentConfigBase,
  getManualProTariffAmount,
  isManualPaymentConfigured,
  type ManualPaymentConfigDto,
} from './manualPaymentConfig.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import { buildMasterPublicProfileUrl } from '../masters/categoryChangePolicy.service.js';

export type ProManualPaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ProManualPaymentRequestDto = {
  id: string;
  status: ProManualPaymentStatus;
  payerFullName: string;
  tariffAmount: number;
  declaredPaidAmount: number;
  receivedAmount: number | null;
  bankFeeAmount: number | null;
  feeCoveredBy: string;
  currency: string;
  billingPeriod: 'month' | 'year';
  paidAt: string | null;
  paymentComment: string;
  receiptUrl: string | null;
  receiptFilePath: string | null;
  adminNote: string | null;
  rejectionReason: string | null;
  taxReceiptCreated: boolean;
  taxReceiptNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type RequestRow = {
  id: string;
  master_id: string;
  payer_full_name: string;
  tariff_amount: string;
  declared_paid_amount: string;
  received_amount: string | null;
  bank_fee_amount: string | null;
  fee_covered_by: string;
  currency: string;
  billing_period: string;
  paid_at: Date | string | null;
  payment_comment: string;
  receipt_url: string | null;
  receipt_file_path: string | null;
  status: string;
  admin_note: string | null;
  rejection_reason: string | null;
  tax_receipt_created: boolean;
  tax_receipt_note: string | null;
  created_at: Date | string;
  reviewed_at: Date | string | null;
};

const REQUEST_COLUMNS = `
  id, master_id, payer_full_name, tariff_amount::text, declared_paid_amount::text,
  received_amount::text, bank_fee_amount::text, fee_covered_by, currency,
  billing_period::text as billing_period, paid_at, payment_comment, receipt_url,
  receipt_file_path, status, admin_note, rejection_reason, tax_receipt_created, tax_receipt_note,
  created_at, reviewed_at
`;

function num(v: string | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapRow(row: RequestRow): ProManualPaymentRequestDto {
  return {
    id: row.id,
    status: row.status as ProManualPaymentStatus,
    payerFullName: row.payer_full_name,
    tariffAmount: Number(row.tariff_amount),
    declaredPaidAmount: Number(row.declared_paid_amount),
    receivedAmount: num(row.received_amount),
    bankFeeAmount: num(row.bank_fee_amount),
    feeCoveredBy: row.fee_covered_by,
    currency: row.currency,
    billingPeriod: row.billing_period === 'year' ? 'year' : 'month',
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString().slice(0, 10) : null,
    paymentComment: row.payment_comment,
    receiptUrl: row.receipt_url,
    receiptFilePath: row.receipt_file_path,
    adminNote: row.admin_note,
    rejectionReason: row.rejection_reason,
    taxReceiptCreated: row.tax_receipt_created,
    taxReceiptNote: row.tax_receipt_note,
    createdAt: new Date(row.created_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
  };
}

export function getProManualPaymentBankDetails(): string {
  const cfg = getManualPaymentConfigBase();
  if (!cfg.configured) {
    return cfg.configMessage ?? 'Реквизиты временно недоступны';
  }
  return [
    `Получатель: ${cfg.recipientFullName}`,
    `Банк: ${cfg.bankName}`,
    `IBAN: ${cfg.iban ?? '—'}`,
    `BIC/SWIFT: ${cfg.bic}`,
    `Валюта: ${cfg.currency}`,
    `Сумма: ${cfg.proAmount} ${cfg.currency}`,
    `Назначение: ${cfg.paymentPurposeTemplate}`,
  ].join('\n');
}

export type ManualPaymentConfigForMasterDto = ManualPaymentConfigDto & {
  paymentPurpose: string;
};

async function getMasterPaymentMeta(masterId: string): Promise<{ displayName: string; phone: string | null }> {
  const r = await query<{ display_name: string; phone: string | null }>(
    `select display_name, phone from public.master_profiles where master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Master profile not found');
  return { displayName: row.display_name, phone: row.phone };
}

export async function getManualPaymentConfigForMaster(
  masterId: string,
): Promise<ManualPaymentConfigForMasterDto> {
  const base = getManualPaymentConfigBase();
  const meta = await getMasterPaymentMeta(masterId);
  const paymentPurpose = buildPaymentPurpose(base.paymentPurposeTemplate, meta.displayName, meta.phone);
  return { ...base, paymentPurpose };
}

async function getProTariffAmount(billingPeriod: 'month' | 'year'): Promise<number> {
  if (billingPeriod === 'month') {
    return getManualProTariffAmount('month');
  }
  const r = await query<{ price_year: string }>(
    `select price_year::text from public.subscription_plans where code = 'pro' and is_active = true limit 1`,
  );
  const row = r.rows[0];
  if (!row) throw ApiError.internal('План Pro не найден');
  return Number(row.price_year);
}

export type MasterProCabinetStatus = 'free' | 'pending' | 'active' | 'expired';

async function resolveMasterProCabinetStatus(masterId: string): Promise<{
  status: MasterProCabinetStatus;
  proExpiresAt: string | null;
  proStartedAt: string | null;
  planCode: string;
}> {
  const sub = await getMasterSubscriptionWithUsage(masterId);
  const proRow = await query<{ pro_expires_at: Date | string | null; pro_started_at: Date | string | null }>(
    `select pro_expires_at, pro_started_at from public.master_profiles where master_id = $1`,
    [masterId],
  );
  const expires = proRow.rows[0]?.pro_expires_at;
  const started = proRow.rows[0]?.pro_started_at;
  const planCode = sub.plan.code.toLowerCase();
  const expiresIso = expires ? new Date(expires).toISOString() : sub.currentPeriodEnd;
  const startedIso = started ? new Date(started).toISOString() : sub.currentPeriodStart;

  const pending = await getPendingRequest(masterId);
  if (pending) {
    return { status: 'pending', proExpiresAt: expiresIso, proStartedAt: startedIso, planCode };
  }

  if (planCode === 'pro') {
    const expired = expiresIso ? new Date(expiresIso).getTime() < Date.now() : false;
    return {
      status: expired ? 'expired' : 'active',
      proExpiresAt: expiresIso,
      proStartedAt: startedIso,
      planCode,
    };
  }

  return { status: 'free', proExpiresAt: null, proStartedAt: null, planCode };
}

async function getPendingRequest(masterId: string): Promise<ProManualPaymentRequestDto | null> {
  const r = await query<RequestRow>(
    `select ${REQUEST_COLUMNS}
       from public.pro_manual_payment_requests
      where master_id = $1 and status = 'pending'
      order by created_at desc
      limit 1`,
    [masterId],
  );
  return r.rows[0] ? mapRow(r.rows[0]) : null;
}

export type ProManualPaymentCabinetState = {
  pendingRequest: ProManualPaymentRequestDto | null;
  lastResolvedRequest: ProManualPaymentRequestDto | null;
  requestHistory: ProManualPaymentRequestDto[];
  canSubmitNew: boolean;
  tariffAmount: number;
  currency: string;
  billingPeriod: 'month' | 'year';
  paymentConfig: ManualPaymentConfigForMasterDto;
  subscriptionMockAllowed: boolean;
  proStatus: MasterProCabinetStatus;
  proExpiresAt: string | null;
  proStartedAt: string | null;
  planCode: string;
};

async function listMasterRequestHistory(masterId: string, limit = 10): Promise<ProManualPaymentRequestDto[]> {
  const r = await query<RequestRow>(
    `select ${REQUEST_COLUMNS}
       from public.pro_manual_payment_requests
      where master_id = $1
      order by created_at desc
      limit $2`,
    [masterId, limit],
  );
  return r.rows.map(mapRow);
}

export async function getProManualPaymentCabinetState(
  masterId: string,
  billingPeriod: 'month' | 'year' = 'month',
): Promise<ProManualPaymentCabinetState> {
  const paymentConfig = await getManualPaymentConfigForMaster(masterId);
  const proMeta = await resolveMasterProCabinetStatus(masterId);
  const history = await listMasterRequestHistory(masterId);
  const pending = history.find((x) => x.status === 'pending') ?? null;
  const lastResolved =
    history.find((x) => x.status === 'rejected' || x.status === 'approved' || x.status === 'cancelled') ?? null;
  const tariffAmount = await getProTariffAmount(billingPeriod);

  return {
    pendingRequest: pending,
    lastResolvedRequest: lastResolved,
    requestHistory: history,
    canSubmitNew: !pending && isManualPaymentConfigured(),
    tariffAmount,
    currency: paymentConfig.currency,
    billingPeriod,
    paymentConfig,
    subscriptionMockAllowed: isSubscriptionMockSwitchAllowed(),
    proStatus: proMeta.status,
    proExpiresAt: proMeta.proExpiresAt,
    proStartedAt: proMeta.proStartedAt,
    planCode: proMeta.planCode,
  };
}

export async function listProManualPaymentRequestsForMaster(
  masterId: string,
): Promise<{
  requests: ProManualPaymentRequestDto[];
  proStatus: MasterProCabinetStatus;
  proExpiresAt: string | null;
  proStartedAt: string | null;
  planCode: string;
}> {
  const proMeta = await resolveMasterProCabinetStatus(masterId);
  return {
    requests: await listMasterRequestHistory(masterId, 50),
    proStatus: proMeta.status,
    proExpiresAt: proMeta.proExpiresAt,
    proStartedAt: proMeta.proStartedAt,
    planCode: proMeta.planCode,
  };
}

export async function createProManualPaymentRequest(
  masterId: string,
  body: {
    payerFullName: string;
    declaredPaidAmount: number;
    billingPeriod: 'month' | 'year';
    paidAt: string;
    paymentComment: string;
    receiptUrl?: string | null;
    receiptFilePath?: string | null;
    confirmationChecked: boolean;
  },
): Promise<ProManualPaymentRequestDto> {
  if (!body.confirmationChecked) {
    throw ApiError.badRequest('Подтвердите отправку заявки', 'validation_error');
  }

  if (!isManualPaymentConfigured()) {
    throw ApiError.serviceUnavailable(
      'Реквизиты для оплаты временно недоступны',
      'MANUAL_PAYMENT_NOT_CONFIGURED',
    );
  }

  const pending = await getPendingRequest(masterId);
  if (pending) {
    throw ApiError.badRequest('У вас уже есть заявка на проверке', 'pro_payment_pending_exists');
  }

  const payerFullName = body.payerFullName.trim();
  if (payerFullName.length < 2) {
    throw ApiError.badRequest('Укажите ФИО плательщика', 'validation_error');
  }

  const tariffAmount = await getProTariffAmount(body.billingPeriod);
  if (!Number.isFinite(body.declaredPaidAmount) || body.declaredPaidAmount <= 0) {
    throw ApiError.badRequest('Укажите сумму перевода', 'validation_error');
  }

  const paymentComment = body.paymentComment.trim();
  if (paymentComment.length < 5) {
    throw ApiError.badRequest('Добавьте комментарий к оплате (не короче 5 символов)', 'validation_error');
  }

  const paidAt = body.paidAt.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) {
    throw ApiError.badRequest('Укажите дату оплаты', 'validation_error');
  }

  const receiptUrl = body.receiptUrl?.trim() || null;
  const receiptFilePath = body.receiptFilePath?.trim() || null;

  const ins = await query<RequestRow>(
    `insert into public.pro_manual_payment_requests (
       master_id, profile_id, plan_code, payer_full_name, tariff_amount, declared_paid_amount, currency,
       billing_period, paid_at, payment_comment, receipt_url, receipt_file_path, status, fee_covered_by
     ) values ($1, $1, 'pro', $2, $3, $4, 'BYN', $5::public.billing_period, $6::date, $7, $8, $9, 'pending', 'slotty')
     returning ${REQUEST_COLUMNS}`,
    [
      masterId,
      payerFullName,
      tariffAmount,
      body.declaredPaidAmount,
      body.billingPeriod,
      paidAt,
      paymentComment,
      receiptUrl,
      receiptFilePath,
    ],
  );
  return mapRow(ins.rows[0]!);
}

export type ProManualPaymentAdminRow = ProManualPaymentRequestDto & {
  masterId: string;
  masterName: string;
  profileUrl: string;
};

export async function listProManualPaymentRequestsForAdmin(
  status: 'all' | ProManualPaymentStatus = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<{
  requests: ProManualPaymentAdminRow[];
  total: number;
  limit: number;
  offset: number;
}> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (status !== 'all') {
    conditions.push(`r.status = $${i++}`);
    vals.push(status);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.pro_manual_payment_requests r ${where}`,
    vals,
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const listR = await query<RequestRow & { display_name: string; slug: string | null }>(
    `select r.id, r.master_id, r.payer_full_name, r.tariff_amount::text, r.declared_paid_amount::text,
            r.received_amount::text, r.bank_fee_amount::text, r.fee_covered_by, r.currency,
            r.billing_period::text as billing_period, r.paid_at, r.payment_comment, r.receipt_url,
            r.receipt_file_path, r.status, r.admin_note, r.rejection_reason, r.tax_receipt_created, r.tax_receipt_note,
            r.created_at, r.reviewed_at,
            mp.display_name, mp.slug
       from public.pro_manual_payment_requests r
       join public.master_profiles mp on mp.master_id = r.master_id
      ${where}
      order by r.created_at desc
      limit $${i++} offset $${i++}`,
    [...vals, limit, offset],
  );

  const requests: ProManualPaymentAdminRow[] = listR.rows.map((row) => ({
    ...mapRow(row),
    masterId: row.master_id,
    masterName: row.display_name,
    profileUrl: buildMasterPublicProfileUrl(row.master_id, row.slug),
  }));

  return { requests, total, limit, offset };
}

function computeBankFee(tariffAmount: number, receivedAmount: number | null): number | null {
  if (receivedAmount == null) return null;
  const diff = tariffAmount - receivedAmount;
  return diff > 0 ? Math.round(diff * 100) / 100 : null;
}

export async function approveProManualPaymentRequest(
  requestId: string,
  adminUserId: string,
  params: {
    receivedAmount?: number | null;
    adminNote?: string | null;
    taxReceiptCreated?: boolean;
    taxReceiptNote?: string | null;
    durationDays?: number;
  },
): Promise<void> {
  const r = await query<RequestRow & { display_name: string }>(
    `select r.id, r.master_id, r.payer_full_name, r.tariff_amount::text, r.declared_paid_amount::text,
            r.received_amount::text, r.bank_fee_amount::text, r.fee_covered_by, r.currency,
            r.billing_period::text as billing_period, r.paid_at, r.payment_comment, r.receipt_url,
            r.receipt_file_path, r.status, r.admin_note, r.rejection_reason, r.tax_receipt_created, r.tax_receipt_note,
            r.created_at, r.reviewed_at, mp.display_name
       from public.pro_manual_payment_requests r
       join public.master_profiles mp on mp.master_id = r.master_id
      where r.id = $1`,
    [requestId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Request not found');
  if (row.status !== 'pending') {
    throw ApiError.badRequest('Заявка уже обработана', 'BAD_STATUS');
  }

  const tariffAmount = Number(row.tariff_amount);
  let receivedAmount: number | null = null;
  if (params.receivedAmount != null) {
    if (!Number.isFinite(params.receivedAmount) || params.receivedAmount <= 0) {
      throw ApiError.badRequest('Укажите корректную сумму поступления', 'validation_error');
    }
    receivedAmount = Math.round(params.receivedAmount * 100) / 100;
  }

  const bankFeeAmount = computeBankFee(tariffAmount, receivedAmount);
  const adminNote = params.adminNote?.trim() || null;
  const taxReceiptCreated = params.taxReceiptCreated === true;
  const taxReceiptNote = params.taxReceiptNote?.trim() || null;

  await query(
    `update public.pro_manual_payment_requests
        set status = 'approved',
            received_amount = $2,
            bank_fee_amount = $3,
            fee_covered_by = 'slotty',
            admin_note = coalesce($4, admin_note),
            tax_receipt_created = $5,
            tax_receipt_note = $6,
            reviewed_at = now(),
            reviewed_by = $7,
            updated_at = now()
      where id = $1`,
    [requestId, receivedAmount, bankFeeAmount, adminNote, taxReceiptCreated, taxReceiptNote, adminUserId],
  );

  const billingPeriod = row.billing_period === 'year' ? 'year' : 'month';
  const billedAmount = receivedAmount ?? tariffAmount;
  const durationDays = Math.min(Math.max(params.durationDays ?? 30, 1), 366);

  await activateMasterProFromManualPayment(row.master_id, billingPeriod, {
    amount: billedAmount,
    durationDays,
    metadata: {
      proManualPaymentRequestId: requestId,
      tariffAmount,
      declaredPaidAmount: Number(row.declared_paid_amount),
      receivedAmount,
      bankFeeAmount,
      feeCoveredBy: 'slotty',
      payerFullName: row.payer_full_name,
    },
  });

  await writeAdminAuditLog({
    adminUserId,
    action: 'pro_manual_payment_approved',
    entityType: 'pro_manual_payment_request',
    entityId: requestId,
    targetUserId: row.master_id,
    reason: adminNote,
    metadata: {
      masterName: row.display_name,
      tariffAmount,
      declaredPaidAmount: Number(row.declared_paid_amount),
      receivedAmount,
      bankFeeAmount,
      taxReceiptCreated,
    },
  });
}

export async function rejectProManualPaymentRequest(
  requestId: string,
  adminUserId: string,
  params: { rejectionReason: string; adminNote?: string | null },
): Promise<void> {
  const reason = params.rejectionReason.trim();
  if (reason.length < 5) {
    throw ApiError.badRequest('Укажите причину отказа (не короче 5 символов)', 'validation_error');
  }

  const r = await query<RequestRow & { display_name: string }>(
    `select r.id, r.master_id, r.payer_full_name, r.tariff_amount::text, r.declared_paid_amount::text,
            r.received_amount::text, r.bank_fee_amount::text, r.fee_covered_by, r.currency,
            r.billing_period::text as billing_period, r.paid_at, r.payment_comment, r.receipt_url,
            r.receipt_file_path, r.status, r.admin_note, r.rejection_reason, r.tax_receipt_created, r.tax_receipt_note,
            r.created_at, r.reviewed_at, mp.display_name
       from public.pro_manual_payment_requests r
       join public.master_profiles mp on mp.master_id = r.master_id
      where r.id = $1`,
    [requestId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Request not found');
  if (row.status !== 'pending') {
    throw ApiError.badRequest('Заявка уже обработана', 'BAD_STATUS');
  }

  const adminNote = params.adminNote?.trim() || null;

  await query(
    `update public.pro_manual_payment_requests
        set status = 'rejected',
            rejection_reason = $2,
            admin_note = coalesce($3, admin_note),
            reviewed_at = now(),
            reviewed_by = $4,
            updated_at = now()
      where id = $1`,
    [requestId, reason, adminNote, adminUserId],
  );

  await writeAdminAuditLog({
    adminUserId,
    action: 'pro_manual_payment_rejected',
    entityType: 'pro_manual_payment_request',
    entityId: requestId,
    targetUserId: row.master_id,
    reason,
    metadata: {
      masterName: row.display_name,
      tariffAmount: Number(row.tariff_amount),
      declaredPaidAmount: Number(row.declared_paid_amount),
    },
  });
}
