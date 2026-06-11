import {
  SEO_DEFAULT_OG_IMAGE,
  SEO_SITE_ORIGIN,
} from './seoSite';

/** Production JPG 1200×630 для Open Graph (Telegram, Facebook, LinkedIn). */
const CATEGORY_OG_JPG: Record<string, string> = {
  manicure: '/og/og-category-manicure.jpg',
  barbers: '/og/og-category-barbers.jpg',
  'brows-lashes': '/og/og-category-brows-lashes.jpg',
  massage: '/og/og-category-massage.jpg',
  fitness: '/og/og-category-fitness.jpg',
  tattoo: '/og/og-category-tattoo.jpg',
};

export function getCategoryOgImage(categoryCode: string): string {
  const path = CATEGORY_OG_JPG[categoryCode.trim().toLowerCase()];
  return path ? `${SEO_SITE_ORIGIN}${path}` : SEO_DEFAULT_OG_IMAGE;
}
