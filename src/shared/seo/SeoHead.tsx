import { Helmet } from 'react-helmet-async';
import type { SeoMeta } from './seoConfig';
import {
  buildCanonicalUrl,
  SEO_DEFAULT_OG_IMAGE,
  SEO_DEFAULT_OG_IMAGE_HEIGHT,
  SEO_DEFAULT_OG_IMAGE_WIDTH,
  SEO_SITE_NAME,
} from './seoSite';

type Props = {
  meta: SeoMeta;
};

/** Updates document meta tags only (no visible UI). */
export function SeoHead({ meta }: Props) {
  const canonical =
    meta.canonicalPath != null && meta.canonicalPath !== ''
      ? buildCanonicalUrl(meta.canonicalPath)
      : undefined;
  const ogImage = meta.ogImage;
  const ogUrl = canonical;
  const isDefaultOg = ogImage === SEO_DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content={meta.robots} />
      <meta property="og:locale" content="ru_BY" />
      {canonical ? <link rel="canonical" href={canonical} /> : null}

      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:site_name" content={SEO_SITE_NAME} />
      <meta property="og:type" content="website" />
      {ogUrl ? <meta property="og:url" content={ogUrl} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {isDefaultOg ? (
        <>
          <meta property="og:image:width" content={String(SEO_DEFAULT_OG_IMAGE_WIDTH)} />
          <meta property="og:image:height" content={String(SEO_DEFAULT_OG_IMAGE_HEIGHT)} />
        </>
      ) : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
}
