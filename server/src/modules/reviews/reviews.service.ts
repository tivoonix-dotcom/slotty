import { query } from '../../config/db.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { notifyMasterEnteredTopIfNeeded } from '../masters/masterCatalogNotifications.js';
import { ApiError } from '../../utils/ApiError.js';
import { canClientLeaveReview, normalizeDbStatus } from '../../lib/appointmentStatus.js';
import { insertBookingEvent } from '../appointments/bookingEvents.service.js';
import { getOpenDisputeForAppointment } from '../appointments/bookingDisputes.service.js';
import { buildBookingNotificationMetadataForAppointment } from '../appointments/appointmentNotifySnapshot.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';

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

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw ApiError.badRequest('Поставьте оценку', 'REVIEW_RATING_REQUIRED');
  }

  const body = input.body.trim();
  if (body.length < 1) {
    throw ApiError.badRequest('Напишите текст отзыва', 'REVIEW_BODY_REQUIRED');
  }
  if (body.length < 10) {
    throw ApiError.badRequest('Напишите не менее 10 символов', 'REVIEW_BODY_TOO_SHORT');
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

  const bookingMeta = await buildBookingNotificationMetadataForAppointment(input.appointmentId);
  const clientName = bookingMeta?.clientName?.trim() || 'Клиент';
  const serviceName = bookingMeta?.serviceName?.trim() || 'Услуга';
  const whenPlain = bookingMeta?.startsAt
    ? (() => {
        const { date, time } = formatAppointmentDateTime(bookingMeta.startsAt);
        return `${date}, ${time}`;
      })()
    : null;

  const notifyBody = [
    `Клиент: ${clientName}`,
    `Услуга: ${serviceName}`,
    whenPlain ? `Когда: ${whenPlain}` : null,
    `Оценка: ${input.rating}★`,
  ]
    .filter(Boolean)
    .join('\n');

  const metadata = {
    bookingId: input.appointmentId,
    bookingCode: bookingMeta?.bookingCode ?? null,
    clientName: bookingMeta?.clientName ?? clientName,
    clientPhone: bookingMeta?.clientPhone ?? null,
    serviceName: bookingMeta?.serviceName ?? serviceName,
    serviceCategory: bookingMeta?.serviceCategory ?? null,
    servicePrice: bookingMeta?.servicePrice ?? null,
    serviceDurationMinutes: bookingMeta?.serviceDurationMinutes ?? null,
    startsAt: bookingMeta?.startsAt ?? null,
    endsAt: bookingMeta?.endsAt ?? null,
    address: bookingMeta?.address ?? null,
    format: bookingMeta?.format ?? null,
    bookingStatus: bookingMeta?.bookingStatus ?? 'completed',
    source: bookingMeta?.source ?? null,
    reviewId,
    reviewRating: input.rating,
    reviewBody: body,
    needsMasterReply: true,
  };

  await notifyUser({
    userId: appt.master_id,
    type: 'system',
    title: 'Новый отзыв',
    body: notifyBody,
    relatedEntityType: 'review',
    relatedEntityId: reviewId,
    metadata,
    bookingCode: bookingMeta?.bookingCode ?? undefined,
    telegramHtml:
      `<b>Новый отзыв</b>\n` +
      `Клиент: <b>${clientName}</b>\n` +
      `Услуга: ${serviceName}\n` +
      (whenPlain ? `Визит: ${whenPlain}\n` : '') +
      `Оценка: ${input.rating}★`,
    masterPreferenceEvent: 'reviews',
  });

  void notifyMasterEnteredTopIfNeeded(appt.master_id);

  return { id: reviewId };
}
