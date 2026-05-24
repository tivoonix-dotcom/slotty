import { AdminTabIntroBanner } from '../AdminTabIntroBanner';
import { servicesTabPhotoSrc } from './adminServicesTheme';
import type { ServicesTabId } from './servicesTypes';

export const SERVICES_TAB_INTRO_IMAGES = [
  servicesTabPhotoSrc('11.webp'),
  servicesTabPhotoSrc('22.webp'),
  servicesTabPhotoSrc('33.webp'),
  servicesTabPhotoSrc('44.webp'),
] as const;

const TAB_INTRO: Record<ServicesTabId, { title: string; imageSrc: string; description?: string }> = {
  catalog: { title: 'Услуги', imageSrc: servicesTabPhotoSrc('11.webp') },
  price: { title: 'Прайс', imageSrc: servicesTabPhotoSrc('22.webp') },
  bundles: {
    title: 'Наборы',
    imageSrc: servicesTabPhotoSrc('33.webp'),
    description:
      'Соберите несколько услуг в одно предложение со скидкой — клиент видит выгоду, вы повышаете средний чек при записи.',
  },
  promotions: {
    title: 'Акции',
    imageSrc: servicesTabPhotoSrc('44.webp'),
    description:
      'Запускайте скидки и спецпредложения на услуги с датами начала и окончания — они показываются в каталоге и при записи.',
  },
};

type Props = {
  tab: ServicesTabId;
};

export function ServicesTabIntro({ tab }: Props) {
  const { title, imageSrc, description } = TAB_INTRO[tab];

  return (
    <div className="space-y-3 pb-4" role="region" aria-label={title}>
      <AdminTabIntroBanner title={title} imageSrc={imageSrc} />
      {description ? (
        <p className="px-0.5 text-[14px] font-medium leading-relaxed text-[#6B7280] lg:hidden">
          {description}
        </p>
      ) : null}
    </div>
  );
}
