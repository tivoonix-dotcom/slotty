import { formatServiceName } from '../../../shared/lib/displayFormat';
import type { ClientBookingDetail } from './clientBookingDetailTypes';

function formatIcsUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function downloadAppointmentIcs(detail: ClientBookingDetail): void {
  const start = formatIcsUtc(detail.starts_at);
  const end = formatIcsUtc(detail.ends_at);
  if (!start || !end) return;

  const title = formatServiceName(detail.service_title_snapshot) || 'Запись в SLOTTY';
  const master = detail.master?.display_name ?? detail.master_display_name ?? 'Мастер';
  const location = detail.address?.line?.trim() || '';
  const uid = `${detail.id}@slotty`;
  const stamp = formatIcsUtc(new Date().toISOString());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SLOTTY//Booking//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(`Запись у мастера ${master}${detail.voucher_number ? `. Номер: ${detail.voucher_number}` : ''}`)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `slotty-${detail.voucher_number ?? detail.id}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}
