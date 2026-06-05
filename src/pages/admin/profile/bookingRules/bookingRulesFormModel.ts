import type { StructuredBookingRulesDto } from '../../../../features/admin/api/adminProfileApi';

export type BookingRulesFormState = Omit<
  StructuredBookingRulesDto,
  'clientPreview' | 'bookingRules' | 'cancellationPolicy' | 'paymentNote' | 'updatedAt'
>;

export function formFromDto(dto: StructuredBookingRulesDto): BookingRulesFormState {
  return {
    minBookingNoticeMinutes: dto.minBookingNoticeMinutes,
    requiresMasterConfirmation: dto.requiresMasterConfirmation,
    freeCancelBeforeMinutes: dto.freeCancelBeforeMinutes,
    lateCancelPolicy: dto.lateCancelPolicy,
    allowedLatenessMinutes: dto.allowedLatenessMinutes,
    lateArrivalPolicy: dto.lateArrivalPolicy,
    noShowAfterMinutes: dto.noShowAfterMinutes,
    noShowPolicy: dto.noShowPolicy,
    rescheduleEnabled: dto.rescheduleEnabled,
    rescheduleBeforeMinutes: dto.rescheduleBeforeMinutes,
    rescheduleLimit: dto.rescheduleLimit,
    paymentMethods: [...dto.paymentMethods],
    preferredBankIds: [...(dto.preferredBankIds ?? [])],
    paymentComment: dto.paymentComment,
    prepaymentRequired: false,
    refundPolicyEnabled: dto.refundPolicyEnabled,
    refundPolicyText: dto.refundPolicyText,
    visitPreparationText: dto.visitPreparationText,
    contraindicationsText: dto.contraindicationsText,
    completionScore: dto.completionScore,
  };
}

export function formFingerprint(form: BookingRulesFormState): string {
  return JSON.stringify(form);
}

export function formatMinutesRu(m: number): string {
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

export function formatBookingNoticeLabel(minutes: number): string {
  if (minutes <= 0) return 'в любое время';
  return `минимум за ${formatMinutesRu(minutes)}`;
}

export const MIN_NOTICE_OPTIONS = [
  { value: 0, label: 'В любое время' },
  { value: 30, label: '30 минут' },
  { value: 60, label: '1 час' },
  { value: 120, label: '2 часа' },
  { value: 720, label: '12 часов' },
  { value: 1440, label: '24 часа' },
] as const;

export const FREE_CANCEL_OPTIONS = [
  { value: 0, label: 'В любое время' },
  { value: 60, label: 'За 1 час' },
  { value: 120, label: 'За 2 часа' },
  { value: 720, label: 'За 12 часов' },
  { value: 1440, label: 'За 24 часа' },
] as const;

export const LATENESS_OPTIONS = [
  { value: 5, label: '5 минут' },
  { value: 10, label: '10 минут' },
  { value: 15, label: '15 минут' },
  { value: 20, label: '20 минут' },
] as const;

export const NO_SHOW_OPTIONS = [
  { value: 10, label: '10 минут' },
  { value: 15, label: '15 минут' },
  { value: 20, label: '20 минут' },
  { value: 30, label: '30 минут' },
] as const;

export const RESCHEDULE_BEFORE_OPTIONS = [
  { value: 120, label: 'За 2 часа' },
  { value: 720, label: 'За 12 часов' },
  { value: 1440, label: 'За 24 часа' },
] as const;

export const RESCHEDULE_LIMIT_OPTIONS = [
  { value: 1, label: '1 раз' },
  { value: 2, label: '2 раза' },
  { value: null, label: 'Без ограничения' },
] as const;

export const LATE_CANCEL_LABELS: Record<BookingRulesFormState['lateCancelPolicy'], string> = {
  mark_late: 'Отметить как поздняя отмена',
  require_agreement: 'Требуется согласование с мастером',
  warning_only: 'Только предупреждение',
};

export const LATE_ARRIVAL_LABELS: Record<BookingRulesFormState['lateArrivalPolicy'], string> = {
  master_can_cancel: 'Мастер может отменить запись',
  shorten_visit: 'Визит может быть сокращён',
  reschedule_by_agreement: 'Перенос по договорённости',
};

export const NO_SHOW_POLICY_LABELS: Record<BookingRulesFormState['noShowPolicy'], string> = {
  mark_no_show: 'Запись отмечается как «Клиент не пришёл»',
  client_can_dispute: 'Клиент может оспорить',
};

export function buildSummaryItems(form: BookingRulesFormState) {
  return [
    { label: 'Минимум до записи', value: formatMinutesRu(form.minBookingNoticeMinutes) },
    { label: 'Бесплатная отмена', value: formatMinutesRu(form.freeCancelBeforeMinutes) },
    { label: 'Опоздание', value: `до ${formatMinutesRu(form.allowedLatenessMinutes)}` },
    {
      label: 'Оплата',
      value: form.paymentMethods.length ? form.paymentMethods.join(', ') : '',
    },
    { label: 'Правила заполнены', value: `${form.completionScore}%` },
  ];
}

export function buildClientPreviewLines(form: BookingRulesFormState): string[] {
  const lines: string[] = [];
  lines.push(`Запись: ${formatBookingNoticeLabel(form.minBookingNoticeMinutes)}`);
  lines.push(`Отмена: бесплатно за ${formatMinutesRu(form.freeCancelBeforeMinutes)}`);
  lines.push(`Опоздание: до ${formatMinutesRu(form.allowedLatenessMinutes)}`);
  lines.push(`Неявка: через ${formatMinutesRu(form.noShowAfterMinutes)}`);
  if (form.paymentMethods.length) lines.push(`Оплата: ${form.paymentMethods.join(', ')}`);
  const prep = form.visitPreparationText?.trim() || form.contraindicationsText?.trim();
  if (prep) lines.push(`Подготовка: ${prep.slice(0, 72)}${prep.length > 72 ? '…' : ''}`);
  return lines;
}

export function cardClientText(form: BookingRulesFormState) {
  return {
    booking:
      form.minBookingNoticeMinutes <= 0
        ? `Запись доступна в любое время.${
            form.requiresMasterConfirmation
              ? ' Заявка требует подтверждения мастера.'
              : ' Запись подтверждается автоматически.'
          }`
        : `Записывайтесь ${formatBookingNoticeLabel(form.minBookingNoticeMinutes)}.${
            form.requiresMasterConfirmation
              ? ' Заявка требует подтверждения мастера.'
              : ' Запись подтверждается автоматически.'
          }`,
    cancel: `Отмена бесплатна за ${formatMinutesRu(form.freeCancelBeforeMinutes)} до визита.`,
    lateness: 'Если опаздываете, нажмите «Я опаздываю» в записи.',
    noShow: `Неявка фиксируется через ${formatMinutesRu(form.noShowAfterMinutes)} после начала.`,
    reschedule: form.rescheduleEnabled
      ? `Перенос за ${formatMinutesRu(form.rescheduleBeforeMinutes)}${
          form.rescheduleLimit == null ? ', без ограничений' : `, до ${form.rescheduleLimit} раз`
        }.`
      : 'Перенос записи недоступен.',
    payment: form.paymentComment?.trim() || 'Оплата после оказания услуги.',
    refund: form.refundPolicyText?.trim() || 'Возврат по условиям мастера.',
    preparation:
      form.contraindicationsText?.trim() ||
      form.visitPreparationText?.trim() ||
      'Если есть аллергия или противопоказания — предупредите мастера заранее.',
  };
}

export function refundsCardEnabled(form: BookingRulesFormState): boolean {
  return form.paymentMethods.some((m: string) => /онлайн/i.test(m));
}

export const DEFAULT_FORM: BookingRulesFormState = {
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
};
