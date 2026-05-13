import { useQuery } from '@tanstack/react-query';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import { defaultMasterAvatarUrl } from '../../master/model/masterDraftStorage';
import type { MasterLocation } from '../../profile/model/masterLocation';
import { formatPublicAddress } from '../../profile/model/masterLocation';
import { fetchPublishedMasters, type PublishedMasterDto } from '../../services/api/publishedMastersApi';

export interface MasterFeedItem {
  id: string;
  full_name: string;
  avatar_url: string | null;
  rating: number;
  /** Короткая строка под именем (адрес / район без отдельного поля «город»). */
  addressLine: string;
  priceFrom: string;
}

function publishedToFeedItem(m: PublishedMasterDto): MasterFeedItem {
  let addressLine = 'Адрес в профиле';
  if (m.location) {
    const loc: MasterLocation = {
      visitType: 'studio',
      city: m.location.city?.trim() || undefined,
      street: (m.location.publicAddress || '').trim() || '—',
      building: '',
    };
    addressLine = formatPublicAddress(loc) || addressLine;
  }
  const name = m.displayName.trim() || 'Мастер';
  const price =
    m.minServicePrice != null && Number.isFinite(m.minServicePrice)
      ? `от ${Math.round(m.minServicePrice)} BYN`
      : '—';

  return {
    id: m.masterId,
    full_name: name,
    avatar_url: (m.photoUrl && m.photoUrl.trim()) || defaultMasterAvatarUrl(name),
    rating: m.rating,
    addressLine,
    priceFrom: price,
  };
}

export function useMastersFeed() {
  return useQuery({
    queryKey: ['masters-feed', 'published'],
    queryFn: async (): Promise<MasterFeedItem[]> => {
      if (!getApiBaseUrl()) return [];
      const masters = await fetchPublishedMasters({ limit: 24 });
      return masters.map(publishedToFeedItem);
    },
  });
}
