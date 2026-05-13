import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export async function listNotifications(userId: string) {
  const r = await query(
    `select id, type::text, title, body, related_entity_type, related_entity_id, read_at, created_at
       from public.notifications
      where user_id = $1
      order by created_at desc
      limit 200`,
    [userId],
  );
  return r.rows;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const u = await query(
    `update public.notifications set read_at = now(), updated_at = now()
      where id = $1 and user_id = $2
      returning id`,
    [notificationId, userId],
  );
  if (!u.rowCount) {
    throw ApiError.notFound('Notification not found');
  }
}
