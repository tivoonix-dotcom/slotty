import {
  getClientAppointmentPath,
  getClientAppointmentReviewPath,
  getProfileAppointmentFocusPath,
  getProfilePath,
} from '../../app/paths';
import { resolveBookingCodeFromNotification } from '../appointments/clientBooking/clientReviewFlow';
import { parseBookingNotificationMetadata } from './bookingNotificationMetadata';
import type { MeNotificationRow } from '../profile/api/clientNotifications';

export type ClientNotificationAction = {
  label: string;
  to: string;
};

const APPOINTMENT_NOTIFY_TYPES = new Set([
  'appointment_new',
  'appointment_pending',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_reminder',
  'review_request',
]);

/** Страница записи клиента (/client/appointments/SL-…); без кода — fallback в профиль. */
export function resolveClientBookingPagePath(item: MeNotificationRow): string | null {
  const bookingCode = resolveBookingCodeFromNotification(item);
  if (bookingCode) return getClientAppointmentPath(bookingCode);
  if (item.related_entity_id?.trim()) {
    return getProfileAppointmentFocusPath({ appointmentId: item.related_entity_id });
  }
  return null;
}

export function resolveClientNotificationAction(
  item: MeNotificationRow,
): ClientNotificationAction | null {
  const bookingCode = resolveBookingCodeFromNotification(item);
  const bookingPath = bookingCode ? getClientAppointmentPath(bookingCode) : resolveClientBookingPagePath(item);

  if (item.type === 'review_request') {
    const meta = parseBookingNotificationMetadata(item.metadata);
    const status = meta?.bookingStatus?.trim().toLowerCase() ?? '';
    if (status && status !== 'completed') {
      return bookingPath ? { label: 'Открыть запись', to: bookingPath } : null;
    }
    if (bookingCode) {
      return { label: 'Оставить отзыв', to: getClientAppointmentReviewPath(bookingCode) };
    }
    if (bookingPath) {
      return { label: 'Открыть запись', to: bookingPath };
    }
    return { label: 'Мои записи', to: getProfilePath('appointments') };
  }

  if (item.related_entity_type === 'appointment' && bookingPath) {
    return { label: 'Открыть запись', to: bookingPath };
  }

  if (APPOINTMENT_NOTIFY_TYPES.has(item.type)) {
    if (bookingPath) {
      return { label: 'Открыть запись', to: bookingPath };
    }
    return { label: 'Мои записи', to: getProfilePath('appointments') };
  }

  return null;
}
