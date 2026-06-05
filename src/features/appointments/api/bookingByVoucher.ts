import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';
import type { ClientBookingDetail } from '../clientBooking/clientBookingDetailTypes';
import type { MasterAppointmentLifecycleResult } from '../masterAppointmentLifecycle';

export type MasterBookingByVoucher = {
  id: string;
  client_id: string;
  service_id: string;
  slot_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  price_snapshot: string;
  service_title_snapshot: string;
  client_note: string | null;
  client_reference_photo_url: string | null;
  created_at: string;
  client_name: string;
  client_phone: string | null;
  client_email?: string | null;
  client_telegram_username?: string | null;
  client_avatar_url: string | null;
  voucher_number: string | null;
  service_duration_snapshot?: number | null;
  booking_source?: string | null;
  location_public_address?: string | null;
  visit_type?: string | null;
  service_category_name?: string | null;
  status_label?: string;
  status_hint?: string | null;
  cancel_reason?: string | null;
  cancel_reason_category?: string | null;
  client_signal?: {
    kind: 'on_the_way' | 'running_late' | 'reported_arrived' | null;
    lateMinutes: number | null;
    comment: string | null;
    at: string | null;
  };
  timeline?: Array<{
    eventType: string;
    label: string;
    createdAt: string;
    comment?: string | null;
    lateMinutes?: number | null;
  }>;
  lifecycle?: MasterAppointmentLifecycleResult;
  lifecycle_history?: MasterAppointmentLifecycleResult;
  pending_expires_at?: string | null;
};

export async function fetchClientAppointmentByVoucher(
  bookingCode: string,
): Promise<ClientBookingDetail> {
  const code = encodeURIComponent(bookingCode.trim().toUpperCase());
  const res = await apiFetch(`/api/me/appointments/voucher/${code}`);
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
  const data = (await res.json()) as { appointment: ClientBookingDetail };
  return data.appointment;
}

export async function fetchMasterAppointmentByVoucher(
  bookingCode: string,
): Promise<MasterBookingByVoucher> {
  const code = encodeURIComponent(bookingCode.trim().toUpperCase());
  const res = await apiFetch(`/api/masters/me/appointments/voucher/${code}`);
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
  const data = (await res.json()) as { appointment: MasterBookingByVoucher };
  return data.appointment;
}

export async function fetchMasterAppointmentById(
  appointmentId: string,
): Promise<MasterBookingByVoucher> {
  const res = await apiFetch(
    `/api/masters/me/appointments/${encodeURIComponent(appointmentId)}`,
  );
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
  const data = (await res.json()) as { appointment: MasterBookingByVoucher };
  return data.appointment;
}

export async function cancelClientAppointmentById(
  appointmentId: string,
  body?: { reason?: string; reasonCategory?: string; comment?: string },
): Promise<void> {
  const res = await apiFetch(`/api/me/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
}

export async function cancelClientAppointmentByVoucher(
  bookingCode: string,
  body: { reason?: string; reasonCategory?: string; comment?: string },
): Promise<void> {
  const code = encodeURIComponent(bookingCode.trim().toUpperCase());
  const res = await apiFetch(`/api/me/appointments/voucher/${code}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
}
