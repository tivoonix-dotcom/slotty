import { publicAppUrl } from '../../lib/publicAppUrl.js';

/** Тот же логотип, что в bar-хедере сайта (`headerLogo.ts`). */
export const SLOTTY_EMAIL_LOGO_PATH = '/photos/logo-header.webp';

/** Высота как `LANDING_HEADER_LOGO_IMG_CLASS` (h-12 = 48px). */
export const SLOTTY_EMAIL_LOGO_HEIGHT_PX = 48;

const TEXT = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const BG = '#F3F4F6';
export type TransactionalEmailRow = { label: string; value: string };

export function slottyEmailLogoUrl(): string {
  return publicAppUrl(SLOTTY_EMAIL_LOGO_PATH);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, '&#39;');
}

/** Логотип из шапки сайта — без фона, те же пропорции. */
export function renderSlottyEmailLogo(): string {
  const src = slottyEmailLogoUrl();
  const h = SLOTTY_EMAIL_LOGO_HEIGHT_PX;
  return `<img src="${escapeAttr(src)}" height="${h}" alt="SLOTTY" style="display:block;border:0;outline:none;text-decoration:none;height:${h}px;width:auto;max-width:168px;-ms-interpolation-mode:bicubic;" />`;
}

function renderRows(rows: TransactionalEmailRow[]): string {
  return rows
    .map(
      (row, index) => `
        <tr>
          <td style="padding:14px 0;${index < rows.length - 1 ? `border-bottom:1px solid ${BORDER};` : ''}">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td class="detail-label" style="font-size:14px;line-height:1.5;color:${MUTED};vertical-align:top;padding-right:16px;">
                  ${escapeHtml(row.label)}
                </td>
                <td class="detail-value" align="right" style="font-size:14px;line-height:1.5;font-weight:600;color:${TEXT};vertical-align:top;">
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

function emailBaseStyles(): string {
  return `
    body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    a { color:${TEXT}; }
    @media only screen and (max-width:600px) {
      .email-shell { width:100% !important; max-width:100% !important; border-radius:12px !important; }
      .email-pad { padding-left:20px !important; padding-right:20px !important; }
      .header-meta { display:block !important; width:100% !important; text-align:left !important; padding-top:14px !important; }
      .detail-label, .detail-value { display:block !important; width:100% !important; text-align:left !important; }
      .detail-value { padding-top:4px !important; }
    }
  `;
}

export type SlottyEmailParams = {
  documentTitle: string;
  preview: string;
  title: string;
  intro: string;
  rows?: TransactionalEmailRow[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
  /** Мелкая подпись справа в шапке, напр. «Заявка». */
  metaLabel?: string;
  /** Вторая строка справа, напр. номер SL-…. */
  metaValue?: string;
};

/** Единый профессиональный шаблон писем SLOTTY (как OKX / банки). */
export function buildSlottyEmailHtml(params: SlottyEmailParams): string {
  const ctaLabel = params.ctaLabel?.trim();
  const ctaUrl = params.ctaUrl?.trim();
  const rows = params.rows ?? [];
  const footerNote =
    params.footerNote ??
    'Это автоматическое уведомление SLOTTY. Если вы не ожидали это письмо, просто проигнорируйте его.';
  const siteUrl = publicAppUrl('/book');

  const metaBlock =
    params.metaLabel || params.metaValue
      ? `<td class="header-meta" align="right" style="vertical-align:top;font-size:12px;line-height:1.45;font-weight:600;color:#9CA3AF;white-space:nowrap;">
          ${params.metaLabel ? escapeHtml(params.metaLabel) : ''}
          ${
            params.metaValue
              ? `<span style="display:block;margin-top:2px;font-size:12px;font-weight:700;color:${MUTED};">${escapeHtml(params.metaValue)}</span>`
              : ''
          }
        </td>`
      : '';

  const rowsBlock =
    rows.length > 0
      ? `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;border-top:1px solid ${BORDER};">
            ${renderRows(rows)}
          </table>
        `
      : '';

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
            <tr>
              <td>
                <a href="${escapeAttr(ctaUrl)}" target="_blank" style="display:inline-block;padding:13px 24px;border-radius:10px;background-color:${TEXT};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;mso-padding-alt:0;">
                  <!--[if mso]><i style="letter-spacing:20px;mso-font-width:-100%;mso-text-raise:16pt;">&nbsp;</i><![endif]-->
                  <span style="mso-text-raise:8pt;">${escapeHtml(ctaLabel)}</span>
                  <!--[if mso]><i style="letter-spacing:20px;mso-font-width:-100%;">&nbsp;</i><![endif]-->
                </a>
              </td>
            </tr>
          </table>
        `
      : '';

  return `<!DOCTYPE html>
<html lang="ru" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(params.documentTitle)}</title>
  <style type="text/css">${emailBaseStyles()}</style>
</head>
<body style="margin:0;padding:0;background-color:${BG};color:${TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(params.preview)}&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-shell" style="max-width:560px;background-color:#ffffff;border:1px solid ${BORDER};border-radius:16px;">
          <tr>
            <td class="email-pad" style="padding:28px 32px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    ${renderSlottyEmailLogo()}
                  </td>
                  ${metaBlock}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:28px 32px 32px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:${TEXT};">
                ${escapeHtml(params.title)}
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.65;color:${MUTED};">
                ${escapeHtml(params.intro)}
              </p>
              ${rowsBlock}
              ${ctaBlock}
              <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${BORDER};font-size:12px;line-height:1.6;color:#9CA3AF;">
                ${escapeHtml(footerNote)}
              </p>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:0 32px 28px;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9CA3AF;">
                <a href="${escapeAttr(siteUrl)}" style="color:${MUTED};text-decoration:none;font-weight:600;">slotty.of.by</a>
                · © ${new Date().getFullYear()} SLOTTY
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** @deprecated используйте buildSlottyEmailHtml */
export function buildTransactionalEmailHtml(params: {
  documentTitle: string;
  preview: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  rows?: TransactionalEmailRow[];
  footerNote?: string;
  metaLabel?: string;
}): string {
  const intro = params.bodyHtml
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return buildSlottyEmailHtml({
    documentTitle: params.documentTitle,
    preview: params.preview,
    title: params.title,
    intro: intro || params.preview,
    rows: params.rows,
    ctaLabel: params.ctaLabel,
    ctaUrl: params.ctaUrl,
    footerNote: params.footerNote,
    metaLabel: params.metaLabel,
  });
}

export function plainParagraphHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean).join(' '))
    .join('\n\n');
}
