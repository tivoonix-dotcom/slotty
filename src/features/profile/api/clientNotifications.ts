import { apiFetch } from '../../../shared/api/backendClient';

export type MeNotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export async function fetchMyNotifications(): Promise<MeNotificationRow[]> {
  const res = await apiFetch('/api/me/notifications');
  if (!res.ok) {
    throw new Error(`NOTIFICATIONS_HTTP_${res.status}`);
  }
  const data = (await res.json()) as { notifications?: MeNotificationRow[] };
  return data.notifications ?? [];
}

export async function markNotificationReadApi(notificationId: string): Promise<void> {
  const res = await apiFetch(`/api/me/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  });
  if (!res.ok) {
    throw new Error(`NOTIFICATION_READ_${res.status}`);
  }
}
