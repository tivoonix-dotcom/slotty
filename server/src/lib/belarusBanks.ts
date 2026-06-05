/** Справочник банков Беларуси для валидации на сервере (синхронизирован с src/shared/payments/belarusBanks.ts). */

export const BELARUS_BANK_IDS = new Set([
  'belarusbank',
  'belagroprombank',
  'belinvestbank',
  'priorbank',
  'belveb',
  'paritetbank',
  'bnb',
  'belgazprombank',
  'rrb',
  'mtbank',
  'technobank',
  'reshenie',
  'vtb',
  'alfabank',
  'dabrabyt',
  'statusbank',
  'neo',
  'bsb',
  'tkbank',
  'sber',
]);

export const PAYMENT_METHOD_CODES = ['cash', 'card', 'transfer', 'online_later'] as const;
export type PaymentMethodCode = (typeof PAYMENT_METHOD_CODES)[number];

export const PAYMENT_CODE_TO_LABEL: Record<PaymentMethodCode, string> = {
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
  online_later: 'Онлайн позже',
};

export const PAYMENT_LABEL_TO_CODE: Record<string, PaymentMethodCode> = {
  Наличные: 'cash',
  Карта: 'card',
  Перевод: 'transfer',
  'Онлайн позже': 'online_later',
};

export function filterValidBankIds(ids: string[] | undefined | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids ?? []) {
    if (!BELARUS_BANK_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function paymentLabelsToCodes(labels: string[]): PaymentMethodCode[] {
  const out: PaymentMethodCode[] = [];
  const seen = new Set<PaymentMethodCode>();
  for (const label of labels) {
    const code = PAYMENT_LABEL_TO_CODE[label.trim()];
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

export function paymentCodesToLabels(codes: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const code of codes) {
    const label = PAYMENT_CODE_TO_LABEL[code as PaymentMethodCode];
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}

export function needsPreferredBanks(methodCodes: string[]): boolean {
  return methodCodes.includes('card') || methodCodes.includes('transfer');
}

export function sanitizePreferredBankIds(
  methodCodes: string[],
  bankIds: string[] | undefined | null,
): string[] {
  if (!needsPreferredBanks(methodCodes)) return [];
  return filterValidBankIds(bankIds);
}

export type MasterPaymentSettingsDto = {
  paymentMethods: PaymentMethodCode[];
  prepaymentRequired: boolean;
  preferredBankIds: string[];
  paymentComment: string | null;
};

export function buildPublicPaymentPayload(settings: MasterPaymentSettingsDto): {
  methods: PaymentMethodCode[];
  prepaymentRequired: boolean;
  preferredBankIds: string[];
  comment: string | null;
} {
  return {
    methods: settings.paymentMethods,
    prepaymentRequired: false,
    preferredBankIds: settings.preferredBankIds,
    comment: settings.paymentComment,
  };
}
