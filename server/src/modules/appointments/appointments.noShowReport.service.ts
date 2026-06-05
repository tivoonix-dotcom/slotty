import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  formatClientName,
  formatServiceName,
  pickClientFullNameForDisplay,
} from '../../lib/displayFormat.js';
import { normalizeDbStatus } from '../../lib/appointmentStatus.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import { createSupportTicket } from '../support/supportTicket.service.js';
import { assertCanReportNoShow, isVisitGuardError } from '../../lib/masterAppointmentLifecycle.js';

export type MasterReportNoShowInput = {
  waitedMinutes: number;
  hadClientContact: boolean;
  comment?: string | null;
};

export async function masterReportNoShowToSupport(
  masterId: string,
  appointmentId: string,
  input: MasterReportNoShowInput,
): Promise<{ ticketCode: string }> {
  const r = await query<{
    id: string;
    status: string;
    client_id: string;
    starts_at: Date | string;
    ends_at: Date | string;
    price_snapshot: string;
    service_title_snapshot: string;
    client_name_snapshot: string | null;
    client_phone_snapshot: string | null;
    client_email_snapshot: string | null;
    client_telegram_username_snapshot: string | null;
    voucher_number: string | null;
    full_name: string | null;
    phone: string | null;
    telegram_username: string | null;
  }>(
    `select a.id, a.status::text, a.client_id, a.starts_at, a.ends_at,
            a.price_snapshot::text, a.service_title_snapshot,
            a.client_name_snapshot, a.client_phone_snapshot, a.client_email_snapshot,
            a.client_telegram_username_snapshot,
            bv.voucher_number,
            p.full_name, p.phone, p.telegram_username
       from public.appointments a
       left join public.booking_vouchers bv on bv.appointment_id = a.id
       left join public.profiles p on p.id = a.client_id
      where a.id = $1 and a.master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Appointment not found', 'BOOKING_NOT_FOUND');

  const status = normalizeDbStatus(row.status);
  const startsAt =
    row.starts_at instanceof Date ? row.starts_at : new Date(row.starts_at as string);
  const endsAt = row.ends_at instanceof Date ? row.ends_at : new Date(row.ends_at as string);

  try {
    assertCanReportNoShow({ status, startsAt, endsAt });
  } catch (e) {
    if (isVisitGuardError(e)) {
      throw ApiError.conflict(e.message, e.code);
    }
    throw e;
  }

  const startsAtIso = startsAt.toISOString();
  const endsAtIso = endsAt.toISOString();
  const clientName = formatClientName({
    full_name: pickClientFullNameForDisplay(row.client_name_snapshot, row.full_name),
    phone: row.client_phone_snapshot || row.phone,
    telegram_username: row.client_telegram_username_snapshot || row.telegram_username,
  });
  const serviceTitle = formatServiceName(row.service_title_snapshot);
  const bookingCode = row.voucher_number;
  const actionTime = new Date().toISOString();

  const messageLines = [
    `Мастер сообщил, что клиент не пришёл на запись ${bookingCode ?? appointmentId}.`,
    `Ждали: ${input.waitedMinutes} мин.`,
    `Был контакт с клиентом: ${input.hadClientContact ? 'да' : 'нет'}.`,
    input.comment?.trim() ? `Комментарий: ${input.comment.trim()}` : null,
  ].filter(Boolean);

  const ticket = await createSupportTicket(masterId, {
    category: 'booking_no_show',
    severity: 'medium',
    subject: `Клиент не пришёл · ${bookingCode ?? 'запись'}`,
    affectedServices: ['appointments'],
    relatedBookingCode: bookingCode,
    message: messageLines.join('\n'),
    preferredContactChannel: 'in_app',
    consentAccepted: true,
    clientMetadata: {
      kind: 'booking_no_show',
      appointmentId,
      bookingCode,
      clientId: row.client_id,
      masterId,
      appointmentStart: startsAtIso,
      appointmentEnd: endsAtIso,
      actionTime,
      waitedMinutes: input.waitedMinutes,
      hadClientContact: input.hadClientContact,
      comment: input.comment?.trim() || null,
      clientName,
      clientPhone: row.client_phone_snapshot || row.phone,
      serviceName: serviceTitle,
      price: Number(row.price_snapshot),
    },
  });

  await insertBookingEvent({
    appointmentId,
    eventType: 'booking.no_show_reported',
    oldStatus: status,
    newStatus: status,
    actorUserId: masterId,
    actorRole: 'master',
    comment: input.comment?.trim() || null,
    metadata: {
      ticketCode: ticket.ticketCode,
      waitedMinutes: input.waitedMinutes,
      hadClientContact: input.hadClientContact,
    },
  });

  return { ticketCode: ticket.ticketCode };
}
