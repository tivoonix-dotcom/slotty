import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type MeNotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  booking_code?: string | null;
  metadata?: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationAudience = 'master' | 'client';

export async function fetchMyNotifications(
  audience?: NotificationAudience,
): Promise<MeNotificationRow[]> {
  const qs = audience ? `?audience=${encodeURIComponent(audience)}` : '';
  const res = await apiFetch(`/api/me/notifications${qs}`);
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
  const data = (await res.json()) as { notifications?: MeNotificationRow[] };
  return data.notifications ?? [];
}

export async function markNotificationReadApi(notificationId: string): Promise<void> {
  const res = await apiFetch(`/api/me/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
}
