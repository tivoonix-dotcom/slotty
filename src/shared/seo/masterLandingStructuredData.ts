import { MASTER_LANDING_FAQ_ITEMS } from '../../pages/home/masterLandingFaqContent';
import { MASTER_START_PATH } from '../../app/paths';
import { buildHubOrganizationJsonLd } from './hubStructuredData';
import { buildBreadcrumbListJsonLd } from './masterStructuredData';
import { buildCanonicalUrl } from './seoSite';

function buildMasterLandingFaqJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: MASTER_LANDING_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${item.lead} ${item.a}`,
      },
    })),
  };
}

export const MASTER_LANDING_STRUCTURED_DATA: Record<string, unknown>[] = [
  buildHubOrganizationJsonLd(),
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'SLOTTY для мастеров — кабинет, запись и тарифы',
    url: buildCanonicalUrl(MASTER_START_PATH),
    description:
      'Онлайн-запись для ваших клиентов в Минске: профиль в каталоге, услуги, расписание и заявки.',
    inLanguage: 'ru-BY',
  },
  buildMasterLandingFaqJsonLd(),
  buildBreadcrumbListJsonLd([
    { name: 'SLOTTY', path: '/book' },
    { name: 'Для мастеров', path: MASTER_START_PATH },
  ]),
];
