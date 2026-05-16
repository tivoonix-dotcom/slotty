import { AdminTabIntroBanner } from '../AdminTabIntroBanner';
import { servicesTabPhotoSrc } from './adminServicesTheme';
import type { ServicesTabId } from './servicesTypes';
import { SERVICES_TAB_SUBTITLES } from './servicesTypes';

export const SERVICES_TAB_INTRO_IMAGES = [
  servicesTabPhotoSrc('11.webp'),
  servicesTabPhotoSrc('22.webp'),
  servicesTabPhotoSrc('33.webp'),
  servicesTabPhotoSrc('44.webp'),
] as const;

const TAB_INTRO: Record<ServicesTabId, { title: string; description: string; imageSrc: string }> = {
  catalog: {
    title: 'Услуги',
    description: SERVICES_TAB_SUBTITLES.catalog,
    imageSrc: servicesTabPhotoSrc('11.webp'),
  },
  price: {
    title: 'Прайс',
    description: SERVICES_TAB_SUBTITLES.price,
    imageSrc: servicesTabPhotoSrc('22.webp'),
  },
  bundles: {
    title: 'Наборы',
    description: SERVICES_TAB_SUBTITLES.bundles,
    imageSrc: servicesTabPhotoSrc('33.webp'),
  },
  promotions: {
    title: 'Акции',
    description: SERVICES_TAB_SUBTITLES.promotions,
    imageSrc: servicesTabPhotoSrc('44.webp'),
  },
};

type Props = {
  tab: ServicesTabId;
};

export function ServicesTabIntro({ tab }: Props) {
  const { title, description, imageSrc } = TAB_INTRO[tab];

  return (
    <AdminTabIntroBanner
      title={title}
      description={description}
      imageSrc={imageSrc}
      wrapper="header"
    />
  );
}
