import { query } from '../../config/db.js';
import type { BookingNotificationMetadata } from './bookingNotificationMetadata.js';
import {
  resolveNotificationAudience,
  type NotificationAudience,
} from './notificationAudience.js';

export type NotificationType =
  | 'appointment_new'
  | 'appointment_pending'
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'review_request'
  | 'billing'
  | 'system';

export async function insertUserNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  audience?: NotificationAudience;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  metadata?: BookingNotificationMetadata | null;
}): Promise<string> {
  const audience =
    params.audience ??
    resolveNotificationAudience({
      type: params.type,
      title: params.title,
      body: params.body,
    });

  const r = await query<{ id: string }>(
    `insert into public.notifications (
       user_id, type, title, body, audience, related_entity_type, related_entity_id, metadata
     )
     values ($1, $2::public.notification_type, $3, $4, $5::public.notification_audience, $6, $7, $8::jsonb)
     returning id`,
    [
      params.userId,
      params.type,
      params.title,
      params.body,
      audience,
      params.relatedEntityType ?? null,
      params.relatedEntityId ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ],
  );
  const id = r.rows[0]?.id;
  if (!id) {
    throw new Error('Failed to insert notification');
  }
  return id;
}
