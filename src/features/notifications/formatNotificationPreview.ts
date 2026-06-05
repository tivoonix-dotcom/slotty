import type { MeNotificationRow } from '../profile/api/clientNotifications';
import { parseNotificationSummary } from './parseNotificationSummary';

const ISO_DATETIME_RE = /\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})?/g;

function formatIsoInText(raw: string): string {
  return raw.replace(ISO_DATETIME_RE, (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  });
}

/** Краткий текст для строки ленты (без сырого ISO и дублей structured body). */
export function formatNotificationPreviewBody(item: MeNotificationRow): string {
  const summary = parseNotificationSummary(item);
  if (summary.length >= 2) {
    return summary.map((row) => `${row.label}: ${row.value}`).join(' · ');
  }
  if (summary.length === 1) {
    return `${summary[0].label}: ${summary[0].value}`;
  }
  return formatIsoInText(item.body.trim());
}
