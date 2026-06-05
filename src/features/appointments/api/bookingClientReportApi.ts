import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type BookingClientReportReason =
  | 'client_misconduct'
  | 'client_not_paid'
  | 'client_harassment'
  | 'client_fake_info'
  | 'other';

export const BOOKING_CLIENT_REPORT_REASONS: { code: BookingClientReportReason; label: string }[] = [
  { code: 'client_misconduct', label: 'Некорректное поведение' },
  { code: 'client_not_paid', label: 'Не оплатил услугу' },
  { code: 'client_harassment', label: 'Оскорбления или домогательства' },
  { code: 'client_fake_info', label: 'Ложные контактные данные' },
  { code: 'other', label: 'Другое' },
];

export async function submitBookingClientReport(
  appointmentId: string,
  body: { reasonCode: BookingClientReportReason; reasonText?: string | null },
): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/report-client`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
}
