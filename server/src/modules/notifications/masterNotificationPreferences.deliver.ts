import { logNotification } from './notificationLog.js';
import { logNotificationDelivery } from './notificationDeliveriesInsert.js';
import {
  getMasterNotificationPreferences,
} from './masterNotificationPreferences.service.js';
import {
  MASTER_NOTIFICATION_ALWAYS_ON,
  MASTER_NOTIFICATION_EVENT_KEYS,
  type MasterNotificationEventKey,
} from './masterNotificationPreferences.state.js';
import type { NotificationJobType } from './notificationJobs.types.js';

export type MasterNotificationDeliveryChannel = 'telegram' | 'email' | 'in_app';

export { MASTER_NOTIFICATION_ALWAYS_ON };

const prefsCache = new Map<string, { at: number; prefs: Awaited<ReturnType<typeof getMasterNotificationPreferences>> }>();
const CACHE_MS = 30_000;

async function loadPrefs(userId: string) {
  const hit = prefsCache.get(userId);
  const now = Date.now();
  if (hit && now - hit.at < CACHE_MS) return hit.prefs;
  const prefs = await getMasterNotificationPreferences(userId);
  prefsCache.set(userId, { at: now, prefs });
  return prefs;
}

export function clearMasterNotificationPreferencesCache(userId?: string): void {
  if (userId) prefsCache.delete(userId);
  else prefsCache.clear();
}

export function mapNotificationJobTypeToPreferenceEvent(
  jobType: NotificationJobType,
  forMaster: boolean,
): MasterNotificationEventKey | null {
  if (!forMaster) return null;
  switch (jobType) {
    case 'booking_master_new':
      return 'new_booking';
    case 'booking_reminder_1h':
    case 'booking_reminder_24h':
      return 'reminder_1h';
    case 'booking_master_client_cancelled':
      return 'cancel';
    default:
      return null;
  }
}

export type MasterImmediateNotifyKind =
  | 'booking_created'
  | 'booking_cancelled'
  | 'client_running_late'
  | 'client_arrived'
  | 'review_received'
  | 'dispute_created'
  | 'billing'
  | 'slotty_news';

export function mapMasterImmediateNotifyKind(
  kind: MasterImmediateNotifyKind,
): MasterNotificationEventKey | null {
  switch (kind) {
    case 'booking_created':
      return 'new_booking';
    case 'booking_cancelled':
      return 'cancel';
    case 'client_running_late':
      return 'late';
    case 'client_arrived':
      return 'arrived';
    case 'review_received':
      return 'reviews';
    case 'dispute_created':
      return 'disputes';
    case 'billing':
      return 'billing';
    case 'slotty_news':
      return 'news';
    default:
      return null;
  }
}

export function logPreferenceSkipped(
  userId: string,
  eventType: MasterNotificationEventKey,
  channel: MasterNotificationDeliveryChannel,
): void {
  logNotification('notification.preference.skipped', {
    userId,
    eventType,
    channel,
    reason: 'preference_disabled',
  });
}

export async function shouldDeliverMasterNotification(
  userId: string,
  eventType: MasterNotificationEventKey,
  channel: MasterNotificationDeliveryChannel,
): Promise<boolean> {
  if (!MASTER_NOTIFICATION_EVENT_KEYS.includes(eventType)) return true;
  if (MASTER_NOTIFICATION_ALWAYS_ON.has(eventType)) return true;

  const prefs = await loadPrefs(userId);
  if (!prefs.channels.telegram && channel === 'telegram') return false;
  if (!prefs.channels.email && channel === 'email') return false;
  if (!prefs.channels.in_app && channel === 'in_app') return false;

  const ev = prefs.events[eventType];
  if (!ev) return true;

  if (channel === 'telegram') return ev.telegram;
  if (channel === 'email') return ev.email;
  return ev.inApp;
}

export async function logPreferenceDisabledDelivery(params: {
  profileId: string;
  eventType: MasterNotificationEventKey;
  channel: MasterNotificationDeliveryChannel;
  notificationId?: string | null;
}): Promise<void> {
  logPreferenceSkipped(params.profileId, params.eventType, params.channel);
  if (params.channel === 'telegram') {
    await logNotificationDelivery({
      notificationId: params.notificationId ?? null,
      profileId: params.profileId,
      channel: 'telegram',
      status: 'skipped',
      dedupeKey: `pref:${params.eventType}:${params.channel}`,
      errorMessage: 'preference_disabled',
    }).catch(() => undefined);
  }
}
