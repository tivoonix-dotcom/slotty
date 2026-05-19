import { query } from '../../config/db.js';

export type NotificationType =
  | 'appointment_new'
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
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}): Promise<void> {
  await query(
    `insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
     values ($1, $2::public.notification_type, $3, $4, $5, $6)`,
    [
      params.userId,
      params.type,
      params.title,
      params.body,
      params.relatedEntityType ?? null,
      params.relatedEntityId ?? null,
    ],
  );
}
