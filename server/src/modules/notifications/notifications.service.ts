import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  filterNotificationsForAudience,
  type NotificationAudience,
} from './notificationAudience.js';
import { parseBookingNotificationMetadata, type BookingNotificationMetadata } from './bookingNotificationMetadata.js';

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
  booking_code: string | null;
  metadata: BookingNotificationMetadata | null;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(
  userId: string,
  audience?: NotificationAudience,
): Promise<NotificationRow[]> {
  const r = await query<{
    id: string;
    type: string;
    title: string;
    body: string;
    related_entity_type: string | null;
    related_entity_id: string | null;
    read_at: Date | string | null;
    created_at: Date | string;
    metadata: unknown;
    booking_code: string | null;
    review_master_reply: string | null;
  }>(
    `select n.id, n.type::text, n.title, n.body, n.related_entity_type, n.related_entity_id,
            n.read_at, n.created_at, n.metadata, bv.voucher_number as booking_code,
            rev.master_reply as review_master_reply
       from public.notifications n
       left join public.booking_vouchers bv
         on n.related_entity_type = 'appointment' and bv.appointment_id = n.related_entity_id
       left join public.reviews rev
         on n.related_entity_type = 'review' and rev.id = n.related_entity_id
      where n.user_id = $1
      order by n.created_at desc
      limit 200`,
    [userId],
  );
  const mapped = r.rows.map((row) => {
    let metadata = parseBookingNotificationMetadata(row.metadata);
    if (
      row.related_entity_type === 'review' &&
      row.review_master_reply?.trim() &&
      metadata
    ) {
      metadata = { ...metadata, needsMasterReply: false };
    } else if (
      row.related_entity_type === 'review' &&
      row.review_master_reply?.trim() &&
      !metadata
    ) {
      metadata = {
        bookingId: row.related_entity_id ?? '',
        needsMasterReply: false,
      };
    }
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      related_entity_type: row.related_entity_type,
      related_entity_id: row.related_entity_id,
      booking_code: row.booking_code ?? null,
      metadata,
      read_at: toIso(row.read_at),
      created_at: toIso(row.created_at) ?? new Date().toISOString(),
    };
  });

  if (!audience) return mapped;
  return filterNotificationsForAudience(mapped, audience);
}

/** После ответа мастера на отзыв — снимаем «требует действия» с in-app уведомлений. */
export async function markReviewNotificationsReplied(masterId: string, reviewId: string): Promise<void> {
  await query(
    `update public.notifications
        set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{needsMasterReply}', 'false'::jsonb, true),
            updated_at = now()
      where user_id = $1
        and related_entity_type = 'review'
        and related_entity_id = $2`,
    [masterId, reviewId],
  );
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
