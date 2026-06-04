import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type NotificationEventKey =
  | 'new_booking'
  | 'cancel'
  | 'reminder_1h'
  | 'late'
  | 'arrived'
  | 'reviews'
  | 'disputes'
  | 'billing'
  | 'news';

export type NotificationEventPrefs = {
  telegram: boolean;
  email: boolean;
  inApp: boolean;
};

export type MasterNotificationPreferencesDto = {
  channels: {
    telegram: boolean;
    email: boolean;
    in_app: boolean;
  };
  events: Record<NotificationEventKey, NotificationEventPrefs>;
  updatedAt: string | null;
};

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export async function fetchMasterNotificationPreferences(): Promise<MasterNotificationPreferencesDto> {
  const res = await apiFetch('/api/me/master/notification-preferences');
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { preferences: MasterNotificationPreferencesDto };
  return j.preferences;
}

export async function saveMasterNotificationPreferences(
  payload: Pick<MasterNotificationPreferencesDto, 'channels' | 'events'>,
): Promise<MasterNotificationPreferencesDto> {
  const res = await apiFetch('/api/me/master/notification-preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { preferences: MasterNotificationPreferencesDto };
  return j.preferences;
}
