/** Квадратный логотип для превью/PDF (в HTML-письмах — текстовая марка, без webp). */
export const BOOKING_RECEIPT_LOGO_SRC = '/photos/logo.webp';

/** @deprecated Hero-баннер убран из писем — не адаптивен и ломается в Outlook. */
export const BOOKING_RECEIPT_HERO_SRC = '/photos/xtr/1.png';

const BRAND = '#F47C8C';
const BRAND_DARK = '#111827';
const MUTED = '#6B7280';
const BORDER = '#EBEBEB';

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, '&#39;');
}

function statusPillStyle(tone: BookingReceiptStatusTone): string {
  switch (tone) {
    case 'success':
      return 'background-color:#ecfdf5;color:#15803d;border:1px solid #bbf7d0;';
    case 'warning':
      return 'background-color:#fffbeb;color:#b45309;border:1px solid #fde68a;';
    case 'pink':
      return 'background-color:#fff1f4;color:#e11d48;border:1px solid #fecdd3;';
    default:
      return 'background-color:#f6f7fb;color:#6b7280;border:1px solid #e5e7eb;';
  }
}

/** Текстовый логотип — работает в Outlook и при блокировке картинок. */
function renderSlottyLogoMark(): string {
  const dot = (color: string) =>
    `<td width="8" height="8" style="width:8px;height:8px;background-color:${color};font-size:0;line-height:0;">&nbsp;</td>`;
  const gap = `<td width="5" style="width:5px;font-size:0;line-height:0;">&nbsp;</td>`;
  const rowGap = `<tr><td colspan="5" height="5" style="height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>`;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" class="logo-wrap">
      <tr>
        <td style="vertical-align:middle;padding-right:10px;">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>${dot(BRAND)}${gap}${dot(BRAND)}</tr>
            ${rowGap}
            <tr>${dot(BRAND_DARK)}${gap}${dot(BRAND_DARK)}</tr>
          </table>
        </td>
        <td style="vertical-align:middle;font-size:22px;font-weight:700;letter-spacing:-0.04em;color:${BRAND_DARK};line-height:1;">
          slotty
        </td>
      </tr>
    </table>
  `;
}

function renderRows(rows: BookingReceiptEmailRow[]): string {
  return rows
    .map(
      (row, index) => `
        <tr>
          <td class="detail-row" style="padding:12px 16px;${index < rows.length - 1 ? `border-bottom:1px solid ${BORDER};` : ''}">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td class="detail-label" style="font-size:13px;line-height:1.45;color:${MUTED};vertical-align:top;padding-right:12px;">
                  ${escapeHtml(row.label)}
                </td>
                <td class="detail-value" align="right" style="font-size:13px;line-height:1.45;font-weight:600;color:${BRAND_DARK};vertical-align:top;">
                  ${escapeHtml(row.value)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join('');
}

function emailStyles(): string {
  return `
    body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; height:auto; }
    table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    a { color:${BRAND}; }
    @media only screen and (max-width:600px) {
      .email-shell { width:100% !important; max-width:100% !important; border-radius:16px !important; }
      .email-pad { padding-left:18px !important; padding-right:18px !important; }
      .header-meta { display:block !important; width:100% !important; text-align:left !important; padding-top:12px !important; }
      .title-cell { display:block !important; width:100% !important; padding-right:0 !important; padding-bottom:8px !important; }
      .status-cell { display:block !important; width:100% !important; }
      .detail-label, .detail-value { display:block !important; width:100% !important; text-align:left !important; }
      .detail-value { padding-top:4px !important; font-size:14px !important; }
      .footer-col { display:block !important; width:100% !important; text-align:left !important; padding-top:8px !important; }
      .summary-time { font-size:22px !important; }
    }
  `;
}

/** HTML-письмо о записи: адаптивная transactional-вёрстка без маркетингового баннера. */
export function buildBookingReceiptEmailHtml(params: BookingReceiptEmailParams): string {
  const receiptKind = params.receiptKind ?? 'Подтверждение';
  const sectionTitle = params.sectionTitle ?? 'Детали записи';
  const statusTone = params.statusTone ?? 'success';
  const receiptNumber = params.voucherNumber?.trim() || `SL-${Date.now().toString().slice(-8)}`;
  const footerNote =
    params.footerNote ??
    'Оплата услуги — у мастера на месте. SLOTTY не списывает карту при записи.';

  return `<!DOCTYPE html>
<html lang="ru" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(params.documentTitle)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">${emailStyles()}</style>
</head>
<body style="margin:0;padding:0;background-color:#f1efef;color:${BRAND_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(params.preview)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1efef;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-shell" style="max-width:560px;background-color:#ffffff;border:1px solid ${BORDER};border-radius:20px;overflow:hidden;">
          <tr>
            <td class="email-pad" style="padding:22px 28px 18px;border-bottom:1px solid ${BORDER};background-color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    ${renderSlottyLogoMark()}
                  </td>
                  <td class="header-meta" align="right" style="vertical-align:top;font-size:11px;line-height:1.4;font-weight:600;color:#9ca3af;white-space:nowrap;">
                    ${escapeHtml(receiptKind)}
                    <span style="display:block;margin-top:4px;font-size:12px;font-weight:700;color:${MUTED};">№ ${escapeHtml(receiptNumber)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="email-pad" style="padding:22px 28px 0;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">
                ${escapeHtml(params.eyebrow)}
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td class="title-cell" style="padding:0 12px 0 0;vertical-align:middle;">
                    <h1 style="margin:0;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-0.03em;color:${BRAND_DARK};">
                      ${escapeHtml(params.title)}
                    </h1>
                  </td>
                  <td class="status-cell" style="vertical-align:middle;white-space:nowrap;">
                    <span style="display:inline-block;padding:5px 12px;border-radius:999px;font-size:11px;font-weight:700;line-height:1.2;${statusPillStyle(statusTone)}">
                      ${escapeHtml(params.statusLabel)}
                    </span>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.55;color:${MUTED};">
                ${escapeHtml(params.subtitle)}
              </p>
            </td>
          </tr>

          <tr>
            <td class="email-pad" style="padding:20px 28px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BORDER};border-radius:16px;overflow:hidden;background-color:#ffffff;">
                <tr>
                  <td width="4" style="width:4px;background-color:${BRAND};font-size:0;line-height:0;">&nbsp;</td>
                  <td style="padding:18px 20px;background-color:#fffafb;">
                    <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;">
                      Запись
                    </p>
                    <p style="margin:8px 0 0;font-size:18px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:${BRAND_DARK};">
                      ${escapeHtml(params.heroTitle)}
                    </p>
                    <p class="summary-time" style="margin:6px 0 0;font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-0.04em;color:${BRAND_DARK};">
                      ${escapeHtml(params.heroHighlight)}
                    </p>
                    <p style="margin:10px 0 0;font-size:13px;line-height:1.45;color:${MUTED};">
                      ${escapeHtml(params.heroMeta)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            params.rows.length
              ? `
          <tr>
            <td class="email-pad" style="padding:18px 28px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BORDER};border-radius:16px;overflow:hidden;background-color:#ffffff;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid ${BORDER};background-color:#fafafa;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">
                    ${escapeHtml(sectionTitle)}
                  </td>
                </tr>
                ${renderRows(params.rows)}
              </table>
            </td>
          </tr>
          `
              : ''
          }

          <tr>
            <td class="email-pad" style="padding:24px 28px 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${escapeAttr(params.ctaUrl)}" target="_blank" style="display:block;padding:14px 20px;border-radius:999px;background-color:${BRAND};color:#ffffff;font-size:15px;font-weight:700;text-align:center;text-decoration:none;mso-padding-alt:0;">
                      <!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%;mso-text-raise:18pt;">&nbsp;</i><![endif]-->
                      <span style="mso-text-raise:9pt;">${escapeHtml(params.ctaLabel)}</span>
                      <!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%;">&nbsp;</i><![endif]-->
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:12px;line-height:1.55;color:#9ca3af;word-break:break-word;">
                ${escapeHtml(footerNote)}
              </p>
            </td>
          </tr>

          <tr>
            <td class="email-pad" style="padding:16px 28px 24px;border-top:1px solid ${BORDER};background-color:#fafafa;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td class="footer-col" style="font-size:12px;line-height:1.5;color:#9ca3af;vertical-align:top;">
                    <span style="display:block;font-size:12px;font-weight:800;letter-spacing:0.1em;color:${BRAND};">SLOTTY</span>
                    Онлайн-запись к мастерам
                  </td>
                  <td class="footer-col" align="right" style="font-size:12px;line-height:1.5;color:#9ca3af;vertical-align:top;">
                    <a href="https://slotty.by" style="color:${MUTED};text-decoration:none;font-weight:600;">slotty.by</a><br />
                    Документ сформирован автоматически
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
