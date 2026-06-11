import { HOME_FAQ_ITEMS } from '../../pages/home/homeFaqContent';
import { SEO_SITE_NAME, SEO_SITE_ORIGIN } from './seoSite';

const BRAND_LOGO_URL = `${SEO_SITE_ORIGIN}/icons/icon-512.png`;

/** WebSite без SearchAction — нет единого публичного URL поиска по сайту. */
export function buildHubWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_SITE_NAME,
    url: SEO_SITE_ORIGIN,
    inLanguage: 'ru-BY',
  };
}

export function buildHubOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_SITE_NAME,
    url: SEO_SITE_ORIGIN,
    logo: BRAND_LOGO_URL,
  };
}

/** FAQPage — тексты совпадают с видимым блоком #faq на /book. */
export function buildHubFaqJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${item.lead} ${item.a}`,
      },
    })),
  };
}

export const HUB_STRUCTURED_DATA: Record<string, unknown>[] = [
  buildHubWebSiteJsonLd(),
  buildHubOrganizationJsonLd(),
  buildHubFaqJsonLd(),
];
