import { query } from '../../config/db.js';
import type { DbAppointmentStatus } from '../../lib/appointmentStatus.js';

export type BookingActorRole = 'client' | 'master' | 'admin' | 'system';

export async function insertBookingEvent(params: {
  appointmentId: string;
  eventType: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  actorUserId?: string | null;
  actorRole: BookingActorRole;
  reason?: string | null;
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await query(
      `insert into public.booking_events (
         appointment_id, event_type, old_status, new_status,
         actor_user_id, actor_role, reason, comment, metadata
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [
        params.appointmentId,
        params.eventType,
        params.oldStatus ?? null,
        params.newStatus ?? null,
        params.actorUserId ?? null,
        params.actorRole,
        params.reason?.slice(0, 2000) ?? null,
        params.comment?.slice(0, 2000) ?? null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ],
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes('booking_events')) throw e;
  }
}

export type BookingEventRow = {
  id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  actor_role: string;
  reason: string | null;
  comment: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
};

export async function listBookingEventsForAppointment(
  appointmentId: string,
  limit = 50,
): Promise<BookingEventRow[]> {
  try {
    const r = await query<BookingEventRow>(
      `select id, event_type, old_status, new_status, actor_role, reason, comment, metadata, created_at
         from public.booking_events
        where appointment_id = $1
        order by created_at asc
        limit $2`,
      [appointmentId, limit],
    );
    return r.rows;
  } catch {
    return [];
  }
}

export function eventLabel(eventType: string, role: 'client' | 'master' | 'admin' = 'client'): string {
  const master = role === 'master';
  const admin = role === 'admin';
  switch (eventType) {
    case 'booking.created':
      return 'Создана заявка';
    case 'booking.confirmed':
      return 'Мастер подтвердил';
    case 'booking.cancelled_by_client':
      return 'Клиент отменил';
    case 'booking.cancelled_by_master':
      return 'Мастер отменил';
    case 'booking.client_arrived':
      return master ? 'Клиент пришёл' : 'Мастер подтвердил ваш приход';
    case 'booking.started':
      return 'Визит начат';
    case 'booking.master_marked_completed':
      return master ? 'Вы отметили выполнение услуги' : 'Мастер отметил выполнение';
    case 'booking.client_confirmed_completed':
      return master ? 'Клиент подтвердил выполнение' : 'Вы подтвердили выполнение';
    case 'booking.completed':
      return 'Визит завершён';
    case 'booking.completed_by_master':
      return master ? 'Вы завершили визит' : 'Визит завершён';
    case 'booking.completed_auto_confirmed':
      return role === 'admin' ? 'Завершено автоматически (24 ч)' : 'Визит завершён';
    case 'booking.no_show':
      return 'Неявка';
    case 'booking.no_show_reported':
      return master ? 'Отправлено в поддержку: неявка' : 'Мастер сообщил о неявке';
    case 'booking.client_on_the_way':
      return master ? 'Клиент в пути' : 'Вы сообщили, что в пути';
    case 'booking.client_running_late':
      return master ? 'Клиент опаздывает' : 'Вы сообщили об опоздании';
    case 'booking.client_comment':
      return master ? 'Комментарий клиента' : 'Ваш комментарий';
    case 'booking.client_reported_arrived':
      return master ? 'Клиент на месте' : 'Вы сообщили, что на месте';
    case 'booking.disputed_by_client':
      return master ? 'Жалоба клиента' : 'Вы отправили обращение';
    case 'booking.disputed_by_master':
      return 'Мастер отправил обращение';
    case 'booking.client_reported_by_master':
      return master ? 'Жалоба на клиента отправлена' : 'Мастер пожаловался на клиента';
    case 'booking.review_left':
      return 'Оставлен отзыв';
    case 'booking.expired':
      return role === 'admin' ? 'Заявка истекла' : 'Заявка истекла';
    case 'booking.dispute_resolved':
      return admin ? 'Спор закрыт администратором' : 'Спор рассмотрен';
    case 'booking.notification_sent':
      return admin ? 'Уведомление отправлено' : 'Уведомление';
    case 'booking.notification_failed':
      return admin ? 'Ошибка уведомления' : 'Уведомление не доставлено';
    case 'booking.reminder_sent':
      return admin ? 'Напоминание отправлено' : 'Напоминание';
    default:
      return eventType;
  }
}

export type TransitionTarget = DbAppointmentStatus;
