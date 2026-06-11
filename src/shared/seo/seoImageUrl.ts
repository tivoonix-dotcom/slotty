import {
  isGoogleOAuthAvatarUrl,
  isMasterCardPortraitUrl,
} from '../../features/masters/lib/masterListingPortrait';
import { SEO_DEFAULT_OG_IMAGE } from './seoSite';

function isBlockedOgHost(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.local') ||
    host.includes('railway.app')
  );
}

/** Абсолютный URL изображения для OG/Twitter; без localhost и генераторов. */
export function resolveSeoImageUrl(raw: string | null | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed || !isMasterCardPortraitUrl(trimmed) || isGoogleOAuthAvatarUrl(trimmed)) {
    return SEO_DEFAULT_OG_IMAGE;
  }
  if (trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      if (isBlockedOgHost(url)) return SEO_DEFAULT_OG_IMAGE;
      return trimmed;
    } catch {
      return SEO_DEFAULT_OG_IMAGE;
    }
  }
  if (trimmed.startsWith('http://')) return SEO_DEFAULT_OG_IMAGE;
  if (trimmed.startsWith('/')) {
    return `https://slotty.of.by${trimmed}`;
  }
  return SEO_DEFAULT_OG_IMAGE;
}
