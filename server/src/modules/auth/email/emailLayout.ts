import {
  buildSlottyEmailHtml,
  escapeHtml,
  plainParagraphHtml,
} from '../../email/transactionalEmailLayout.js';

export function slottyEmailLayout(params: {
  title: string;
  preview: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): string {
  return buildSlottyEmailHtml({
    documentTitle: params.title,
    preview: params.preview,
    title: params.title,
    intro: plainParagraphHtml(
      params.bodyHtml
        .replace(/<strong>/gi, '')
        .replace(/<\/strong>/gi, '')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n'),
    ),
    ctaLabel: params.ctaLabel,
    ctaUrl: params.ctaUrl,
    footerNote: params.footerNote,
    metaLabel: 'SLOTTY',
  });
}

export function verificationEmailHtml(verifyUrl: string): { subject: string; html: string } {
  return {
    subject: 'Подтвердите email в SLOTTY',
    html: slottyEmailLayout({
      title: 'Подтвердите email',
      preview: 'Один клик — и вход по email будет полностью активен.',
      bodyHtml:
        'Спасибо за регистрацию! Нажмите кнопку ниже, чтобы подтвердить адрес почты.\n\nСсылка действует 24 часа.',
      ctaLabel: 'Подтвердить email',
      ctaUrl: verifyUrl,
      footerNote:
        'После подтверждения вы сможете восстановить пароль и получать уведомления на эту почту.',
    }),
  };
}

export function resetPasswordEmailHtml(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Сброс пароля SLOTTY',
    html: slottyEmailLayout({
      title: 'Новый пароль',
      preview: 'Запрос на сброс пароля для вашего аккаунта SLOTTY.',
      bodyHtml:
        'Вы запросили сброс пароля. Если это были не вы — проигнорируйте письмо.\n\nСсылка действует 1 час.',
      ctaLabel: 'Задать новый пароль',
      ctaUrl: resetUrl,
    }),
  };
}

export { escapeHtml, plainParagraphHtml };
