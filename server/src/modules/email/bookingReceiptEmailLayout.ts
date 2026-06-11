import {
  buildSlottyEmailHtml,
  escapeHtml,
  SLOTTY_EMAIL_LOGO_PATH,
  slottyEmailLogoUrl,
} from './transactionalEmailLayout.js';

export const BOOKING_RECEIPT_LOGO_SRC = SLOTTY_EMAIL_LOGO_PATH;

/** @deprecated Hero-баннер убран из писем. */
export const BOOKING_RECEIPT_HERO_SRC = '/photos/xtr/1.webp';

export type BookingReceiptEmailRow = { label: string; value: string };

export type BookingReceiptStatusTone = 'success' | 'warning' | 'pink' | 'neutral';

export type BookingReceiptEmailParams = {
  documentTitle: string;
  preview: string;
  receiptKind?: string;
  eyebrow: string;
  title: string;
  statusLabel: string;
  statusTone?: BookingReceiptStatusTone;
  subtitle: string;
  heroTitle: string;
  heroHighlight: string;
  heroMeta: string;
  sectionTitle?: string;
  rows: BookingReceiptEmailRow[];
  ctaLabel: string;
  ctaUrl: string;
  voucherNumber?: string | null;
  footerNote?: string;
};

export { slottyEmailLogoUrl as BOOKING_RECEIPT_LOGO_ABSOLUTE_URL };

/** HTML-письмо о записи — единый чистый шаблон SLOTTY. */
export function buildBookingReceiptEmailHtml(params: BookingReceiptEmailParams): string {
  const receiptNumber = params.voucherNumber?.trim() || `SL-${Date.now().toString().slice(-8)}`;
  const footerNote =
    params.footerNote ??
    'Оплата услуги — у мастера на месте. SLOTTY не списывает карту при записи.';

  return buildSlottyEmailHtml({
    documentTitle: params.documentTitle,
    preview: params.preview,
    title: params.title,
    intro: params.subtitle,
    rows: params.rows,
    ctaLabel: params.ctaLabel,
    ctaUrl: params.ctaUrl,
    footerNote,
    metaLabel: params.receiptKind ?? 'Уведомление',
    metaValue: `№ ${receiptNumber}`,
  });
}

export { escapeHtml };
