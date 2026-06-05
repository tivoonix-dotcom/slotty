import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  buildPublicPaymentPayload,
  filterValidBankIds,
  needsPreferredBanks,
  paymentCodesToLabels,
  paymentLabelsToCodes,
  sanitizePreferredBankIds,
  type MasterPaymentSettingsDto,
  type PaymentMethodCode,
  PAYMENT_METHOD_CODES,
} from '../../lib/belarusBanks.js';
import {
  decodePaymentNote,
  listMasterPaymentMethodNames,
  patchMyBookingRules,
} from './masterTrustProfile.service.js';

export type { MasterPaymentSettingsDto };

export type MasterPaymentSettingsResponse = MasterPaymentSettingsDto & {
  warning?: string;
};

type BookingRulesPaymentRow = {
  prepayment_required: boolean;
  payment_note: string | null;
  preferred_bank_ids: string[] | null;
};

async function loadBookingRulesPaymentRow(masterId: string): Promise<BookingRulesPaymentRow | null> {
  const r = await query<BookingRulesPaymentRow>(
    `select prepayment_required, payment_note, preferred_bank_ids
       from public.master_booking_rules
      where master_id = $1`,
    [masterId],
  );
  return r.rows[0] ?? null;
}

async function resolvePaymentMethodLabels(masterId: string): Promise<string[]> {
  const fromDb = await listMasterPaymentMethodNames(masterId);
  if (fromDb.length) return fromDb;
  const row = await loadBookingRulesPaymentRow(masterId);
  if (!row) return [];
  return decodePaymentNote(row.payment_note).paymentMethods;
}

export async function getMyPaymentSettings(masterId: string): Promise<MasterPaymentSettingsDto> {
  const [row, labels] = await Promise.all([
    loadBookingRulesPaymentRow(masterId),
    resolvePaymentMethodLabels(masterId),
  ]);
  const methodCodes = paymentLabelsToCodes(labels);
  const paymentComment = row ? decodePaymentNote(row.payment_note).paymentNote || null : null;
  const rawBankIds = row?.preferred_bank_ids ?? [];
  return {
    paymentMethods: methodCodes,
    prepaymentRequired: false,
    preferredBankIds: sanitizePreferredBankIds(methodCodes, rawBankIds),
    paymentComment,
  };
}

export type PatchMasterPaymentSettingsBody = {
  paymentMethods?: PaymentMethodCode[];
  prepaymentRequired?: boolean;
  preferredBankIds?: string[];
  paymentComment?: string | null;
};

export function validatePatchPaymentSettings(body: PatchMasterPaymentSettingsBody): void {
  if (body.paymentMethods != null) {
    for (const code of body.paymentMethods) {
      if (!PAYMENT_METHOD_CODES.includes(code)) {
        throw ApiError.badRequest(`Неизвестный способ оплаты: ${code}`);
      }
    }
  }
  if (body.preferredBankIds != null) {
    const invalid = body.preferredBankIds.filter((id) => !filterValidBankIds([id]).length);
    if (invalid.length) {
      throw ApiError.badRequest(`Неизвестный банк: ${invalid[0]}`);
    }
  }
  if (typeof body.paymentComment === 'string' && body.paymentComment.length > 2000) {
    throw ApiError.badRequest('paymentComment too long');
  }
}

export async function patchMyPaymentSettings(
  masterId: string,
  body: PatchMasterPaymentSettingsBody,
): Promise<MasterPaymentSettingsResponse> {
  validatePatchPaymentSettings(body);
  const current = await getMyPaymentSettings(masterId);
  const nextMethods = body.paymentMethods ?? current.paymentMethods;
  const nextPrepayment = false;
  const nextComment =
    body.paymentComment !== undefined ? body.paymentComment : current.paymentComment;
  const nextBankIds = sanitizePreferredBankIds(
    nextMethods,
    body.preferredBankIds !== undefined ? body.preferredBankIds : current.preferredBankIds,
  );

  await query(
    `insert into public.master_booking_rules (master_id, prepayment_required, payment_note, preferred_bank_ids)
     values ($1, $2, $3, $4)
     on conflict (master_id) do update set
       prepayment_required = excluded.prepayment_required,
       payment_note = excluded.payment_note,
       preferred_bank_ids = excluded.preferred_bank_ids,
       updated_at = now()`,
    [masterId, nextPrepayment, nextComment, nextBankIds],
  );

  await patchMyBookingRules(masterId, {
    paymentMethods: paymentCodesToLabels(nextMethods),
    paymentNote: nextComment,
  });

  const saved = await getMyPaymentSettings(masterId);
  const warning =
    needsPreferredBanks(saved.paymentMethods) && saved.preferredBankIds.length === 0
      ? 'Можно сохранить без банков, но клиенту будет понятнее, если выбрать 1–3 удобных банка.'
      : undefined;
  return warning ? { ...saved, warning } : saved;
}

export async function getPublicMasterPayment(masterId: string) {
  const settings = await getMyPaymentSettings(masterId);
  if (!settings.paymentMethods.length && !settings.paymentComment && !settings.prepaymentRequired) {
    return null;
  }
  return buildPublicPaymentPayload(settings);
}

export async function readPreferredBankIds(masterId: string): Promise<string[]> {
  const settings = await getMyPaymentSettings(masterId);
  return settings.preferredBankIds;
}
