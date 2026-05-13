import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '../../../shared/api/supabase';
import type { UserRole } from '../../../shared/api/types';

export function useMasterPreview(masterId: string | undefined) {
  return useQuery({
    queryKey: ['master-preview', masterId],
    placeholderData: { displayName: 'Элина Соколова' },
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb || !masterId) {
        return { displayName: 'Элина Соколова' };
      }
      const res = await sb
        .from('profiles')
        .select('full_name, role')
        .eq('id', masterId)
        .eq('role', 'master')
        .maybeSingle();
      if (res.error) throw res.error;
      const row = res.data as { full_name: string; role: UserRole } | null;
      return { displayName: row?.full_name ?? 'Мастер' };
    },
  });
}
