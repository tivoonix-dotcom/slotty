/**
 * Канонический production origin для SEO (canonical, OG, JSON-LD).
 * Не подставлять window.location / Railway / localhost — только этот домен.
 */
export const SEO_SITE_ORIGIN = 'https://slotty.of.by';

export const SEO_DEFAULT_OG_IMAGE = `${SEO_SITE_ORIGIN}/og/og-default.jpg`;

export const SEO_SERVICES_OG_IMAGE = `${SEO_SITE_ORIGIN}/og/og-services.jpg`;

export const SEO_MASTER_LANDING_OG_IMAGE = `${SEO_SITE_ORIGIN}/og/og-master-landing.jpg`;

export const SEO_DEFAULT_OG_IMAGE_WIDTH = 1200;

export const SEO_DEFAULT_OG_IMAGE_HEIGHT = 630;

export const SEO_SITE_NAME = 'SLOTTY';

export const SEO_DEFAULT_ROBOTS = 'index,follow';

export const SEO_NOINDEX_ROBOTS = 'noindex,nofollow';

export function buildCanonicalUrl(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SEO_SITE_ORIGIN}${path}`;
}
