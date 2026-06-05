import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { paymentLabelsToCodes, sanitizePreferredBankIds } from '../../lib/belarusBanks.js';
import {
  decodePaymentNote,
  listMasterPaymentMethodNames,
} from './masterTrustProfile.service.js';

export type LateCancelPolicy = 'mark_late' | 'require_agreement' | 'warning_only';
export type LateArrivalPolicy = 'master_can_cancel' | 'shorten_visit' | 'reschedule_by_agreement';
export type NoShowPolicy = 'mark_no_show' | 'client_can_dispute';

export type MasterBookingRulesStructured = {
  minBookingNoticeMinutes: number;
  requiresMasterConfirmation: boolean;
  freeCancelBeforeMinutes: number;
  lateCancelPolicy: LateCancelPolicy;
  allowedLatenessMinutes: number;
  lateArrivalPolicy: LateArrivalPolicy;
  noShowAfterMinutes: number;
  noShowPolicy: NoShowPolicy;
  rescheduleEnabled: boolean;
  rescheduleBeforeMinutes: number;
  rescheduleLimit: number | null;
  paymentMethods: string[];
  preferredBankIds: string[];
  paymentComment: string | null;
  prepaymentRequired: boolean;
  refundPolicyEnabled: boolean;
  refundPolicyText: string | null;
  visitPreparationText: string | null;
  contraindicationsText: string | null;
  completionScore: number;
  updatedAt: string | null;
};

export type MasterBookingRulesResponse = MasterBookingRulesStructured & {
  bookingRules: string | null;
  cancellationPolicy: string | null;
  paymentNote: string | null;
  clientPreview: string[];
};

const DEFAULT: MasterBookingRulesStructured = {
  minBookingNoticeMinutes: 0,
  requiresMasterConfirmation: true,
  freeCancelBeforeMinutes: 720,
  lateCancelPolicy: 'mark_late',
  allowedLatenessMinutes: 15,
  lateArrivalPolicy: 'master_can_cancel',
  noShowAfterMinutes: 15,
  noShowPolicy: 'client_can_dispute',
  rescheduleEnabled: true,
  rescheduleBeforeMinutes: 720,
  rescheduleLimit: 2,
  paymentMethods: ['Наличные', 'Карта'],
  preferredBankIds: [],
  paymentComment: null,
  prepaymentRequired: false,
  refundPolicyEnabled: false,
  refundPolicyText: null,
  visitPreparationText: null,
  contraindicationsText: null,
  completionScore: 0,
  updatedAt: null,
};

type DbRow = {
  min_booking_notice_minutes: number;
  requires_master_confirmation: boolean;
  free_cancel_before_minutes: number;
  late_cancel_policy: string;
  allowed_lateness_minutes: number;
  late_arrival_policy: string;
  no_show_after_minutes: number;
  no_show_policy: string;
  reschedule_enabled: boolean;
  reschedule_before_minutes: number;
  reschedule_limit: number | null;
  prepayment_required: boolean;
  refund_policy_enabled: boolean;
  refund_policy_text: string | null;
  visit_preparation_text: string | null;
  contraindications_text: string | null;
  completion_score: number;
  booking_rules: string | null;
  cancellation_policy: string | null;
  payment_note: string | null;
  preferred_bank_ids: string[] | null;
  updated_at: Date | string | null;
};

function formatMinutesRu(m: number): string {
  if (m <= 0) return 'в любое время';
  if (m < 60) return `${m} мин`;
  if (m % 60 === 0) {
    const h = m / 60;
    if (h < 24) return `${h} ч`;
    const d = h / 24;
    return Number.isInteger(d) ? `${d} сут` : `${h} ч`;
  }
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return `${h} ч ${rest} мин`;
}

function formatBookingNoticeLabel(minutes: number): string {
  if (minutes <= 0) return 'в любое время';
  return `минимум за ${formatMinutesRu(minutes)}`;
}

export function computeCompletionScore(rules: MasterBookingRulesStructured): number {
  let score = 0;
  if (rules.minBookingNoticeMinutes >= 0) score += 12;
  if (rules.freeCancelBeforeMinutes >= 0) score += 12;
  if (rules.allowedLatenessMinutes >= 0) score += 10;
  if (rules.noShowAfterMinutes >= 0) score += 10;
  if (rules.paymentMethods.length > 0) score += 16;
  if (rules.paymentComment?.trim() || rules.prepaymentRequired) score += 8;
  if (rules.visitPreparationText?.trim() || rules.contraindicationsText?.trim()) score += 12;
  if (rules.rescheduleEnabled !== undefined) score += 10;
  if (!rules.prepaymentRequired || rules.refundPolicyText?.trim()) score += 10;
  return Math.min(100, score);
}

export function buildClientPreviewLines(rules: MasterBookingRulesStructured): string[] {
  const lines: string[] = [];
  lines.push(`Запись: ${formatBookingNoticeLabel(rules.minBookingNoticeMinutes)}`);
  if (rules.requiresMasterConfirmation) {
    lines.push('Подтверждение: заявка мастера');
  }
  lines.push(`Отмена: бесплатно за ${formatMinutesRu(rules.freeCancelBeforeMinutes)}`);
  lines.push(`Опоздание: до ${formatMinutesRu(rules.allowedLatenessMinutes)}`);
  lines.push(`Неявка: через ${formatMinutesRu(rules.noShowAfterMinutes)}`);
  if (rules.paymentMethods.length) {
    lines.push(`Оплата: ${rules.paymentMethods.join(', ')}`);
  }
  if (rules.rescheduleEnabled) {
    const limit =
      rules.rescheduleLimit == null ? 'без ограничений' : `${rules.rescheduleLimit} раз`;
    lines.push(`Перенос: за ${formatMinutesRu(rules.rescheduleBeforeMinutes)}, ${limit}`);
  } else {
    lines.push('Перенос: не доступен');
  }
  const prep = rules.visitPreparationText?.trim() || rules.contraindicationsText?.trim();
  if (prep) lines.push(`Подготовка: ${prep.slice(0, 80)}${prep.length > 80 ? '…' : ''}`);
  return lines;
}

function buildLegacyBookingText(rules: MasterBookingRulesStructured): string {
  const confirm = rules.requiresMasterConfirmation
    ? 'Заявка требует подтверждения мастера.'
    : 'Запись подтверждается автоматически.';
  return rules.minBookingNoticeMinutes <= 0
    ? `${confirm.charAt(0).toUpperCase()}${confirm.slice(1)}`
    : `Записывайтесь ${formatBookingNoticeLabel(rules.minBookingNoticeMinutes)}. ${confirm}`;
}

function buildLegacyCancelText(rules: MasterBookingRulesStructured): string {
  return `Отмена бесплатна за ${formatMinutesRu(rules.freeCancelBeforeMinutes)} до визита.`;
}

function mapRow(row: DbRow, paymentMethods: string[]): MasterBookingRulesStructured {
  const methodCodes = paymentLabelsToCodes(paymentMethods);
  const preferredBankIds = sanitizePreferredBankIds(methodCodes, row.preferred_bank_ids ?? []);
  return {
    minBookingNoticeMinutes: row.min_booking_notice_minutes,
    requiresMasterConfirmation: row.requires_master_confirmation,
    freeCancelBeforeMinutes: row.free_cancel_before_minutes,
    lateCancelPolicy: row.late_cancel_policy as LateCancelPolicy,
    allowedLatenessMinutes: row.allowed_lateness_minutes,
    lateArrivalPolicy: row.late_arrival_policy as LateArrivalPolicy,
    noShowAfterMinutes: row.no_show_after_minutes,
    noShowPolicy: row.no_show_policy as NoShowPolicy,
    rescheduleEnabled: row.reschedule_enabled,
    rescheduleBeforeMinutes: row.reschedule_before_minutes,
    rescheduleLimit: row.reschedule_limit,
    paymentMethods,
    preferredBankIds,
    paymentComment: decodePaymentNote(row.payment_note).paymentNote || null,
    prepaymentRequired: row.prepayment_required,
    refundPolicyEnabled: row.refund_policy_enabled,
    refundPolicyText: row.refund_policy_text,
    visitPreparationText: row.visit_preparation_text,
    contraindicationsText: row.contraindications_text,
    completionScore: row.completion_score,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

const SELECT_COLS = `
  min_booking_notice_minutes, requires_master_confirmation, free_cancel_before_minutes,
  late_cancel_policy, allowed_lateness_minutes, late_arrival_policy,
  no_show_after_minutes, no_show_policy, reschedule_enabled, reschedule_before_minutes,
  reschedule_limit, prepayment_required, refund_policy_enabled, refund_policy_text,
  visit_preparation_text, contraindications_text, completion_score,
  booking_rules, cancellation_policy, payment_note, preferred_bank_ids, updated_at
`;

async function ensureRow(masterId: string): Promise<DbRow> {
  const existing = await query<DbRow>(
    `select ${SELECT_COLS} from public.master_booking_rules where master_id = $1`,
    [masterId],
  );
  if (existing.rows[0]) return existing.rows[0];

  const score = computeCompletionScore(DEFAULT);
  await query(
    `insert into public.master_booking_rules (
       master_id, booking_rules, cancellation_policy, payment_note,
       min_booking_notice_minutes, requires_master_confirmation, free_cancel_before_minutes,
       late_cancel_policy, allowed_lateness_minutes, late_arrival_policy,
       no_show_after_minutes, no_show_policy, reschedule_enabled, reschedule_before_minutes,
       reschedule_limit, prepayment_required, refund_policy_enabled, completion_score
     ) values ($1, $2, $3, null, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      masterId,
      buildLegacyBookingText(DEFAULT),
      buildLegacyCancelText(DEFAULT),
      DEFAULT.minBookingNoticeMinutes,
      DEFAULT.requiresMasterConfirmation,
      DEFAULT.freeCancelBeforeMinutes,
      DEFAULT.lateCancelPolicy,
      DEFAULT.allowedLatenessMinutes,
      DEFAULT.lateArrivalPolicy,
      DEFAULT.noShowAfterMinutes,
      DEFAULT.noShowPolicy,
      DEFAULT.rescheduleEnabled,
      DEFAULT.rescheduleBeforeMinutes,
      DEFAULT.rescheduleLimit,
      DEFAULT.prepaymentRequired,
      DEFAULT.refundPolicyEnabled,
      score,
    ],
  );

  const { patchMyBookingRules } = await import('./masterTrustProfile.service.js');
  await patchMyBookingRules(masterId, { paymentMethods: DEFAULT.paymentMethods });

  const created = await query<DbRow>(
    `select ${SELECT_COLS} from public.master_booking_rules where master_id = $1`,
    [masterId],
  );
  return created.rows[0]!;
}

export async function getMasterBookingRulesStructured(masterId: string): Promise<MasterBookingRulesResponse> {
  const row = await ensureRow(masterId);
  const paymentMethods = await listMasterPaymentMethodNames(masterId);
  const structured = mapRow(row, paymentMethods.length ? paymentMethods : DEFAULT.paymentMethods);
  return {
    ...structured,
    bookingRules: row.booking_rules,
    cancellationPolicy: row.cancellation_policy,
    paymentNote: structured.paymentComment,
    clientPreview: buildClientPreviewLines(structured),
  };
}

export type PutMasterBookingRulesBody = Partial<
  Omit<MasterBookingRulesStructured, 'completionScore' | 'updatedAt' | 'paymentMethods' | 'preferredBankIds'>
> & {
  paymentMethods?: string[];
  preferredBankIds?: string[];
};

export function validatePutMasterBookingRules(body: PutMasterBookingRulesBody): void {
  if (body.minBookingNoticeMinutes != null && body.minBookingNoticeMinutes < 0) {
    throw ApiError.badRequest('minBookingNoticeMinutes must be >= 0');
  }
  if (body.freeCancelBeforeMinutes != null && body.freeCancelBeforeMinutes < 0) {
    throw ApiError.badRequest('freeCancelBeforeMinutes must be >= 0');
  }
  if (body.allowedLatenessMinutes != null && body.allowedLatenessMinutes < 0) {
    throw ApiError.badRequest('allowedLatenessMinutes must be >= 0');
  }
  if (body.noShowAfterMinutes != null && body.noShowAfterMinutes < 0) {
    throw ApiError.badRequest('noShowAfterMinutes must be >= 0');
  }
  if (body.rescheduleLimit != null && body.rescheduleLimit < 0) {
    throw ApiError.badRequest('rescheduleLimit must be >= 0');
  }
  const textMax = 2000;
  for (const [k, v] of Object.entries(body)) {
    if (typeof v === 'string' && v.length > textMax) {
      throw ApiError.badRequest(`${k} too long`);
    }
  }
}

export async function putMasterBookingRulesStructured(
  masterId: string,
  body: PutMasterBookingRulesBody,
): Promise<MasterBookingRulesResponse> {
  validatePutMasterBookingRules(body);
  const current = await getMasterBookingRulesStructured(masterId);
  const paymentMethods = body.paymentMethods ?? current.paymentMethods;
  const methodCodes = paymentLabelsToCodes(paymentMethods);
  const preferredBankIds =
    body.preferredBankIds !== undefined
      ? sanitizePreferredBankIds(methodCodes, body.preferredBankIds)
      : sanitizePreferredBankIds(methodCodes, current.preferredBankIds);
  const next: MasterBookingRulesStructured = {
    ...current,
    ...body,
    paymentMethods,
    preferredBankIds,
    paymentComment:
      body.paymentComment !== undefined ? body.paymentComment : current.paymentComment,
  };
  const score = computeCompletionScore(next);
  const legacyBooking = buildLegacyBookingText(next);
  const legacyCancel = buildLegacyCancelText(next);

  await query(
    `update public.master_booking_rules set
       min_booking_notice_minutes = $2,
       requires_master_confirmation = $3,
       free_cancel_before_minutes = $4,
       late_cancel_policy = $5,
       allowed_lateness_minutes = $6,
       late_arrival_policy = $7,
       no_show_after_minutes = $8,
       no_show_policy = $9,
       reschedule_enabled = $10,
       reschedule_before_minutes = $11,
       reschedule_limit = $12,
       prepayment_required = $13,
       refund_policy_enabled = $14,
       refund_policy_text = $15,
       visit_preparation_text = $16,
       contraindications_text = $17,
       completion_score = $18,
       booking_rules = $19,
       cancellation_policy = $20,
       payment_note = $21,
       preferred_bank_ids = $22,
       updated_at = now()
     where master_id = $1`,
    [
      masterId,
      next.minBookingNoticeMinutes,
      next.requiresMasterConfirmation,
      next.freeCancelBeforeMinutes,
      next.lateCancelPolicy,
      next.allowedLatenessMinutes,
      next.lateArrivalPolicy,
      next.noShowAfterMinutes,
      next.noShowPolicy,
      next.rescheduleEnabled,
      next.rescheduleBeforeMinutes,
      next.rescheduleLimit,
      next.prepaymentRequired,
      next.refundPolicyEnabled,
      next.refundPolicyText,
      next.visitPreparationText,
      next.contraindicationsText,
      score,
      legacyBooking,
      legacyCancel,
      next.paymentComment,
      next.preferredBankIds,
    ],
  );

  const { patchMyBookingRules } = await import('./masterTrustProfile.service.js');
  await patchMyBookingRules(masterId, {
    paymentMethods: next.paymentMethods,
    paymentNote: next.paymentComment,
    bookingRules: legacyBooking,
    cancellationPolicy: legacyCancel,
  });

  console.info('[audit] master_booking_rules_updated', { masterId });

  return getMasterBookingRulesStructured(masterId);
}

export async function getPublicMasterBookingRulesSummary(masterId: string): Promise<{
  clientPreview: string[];
  structured: MasterBookingRulesStructured | null;
}> {
  const row = await query<DbRow>(
    `select ${SELECT_COLS} from public.master_booking_rules where master_id = $1`,
    [masterId],
  );
  if (!row.rows[0]) {
    return { clientPreview: [], structured: null };
  }
  const paymentMethods = await listMasterPaymentMethodNames(masterId);
  const structured = mapRow(row.rows[0], paymentMethods.length ? paymentMethods : DEFAULT.paymentMethods);
  return { clientPreview: buildClientPreviewLines(structured), structured };
}

/** Проверка минимального интервала до записи. */
export async function assertBookingNoticeAllowed(masterId: string, slotStart: Date): Promise<void> {
  const rules = await getMasterBookingRulesStructured(masterId);
  const minMs = rules.minBookingNoticeMinutes * 60_000;
  if (minMs <= 0) return;
  const delta = slotStart.getTime() - Date.now();
  if (delta < minMs) {
    throw ApiError.conflict(
      `Запись возможна минимум за ${formatMinutesRu(rules.minBookingNoticeMinutes)}`,
      'BOOKING_TOO_SOON',
    );
  }
}

export async function isLateCancellation(masterId: string, startsAt: Date): Promise<boolean> {
  const rules = await getMasterBookingRulesStructured(masterId);
  const freeMs = rules.freeCancelBeforeMinutes * 60_000;
  if (freeMs <= 0) return false;
  return startsAt.getTime() - Date.now() < freeMs;
}

export async function assertRescheduleAllowed(
  masterId: string,
  startsAt: Date,
  usedReschedules: number,
): Promise<void> {
  const rules = await getMasterBookingRulesStructured(masterId);
  if (!rules.rescheduleEnabled) {
    throw ApiError.conflict('Перенос записи недоступен', 'RESCHEDULE_DISABLED');
  }
  if (rules.rescheduleLimit != null && usedReschedules >= rules.rescheduleLimit) {
    throw ApiError.conflict('Лимит переносов исчерпан', 'RESCHEDULE_LIMIT');
  }
  const beforeMs = rules.rescheduleBeforeMinutes * 60_000;
  if (beforeMs > 0 && startsAt.getTime() - Date.now() < beforeMs) {
    throw ApiError.conflict(
      `Перенос возможен минимум за ${formatMinutesRu(rules.rescheduleBeforeMinutes)}`,
      'RESCHEDULE_TOO_LATE',
    );
  }
}

export async function canMarkNoShow(masterId: string, startsAt: Date): Promise<boolean> {
  const rules = await getMasterBookingRulesStructured(masterId);
  const afterMs = rules.noShowAfterMinutes * 60_000;
  return Date.now() >= startsAt.getTime() + afterMs;
}
