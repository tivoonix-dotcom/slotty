import { getSupabase } from '../../../shared/api/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '../../../shared/api/types';

/** Тихое обновление роли текущего пользователя (нужна сессия Supabase Auth). */
export async function setProfileRole(role: UserRole): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;
  const client = sb as SupabaseClient;
  const { error } = await client.from('profiles').update({ role }).eq('id', user.id);
  if (error) console.warn('[SLOTTY] profiles.role update skipped:', error.message);
}
