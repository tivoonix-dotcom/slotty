import { HUB_PATH, SERVICES_PATH, getServiceCategoryPath } from '../../app/paths';
import { getServiceCategoryLabel } from '../../features/catalog/serviceCategoryLabels';
import { getCategorySeoIntro } from './catalogSeoIntro';
import { buildBreadcrumbListJsonLd } from './masterStructuredData';
import { buildCanonicalUrl } from './seoSite';

export function buildCategoryStructuredData(categoryCode: string): Record<string, unknown>[] {
  const categoryName = getServiceCategoryLabel(categoryCode);
  const categoryPath = getServiceCategoryPath(categoryCode);
  const pageUrl = buildCanonicalUrl(categoryPath);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${categoryName} в Минске — SLOTTY`,
      url: pageUrl,
      description: getCategorySeoIntro(categoryCode),
      isPartOf: {
        '@type': 'WebSite',
        url: buildCanonicalUrl(HUB_PATH),
      },
    },
    buildBreadcrumbListJsonLd([
      { name: 'SLOTTY', path: HUB_PATH },
      { name: 'Услуги', path: SERVICES_PATH },
      { name: categoryName, path: categoryPath },
    ]),
  ];
}

export function buildServicesCatalogStructuredData(): Record<string, unknown>[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Услуги мастеров в Минске — SLOTTY',
      url: buildCanonicalUrl(SERVICES_PATH),
      description:
        'Каталог услуг мастеров в Минске с ценами, свободными окнами и онлайн-записью через SLOTTY.',
    },
    buildBreadcrumbListJsonLd([
      { name: 'SLOTTY', path: HUB_PATH },
      { name: 'Услуги', path: SERVICES_PATH },
    ]),
  ];
}
