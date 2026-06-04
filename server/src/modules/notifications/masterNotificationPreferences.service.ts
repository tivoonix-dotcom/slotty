import { query } from '../../config/db.js';
import { clearMasterNotificationPreferencesCache } from './masterNotificationPreferences.deliver.js';
import {
  defaultMasterNotificationPreferences,
  normalizeIncomingPreferences,
  type MasterNotificationPreferencesDto,
} from './masterNotificationPreferences.state.js';

type Row = {
  channels: unknown;
  events: unknown;
  updated_at: string;
};

function rowToDto(row: Row | undefined): MasterNotificationPreferencesDto {
  if (!row) return defaultMasterNotificationPreferences();
  const merged = normalizeIncomingPreferences({
    channels: row.channels,
    events: row.events,
  });
  return { ...merged, updatedAt: row.updated_at };
}

export async function getMasterNotificationPreferences(
  profileId: string,
): Promise<MasterNotificationPreferencesDto> {
  const r = await query<Row>(
    `select channels, events, updated_at::text
     from public.master_notification_preferences
     where profile_id = $1`,
    [profileId],
  );
  return rowToDto(r.rows[0]);
}

export async function upsertMasterNotificationPreferences(
  profileId: string,
  payload: unknown,
): Promise<MasterNotificationPreferencesDto> {
  const normalized = normalizeIncomingPreferences(payload);
  const r = await query<Row>(
    `insert into public.master_notification_preferences (profile_id, channels, events, updated_at)
     values ($1, $2::jsonb, $3::jsonb, now())
     on conflict (profile_id) do update set
       channels = excluded.channels,
       events = excluded.events,
       updated_at = now()
     returning channels, events, updated_at::text`,
    [profileId, JSON.stringify(normalized.channels), JSON.stringify(normalized.events)],
  );
  clearMasterNotificationPreferencesCache(profileId);
  return rowToDto(r.rows[0]);
}
