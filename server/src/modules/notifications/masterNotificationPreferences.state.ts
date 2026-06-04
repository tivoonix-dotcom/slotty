export const MASTER_NOTIFICATION_EVENT_KEYS = [
  'new_booking',
  'cancel',
  'reminder_1h',
  'late',
  'arrived',
  'reviews',
  'disputes',
  'billing',
  'news',
] as const;

export type MasterNotificationEventKey = (typeof MASTER_NOTIFICATION_EVENT_KEYS)[number];

/** Нельзя отключить в UI и при сохранении. */
export const MASTER_NOTIFICATION_ALWAYS_ON: ReadonlySet<MasterNotificationEventKey> = new Set([
  'billing',
  'new_booking',
]);

export type MasterNotificationChannelFlags = {
  telegram: boolean;
  email: boolean;
  in_app: boolean;
};

export type MasterNotificationEventPrefs = {
  telegram: boolean;
  email: boolean;
  inApp: boolean;
};

export type MasterNotificationPreferencesDto = {
  channels: MasterNotificationChannelFlags;
  events: Record<MasterNotificationEventKey, MasterNotificationEventPrefs>;
  updatedAt: string | null;
};

function defaultEventPrefs(): MasterNotificationEventPrefs {
  return { telegram: true, email: false, inApp: true };
}

export function defaultMasterNotificationPreferences(): MasterNotificationPreferencesDto {
  const events = {} as Record<MasterNotificationEventKey, MasterNotificationEventPrefs>;
  for (const key of MASTER_NOTIFICATION_EVENT_KEYS) {
    if (key === 'new_booking' || key === 'reviews' || key === 'disputes' || key === 'billing') {
      events[key] = { telegram: true, email: true, inApp: true };
    } else if (key === 'news') {
      events[key] = { telegram: false, email: true, inApp: true };
    } else {
      events[key] = defaultEventPrefs();
    }
  }
  return {
    channels: { telegram: true, email: true, in_app: true },
    events,
    updatedAt: null,
  };
}

export function normalizeIncomingPreferences(
  raw: unknown,
): MasterNotificationPreferencesDto {
  const base = defaultMasterNotificationPreferences();
  if (!raw || typeof raw !== 'object') return base;

  const o = raw as {
    channels?: Record<string, unknown>;
    events?: Record<string, unknown>;
  };

  if (o.channels && typeof o.channels === 'object') {
    base.channels = {
      telegram: Boolean(o.channels.telegram ?? base.channels.telegram),
      email: Boolean(o.channels.email ?? base.channels.email),
      in_app: Boolean(o.channels.in_app ?? o.channels.inApp ?? base.channels.in_app),
    };
  }

  if (o.events && typeof o.events === 'object') {
    for (const key of MASTER_NOTIFICATION_EVENT_KEYS) {
      const row = o.events[key];
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      base.events[key] = {
        telegram: Boolean(r.telegram ?? base.events[key].telegram),
        email: Boolean(r.email ?? base.events[key].email),
        inApp: Boolean(r.inApp ?? r.in_app ?? base.events[key].inApp),
      };
    }
  }

  for (const key of MASTER_NOTIFICATION_ALWAYS_ON) {
    base.events[key] = { telegram: true, email: true, inApp: true };
  }

  return base;
}

export function isAlwaysOnMasterNotificationEvent(eventType: MasterNotificationEventKey): boolean {
  return MASTER_NOTIFICATION_ALWAYS_ON.has(eventType);
}

