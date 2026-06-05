import { env } from '../../config/env.js';
import {
  buildBookingEmailLink,
  buildBookingLink,
  type BookingLinkRole,
  type BookingLinkSource,
} from '../../lib/buildBookingLink.js';
import { ADMIN_APPOINTMENTS_PATH, ADMIN_SCHEDULE_PATH } from './appointmentNotifyPaths.js';

export { buildBookingLink, buildBookingEmailLink };
export type { BookingLinkRole, BookingLinkSource };
export { ADMIN_APPOINTMENTS_PATH, ADMIN_SCHEDULE_PATH };

function appBaseUrl(): string {
  return (env.WEB_APP_URL ?? env.CLIENT_URL).replace(/\/$/, '');
}

export function clientBookingDeepLink(
  bookingCode: string,
  source: BookingLinkSource = 'telegram',
): string {
  return buildBookingLink({ role: 'client', bookingCode, source });
}

export function masterBookingDeepLink(
  bookingCode: string,
  source: BookingLinkSource = 'telegram',
): string {
  return buildBookingLink({ role: 'master', bookingCode, source });
}

export function masterAdminAppointmentsUrl(opts?: {
  focusAppointmentId?: string;
  tab?: 'requests' | 'upcoming' | 'history';
}): string {
  const params = new URLSearchParams();
  if (opts?.tab && opts.tab !== 'requests') params.set('tab', opts.tab);
  if (opts?.focusAppointmentId) params.set('focus', opts.focusAppointmentId);
  const qs = params.toString();
  return `${appBaseUrl()}${ADMIN_APPOINTMENTS_PATH}${qs ? `?${qs}` : ''}`;
}

export function masterPendingAppointmentsUrl(): string {
  return masterAdminAppointmentsUrl();
}

export function masterScheduleUrl(): string {
  return `${appBaseUrl()}${ADMIN_SCHEDULE_PATH}`;
}

export function clientAppointmentsUrl(): string {
  return `${appBaseUrl()}/profile?tab=appointments`;
}
