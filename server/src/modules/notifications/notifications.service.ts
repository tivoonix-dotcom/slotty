import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

function toIso(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(userId: string): Promise<NotificationRow[]> {
  const r = await query<{
    id: string;
    type: string;
    title: string;
    body: string;
    related_entity_type: string | null;
    related_entity_id: string | null;
    read_at: Date | string | null;
    created_at: Date | string;
  }>(
    `select id, type::text, title, body, related_entity_type, related_entity_id, read_at, created_at
       from public.notifications
      where user_id = $1
      order by created_at desc
      limit 200`,
    [userId],
  );
  return r.rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    related_entity_type: row.related_entity_type,
    related_entity_id: row.related_entity_id,
    read_at: toIso(row.read_at),
    created_at: toIso(row.created_at) ?? new Date().toISOString(),
  }));
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
