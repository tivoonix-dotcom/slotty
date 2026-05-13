import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '../../../shared/api/supabase';

export interface MasterFeedItem {
  id: string;
  full_name: string;
  avatar_url: string | null;
  rating: number;
  /** Короткая строка под именем (адрес / район без отдельного поля «город»). */
  addressLine: string;
  priceFrom: string;
}

const DEMO: MasterFeedItem[] = [
  {
    id: 'demo-1',
    full_name: 'Анна Волкова',
    avatar_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop',
    rating: 4.9,
    addressLine: 'ул. Немига · ~1 км',
    priceFrom: 'от 40 BYN',
  },
  {
    id: 'demo-2',
    full_name: 'Studio Glow',
    avatar_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
    rating: 4.8,
    addressLine: 'центр · студия',
    priceFrom: 'от 55 BYN',
  },
  {
    id: 'demo-3',
    full_name: 'Мария Ким',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    rating: 5,
    addressLine: 'пр-т Независимости',
    priceFrom: 'от 35 BYN',
  },
];

export function useMastersFeed() {
  return useQuery({
    queryKey: ['masters-feed'],
    queryFn: async (): Promise<MasterFeedItem[]> => {
      const sb = getSupabase();
      if (!sb) return DEMO;

      const { data, error } = await sb
        .from('profiles')
        .select('id, full_name, avatar_url, masters_metadata ( rating )')
        .eq('role', 'master')
        .limit(8);

      if (error || !data?.length) return DEMO;

      return data.map((row: Record<string, unknown>) => {
        const meta = row.masters_metadata as { rating?: string } | { rating?: string }[] | null;
        const ratingVal = Array.isArray(meta) ? meta[0]?.rating : meta?.rating;
        const r = ratingVal ? Number.parseFloat(String(ratingVal)) : 4.8;
        return {
          id: String(row.id),
          full_name: String(row.full_name ?? 'Мастер'),
          avatar_url: (row.avatar_url as string | null) ?? null,
          rating: Number.isFinite(r) ? r : 4.8,
          addressLine: 'Адрес в профиле',
          priceFrom: 'от 40 BYN',
        };
      });
    },
  });
}
