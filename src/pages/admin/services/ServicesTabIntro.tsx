import { AdminTabIntroBanner } from '../AdminTabIntroBanner';
import { servicesTabPhotoSrc } from './adminServicesTheme';
import type { ServicesTabId } from './servicesTypes';

export const SERVICES_TAB_INTRO_IMAGES = [
  servicesTabPhotoSrc('11.webp'),
  servicesTabPhotoSrc('22.webp'),
  servicesTabPhotoSrc('33.webp'),
  servicesTabPhotoSrc('44.webp'),
] as const;

const TAB_INTRO: Record<ServicesTabId, { title: string; imageSrc: string }> = {
  catalog: { title: 'Услуги', imageSrc: servicesTabPhotoSrc('11.webp') },
  price: { title: 'Прайс', imageSrc: servicesTabPhotoSrc('22.webp') },
  bundles: { title: 'Наборы', imageSrc: servicesTabPhotoSrc('33.webp') },
  promotions: { title: 'Акции', imageSrc: servicesTabPhotoSrc('44.webp') },
};

type Props = {
  tab: ServicesTabId;
};

export function ServicesTabIntro({ tab }: Props) {
  const { title, imageSrc } = TAB_INTRO[tab];

  return <AdminTabIntroBanner title={title} imageSrc={imageSrc} wrapper="header" />;
}
