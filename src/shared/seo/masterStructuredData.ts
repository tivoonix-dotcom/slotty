import type { ExtendedMasterProfile } from '../../pages/client/masterProfile/types';
import { HUB_PATH, SERVICES_PATH, getMasterPath, getServiceCategoryPath } from '../../app/paths';
import { getServiceCategoryLabel } from '../../features/catalog/serviceCategoryLabels';
import { buildCanonicalUrl, SEO_SITE_NAME, SEO_SITE_ORIGIN } from './seoSite';
import { resolveSeoImageUrl } from './seoImageUrl';

type MasterStructuredDataInput = {
  master: ExtendedMasterProfile;
  masterId: string;
};

export function buildMasterProfileStructuredData({
  master,
  masterId,
}: MasterStructuredDataInput): Record<string, unknown>[] {
  const profileUrl = buildCanonicalUrl(getMasterPath(masterId));
  const image = resolveSeoImageUrl(master.photoUrl);
  const location = master.location;
  const city = location?.city?.trim() || 'Минск';
  const streetLine = [location?.street, location?.building].filter(Boolean).join(', ').trim();

  const graph: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: master.masterName,
      url: profileUrl,
      image,
      description: master.bio?.trim() || undefined,
      areaServed: {
        '@type': 'City',
        name: city,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        streetAddress: streetLine || undefined,
        addressCountry: 'BY',
      },
      parentOrganization: {
        '@type': 'Organization',
        name: SEO_SITE_NAME,
        url: SEO_SITE_ORIGIN,
      },
    },
  ];

  if (master.rating > 0 && master.reviewsCount > 0) {
    (graph[0] as Record<string, unknown>).aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(master.rating.toFixed(1)),
      reviewCount: master.reviewsCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const services = (master.services ?? [])
    .slice(0, 12)
    .map((service) => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: service.description?.trim() || undefined,
      provider: {
        '@type': 'ProfessionalService',
        name: master.masterName,
        url: profileUrl,
      },
      offers:
        service.price != null
          ? {
              '@type': 'Offer',
              price: service.price,
              priceCurrency: 'BYN',
            }
          : undefined,
    }));

  graph.push(...services);

  const categoryCode = master.categoryCode;
  const crumbs: Array<{ name: string; path: string }> = [
    { name: 'SLOTTY', path: HUB_PATH },
    { name: 'Услуги', path: SERVICES_PATH },
  ];
  if (categoryCode) {
    crumbs.push({
      name: getServiceCategoryLabel(categoryCode),
      path: getServiceCategoryPath(categoryCode),
    });
  }
  crumbs.push({ name: master.masterName, path: getMasterPath(masterId) });

  graph.push(buildBreadcrumbListJsonLd(crumbs));

  return graph;
}

export function buildBreadcrumbListJsonLd(
  items: ReadonlyArray<{ name: string; path: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}
