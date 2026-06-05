import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { normalizeDbStatus } from '../../lib/appointmentStatus.js';
import { ApiError } from '../../utils/ApiError.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import { sendTelegramMessage } from '../telegram/telegram.service.js';
import { requireAppointmentForMaster } from './appointments.access.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import { fetchAppointmentNotifyContext } from './appointmentNotifyContext.js';

export type BookingClientReportReason =
  | 'client_misconduct'
  | 'client_not_paid'
  | 'client_harassment'
  | 'client_fake_info'
  | 'other';

export type BookingClientReportStatus = 'pending' | 'in_review' | 'closed' | 'rejected';

export type BookingClientReportDto = {
  id: string;
  status: BookingClientReportStatus;
  reasonCode: BookingClientReportReason;
  reasonText: string | null;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type ReportRow = {
  id: string;
  appointment_id: string;
  master_id: string;
  client_user_id: string | null;
  reason_code: string;
  reason_text: string | null;
  status: string;
  admin_comment: string | null;
  created_at: Date | string;
  reviewed_at: Date | string | null;
  reviewed_by: string | null;
};

const REASON_LABELS: Record<BookingClientReportReason, string> = {
  client_misconduct: 'Некорректное поведение',
  client_not_paid: 'Не оплатил услугу',
  client_harassment: 'Оскорбления или домогательства',
  client_fake_info: 'Ложные контактные данные',
  other: 'Другое',
};

const ALLOWED_STATUSES = new Set([
  'completed',
  'client_confirmed_completed',
  'master_marked_completed',
]);

function mapRow(row: ReportRow): BookingClientReportDto {
  return {
    id: row.id,
    status: row.status as BookingClientReportStatus,
    reasonCode: row.reason_code as BookingClientReportReason,
    reasonText: row.reason_text,
    adminComment: row.admin_comment,
    createdAt: new Date(row.created_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
  };
}

export function bookingClientReportReasonLabel(code: BookingClientReportReason): string {
  return REASON_LABELS[code] ?? code;
}

async function notifyAdminAboutClientReport(params: {
  appointmentId: string;
  voucherNumber: string | null;
  masterName: string;
  clientName: string | null;
  reasonLabel: string;
  reasonText: string | null;
}): Promise<void> {
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  const lines = [
    'Жалоба мастера на клиента',
    '',
    `Запись: ${params.voucherNumber ?? '—'}`,
    `Мастер: ${params.masterName}`,
    params.clientName ? `Клиент: ${params.clientName}` : null,
    `Причина: ${params.reasonLabel}`,
  ].filter(Boolean) as string[];
  if (params.reasonText?.trim()) {
    lines.push('', 'Комментарий:', params.reasonText.trim());
  }

  if (chatId) {
    await sendTelegramMessage({ telegramUserId: chatId, text: lines.join('\n') });
  }

  const admins = await query<{ id: string }>(
    `select id from public.profiles where role = 'platform_admin'::public.user_role limit 20`,
  );
  for (const admin of admins.rows) {
    try {
      const { notifyUser } = await import('../notifications/notifyUser.js');
      await notifyUser({
        userId: admin.id,
        type: 'system',
        title: 'Жалоба на клиента',
        body: `Мастер ${params.masterName} пожаловался на клиента по записи ${params.voucherNumber ?? ''}.`,
        relatedEntityType: 'appointment',
        relatedEntityId: params.appointmentId,
      });
    } catch {
      /* ignore per admin */
    }
  }
}

export async function createBookingClientReport(
  masterId: string,
  appointmentId: string,
  body: { reasonCode: BookingClientReportReason; reasonText?: string | null },
): Promise<BookingClientReportDto> {
  const access = await requireAppointmentForMaster(masterId, appointmentId);
  const status = normalizeDbStatus(access.status);
  if (!ALLOWED_STATUSES.has(status)) {
    throw ApiError.conflict('Жалоба доступна только после завершённого визита', 'BAD_STATUS');
  }

  const reasonText = body.reasonText?.trim() || null;
  if (body.reasonCode === 'other' && (!reasonText || reasonText.length < 10)) {
    throw ApiError.badRequest('Опишите проблему не короче 10 символов', 'validation_error');
  }
  if (reasonText && reasonText.length > 2000) {
    throw ApiError.badRequest('Слишком длинный комментарий', 'validation_error');
  }

  const recent = await query<{ ok: number }>(
    `select 1 as ok
       from public.booking_client_reports
      where appointment_id = $1
        and master_id = $2
        and status in ('pending', 'in_review')
      limit 1`,
    [appointmentId, masterId],
  );
  if ((recent.rowCount ?? 0) > 0) {
    throw ApiError.badRequest('Жалоба по этой записи уже на рассмотрении', 'active_report_exists');
  }

  const clientR = await query<{ client_id: string | null }>(
    `select client_id from public.appointments where id = $1`,
    [appointmentId],
  );
  const clientUserId = clientR.rows[0]?.client_id ?? null;

  const ins = await query<ReportRow>(
    `insert into public.booking_client_reports (
       appointment_id, master_id, client_user_id, reason_code, reason_text, status
     ) values ($1, $2, $3, $4, $5, 'pending')
     returning id, appointment_id, master_id, client_user_id, reason_code, reason_text, status,
               admin_comment, created_at, reviewed_at, reviewed_by`,
    [appointmentId, masterId, clientUserId, body.reasonCode, reasonText],
  );
  const row = ins.rows[0]!;

  await insertBookingEvent({
    appointmentId,
    eventType: 'booking.client_reported_by_master',
    oldStatus: status,
    newStatus: status,
    actorUserId: masterId,
    actorRole: 'master',
    reason: body.reasonCode,
    comment: reasonText,
    metadata: { reportId: row.id },
  });

  const ctx = await fetchAppointmentNotifyContext(appointmentId);
  const masterR = await query<{ display_name: string }>(
    `select display_name from public.master_profiles where master_id = $1`,
    [masterId],
  );
  void notifyAdminAboutClientReport({
    appointmentId,
    voucherNumber: ctx?.voucherNumber ?? null,
    masterName: masterR.rows[0]?.display_name?.trim() || 'Мастер',
    clientName: ctx?.clientName ?? null,
    reasonLabel: bookingClientReportReasonLabel(body.reasonCode),
    reasonText,
  });

  return mapRow(row);
}

export type BookingClientReportAdminRow = BookingClientReportDto & {
  appointmentId: string;
  voucherNumber: string | null;
  masterId: string;
  masterName: string;
  clientUserId: string | null;
  clientName: string | null;
};

export async function listBookingClientReportsForAdmin(
  status: 'all' | BookingClientReportStatus = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<{
  reports: BookingClientReportAdminRow[];
  total: number;
  limit: number;
  offset: number;
}> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (status !== 'all') {
    conditions.push(`r.status = $${i++}`);
    vals.push(status);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.booking_client_reports r ${where}`,
    vals,
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const listR = await query<
    ReportRow & {
      display_name: string;
      voucher_number: string | null;
      client_name: string | null;
    }
  >(
    `select r.id, r.appointment_id, r.master_id, r.client_user_id, r.reason_code, r.reason_text, r.status,
            r.admin_comment, r.created_at, r.reviewed_at, r.reviewed_by,
            mp.display_name, a.voucher_number,
            coalesce(p.full_name, a.client_name_snapshot) as client_name
       from public.booking_client_reports r
       join public.master_profiles mp on mp.master_id = r.master_id
       join public.appointments a on a.id = r.appointment_id
       left join public.profiles p on p.id = r.client_user_id
      ${where}
      order by r.created_at desc
      limit $${i++} offset $${i++}`,
    [...vals, limit, offset],
  );

  const reports: BookingClientReportAdminRow[] = listR.rows.map((row) => ({
    ...mapRow(row),
    appointmentId: row.appointment_id,
    voucherNumber: row.voucher_number,
    masterId: row.master_id,
    masterName: row.display_name,
    clientUserId: row.client_user_id,
    clientName: row.client_name?.trim() || null,
  }));

  return { reports, total, limit, offset };
}

export async function updateBookingClientReportStatus(
  reportId: string,
  adminUserId: string,
  params: { status: BookingClientReportStatus; adminComment?: string | null },
): Promise<void> {
  if (params.status === 'pending') {
    throw ApiError.badRequest('Недопустимый статус', 'validation_error');
  }

  const r = await query<ReportRow & { display_name: string; master_id: string; voucher_number: string | null }>(
    `select r.id, r.appointment_id, r.master_id, r.client_user_id, r.reason_code, r.reason_text, r.status,
            r.admin_comment, r.created_at, r.reviewed_at, r.reviewed_by,
            mp.display_name, a.voucher_number
       from public.booking_client_reports r
       join public.master_profiles mp on mp.master_id = r.master_id
       join public.appointments a on a.id = r.appointment_id
      where r.id = $1`,
    [reportId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Report not found');
  if (row.status !== 'pending' && row.status !== 'in_review') {
    throw ApiError.badRequest('Жалоба уже обработана', 'BAD_STATUS');
  }

  const comment = params.adminComment?.trim();
  if (params.status === 'rejected' || params.status === 'closed') {
    if (!comment || comment.length < 5) {
      throw ApiError.badRequest('Укажите комментарий для админки — не короче 5 символов', 'validation_error');
    }
  }

  await query(
    `update public.booking_client_reports
        set status = $2,
            admin_comment = coalesce($3, admin_comment),
            reviewed_at = now(),
            reviewed_by = $4,
            updated_at = now()
      where id = $1`,
    [reportId, params.status, comment || null, adminUserId],
  );

  await writeAdminAuditLog({
    adminUserId,
    action: `booking_client_report_${params.status}`,
    entityType: 'booking_client_report',
    entityId: reportId,
    targetUserId: row.client_user_id ?? undefined,
    reason: comment || null,
    metadata: {
      masterId: row.master_id,
      masterName: row.display_name,
      voucherNumber: row.voucher_number,
      reasonCode: row.reason_code,
    },
  });
}
