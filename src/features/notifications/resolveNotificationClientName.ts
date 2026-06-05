import { formatClientName, formatMasterName, type ClientNameFields } from '../../shared/lib/displayFormat';

export const CLIENT_DISPLAY_PLACEHOLDERS = new Set([
  'Клиент без имени',
  'Клиент SLOTTY',
  'Клиент',
  '',
]);

function looksLikePhone(value: string): boolean {
  return /^\+?\d[\d\s().-]{5,}$/.test(value.replace(/\s/g, ''));
}

export type NotificationClientNameFields = ClientNameFields & {
  masterDisplayName?: string | null;
};

/** Единое отображение имени клиента в уведомлениях и кабинете мастера. */
export function resolveNotificationClientName(fields: NotificationClientNameFields): string | null {
  const master = fields.masterDisplayName?.trim() || '';
  if (master && !CLIENT_DISPLAY_PLACEHOLDERS.has(master) && !looksLikePhone(master)) {
    return formatMasterName(master, 'Мастер');
  }

  const raw = fields.full_name?.trim() || '';
  const phone = fields.phone?.trim() || null;
  const telegram = fields.telegram_username?.trim().replace(/^@+/, '') || null;

  if (raw && !CLIENT_DISPLAY_PLACEHOLDERS.has(raw) && !looksLikePhone(raw)) {
    return raw;
  }

  const formatted = formatClientName({
    full_name: raw && !CLIENT_DISPLAY_PLACEHOLDERS.has(raw) ? raw : null,
    phone,
    telegram_username: telegram,
  });

  if (formatted !== 'Клиент SLOTTY' && !looksLikePhone(formatted)) return formatted;
  if (telegram) return `@${telegram}`;
  return null;
}
