const BRAND = '#F47C8C';
const BRAND_DARK = '#E29595';
const BG = '#FFF8F9';
const TEXT = '#111827';
const MUTED = '#6B7280';

export function slottyEmailLayout(params: {
  title: string;
  preview: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): string {
  const { title, preview, bodyHtml, ctaLabel, ctaUrl, footerNote } = params;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#F1EFEF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1EFEF;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #ebebeb;">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND} 0%,${BRAND_DARK} 100%);padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">SLOTTY</p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.9);">Запись к мастерам без переписок</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:-0.03em;">${escapeHtml(title)}</h1>
              <div style="font-size:15px;line-height:1.6;color:${MUTED};">${bodyHtml}</div>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(135deg,${BRAND},${BRAND_DARK});">
                    <a href="${escapeAttr(ctaUrl)}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(ctaLabel)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#9CA3AF;word-break:break-all;">
                Или скопируйте ссылку:<br />
                <a href="${escapeAttr(ctaUrl)}" style="color:${BRAND};">${escapeHtml(ctaUrl)}</a>
              </p>
              ${footerNote ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#9CA3AF;">${footerNote}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:${BG};border-top:1px solid #FCE7EC;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
                © SLOTTY · Если вы не запрашивали это письмо, просто проигнорируйте его.
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

export function verificationEmailHtml(verifyUrl: string): { subject: string; html: string } {
  return {
    subject: 'Подтвердите email в SLOTTY',
    html: slottyEmailLayout({
      title: 'Подтвердите email',
      preview: 'Один клик — и вход по email будет полностью активен.',
      bodyHtml: `<p style="margin:0 0 12px;color:${MUTED};">Спасибо за регистрацию! Нажмите кнопку ниже, чтобы подтвердить адрес почты.</p>
        <p style="margin:0;color:${MUTED};">Ссылка действует <strong>24 часа</strong>.</p>`,
      ctaLabel: 'Подтвердить email',
      ctaUrl: verifyUrl,
      footerNote: 'После подтверждения вы сможете восстановить пароль и получать уведомления на эту почту.',
    }),
  };
}

export function resetPasswordEmailHtml(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Сброс пароля SLOTTY',
    html: slottyEmailLayout({
      title: 'Новый пароль',
      preview: 'Запрос на сброс пароля для вашего аккаунта SLOTTY.',
      bodyHtml: `<p style="margin:0 0 12px;color:${MUTED};">Вы запросили сброс пароля. Если это были не вы — проигнорируйте письмо.</p>
        <p style="margin:0;color:${MUTED};">Ссылка действует <strong>1 час</strong>.</p>`,
      ctaLabel: 'Задать новый пароль',
      ctaUrl: resetUrl,
    }),
  };
}
