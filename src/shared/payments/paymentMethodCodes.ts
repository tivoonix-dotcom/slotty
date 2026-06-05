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

export function needsPreferredBanks(labels: string[]): boolean {
  const codes = paymentLabelsToCodes(labels);
  return codes.includes('card') || codes.includes('transfer');
}

export type MasterPublicPaymentDto = {
  methods: PaymentMethodCode[];
  prepaymentRequired: boolean;
  preferredBankIds: string[];
  comment: string | null;
};

export type MasterPaymentSettingsDto = {
  paymentMethods: PaymentMethodCode[];
  prepaymentRequired: boolean;
  preferredBankIds: string[];
  paymentComment: string | null;
  warning?: string;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodCode, string> = {
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
  online_later: 'Онлайн позже',
};

export const PREPAYMENT_LABEL = {
  required: 'Требуется',
  notRequired: 'Не требуется',
} as const;
