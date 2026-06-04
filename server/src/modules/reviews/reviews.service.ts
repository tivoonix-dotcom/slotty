import { query } from '../../config/db.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { notifyMasterEnteredTopIfNeeded } from '../masters/masterCatalogNotifications.js';
import { ApiError } from '../../utils/ApiError.js';
import { canClientLeaveReview, normalizeDbStatus } from '../../lib/appointmentStatus.js';
import { insertBookingEvent } from '../appointments/bookingEvents.service.js';
import { getOpenDisputeForAppointment } from '../appointments/bookingDisputes.service.js';

export type CreateReviewInput = {
  appointmentId: string;
  rating: number;
  body: string;
};

export async function createReviewForCompletedAppointment(
  clientId: string,
  input: CreateReviewInput,
): Promise<{ id: string }> {
  const apptRes = await query<{
    id: string;
    client_id: string;
    master_id: string;
    status: string;
    ends_at: Date | string;
  }>(
    `select id, client_id, master_id, status::text, ends_at
       from public.appointments
      where id = $1`,
    [input.appointmentId],
  );

  const appt = apptRes.rows[0];
  if (!appt) {
    throw ApiError.notFound('Запись не найдена', 'APPOINTMENT_NOT_FOUND');
  }
  if (appt.client_id !== clientId) {
    throw ApiError.forbidden('Нельзя оставить отзыв к чужой записи', 'NOT_YOUR_APPOINTMENT');
  }

  const openDispute = await getOpenDisputeForAppointment(input.appointmentId);
  if (!canClientLeaveReview(appt.status, Boolean(openDispute && ['open', 'in_review'].includes(openDispute.status)))) {
    throw ApiError.conflict(
      'Отзыв можно оставить после завершённого визита без открытого спора',
      'APPOINTMENT_NOT_REVIEWABLE',
    );
  }
  if (normalizeDbStatus(appt.status) !== 'completed') {
    throw ApiError.conflict(
      'Отзыв можно оставить только после завершения записи',
      'APPOINTMENT_NOT_REVIEWABLE',
    );
  }

  const dup = await query(`select 1 from public.reviews where appointment_id = $1`, [input.appointmentId]);
  if (dup.rowCount) {
    throw ApiError.conflict('Вы уже оставили отзыв к этой записи', 'REVIEW_EXISTS');
  }

  const body = input.body.trim();
  if (body.length < 1) {
    throw ApiError.badRequest('Текст отзыва обязателен', 'REVIEW_BODY_REQUIRED');
  }

  const ins = await query<{ id: string }>(
    `insert into public.reviews (appointment_id, client_id, master_id, rating, body, status)
     values ($1, $2, $3, $4, $5, 'published'::public.review_status)
     returning id`,
    [input.appointmentId, clientId, appt.master_id, input.rating, body],
  );

  const reviewId = ins.rows[0]?.id;
  if (!reviewId) {
    throw ApiError.internal('Не удалось сохранить отзыв', 'REVIEW_INSERT_FAILED');
  }

  await insertBookingEvent({
    appointmentId: input.appointmentId,
    eventType: 'booking.review_left',
    newStatus: 'completed',
    actorUserId: clientId,
    actorRole: 'client',
    metadata: { reviewId, rating: input.rating },
  });

  await notifyUser({
    userId: appt.master_id,
    type: 'system',
    title: 'Новый отзыв',
    body: `Клиент оставил отзыв (${input.rating}★) после визита.`,
    relatedEntityType: 'review',
    relatedEntityId: reviewId,
    telegramHtml: `<b>Новый отзыв</b>\nКлиент поставил ${input.rating}★ и оставил отзыв.`,
    masterPreferenceEvent: 'reviews',
  });

  void notifyMasterEnteredTopIfNeeded(appt.master_id);

  return { id: reviewId };
}
