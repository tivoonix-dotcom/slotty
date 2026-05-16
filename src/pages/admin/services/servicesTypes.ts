export type ServicesTabId = 'catalog' | 'price' | 'bundles' | 'promotions';

export type ServicePromotionTemplate =
  | 'percent'
  | 'first_visit'
  | 'weekly_combo'
  | 'seasonal'
  | 'bundle'
  | 'gift'
  | 'happy_hours';

export type ServicePromotionStatus = 'active' | 'scheduled' | 'finished' | 'draft';

export type ServicePromotionImageSource = 'service' | 'portfolio' | 'upload' | 'template';

export type ServicePromotion = {
  id: string;
  title: string;
  description: string;
  template: ServicePromotionTemplate;
  status: ServicePromotionStatus;
  discountLabel: string;
  serviceId?: string;
  bundleId?: string;
  imageUrl?: string;
  imageSource: ServicePromotionImageSource;
  startsAt: string;
  endsAt: string;
};

export type ServiceBundle = {
  id: string;
  title: string;
  serviceIds: string[];
  priceByn: number;
  oldPriceByn: number;
  imageUrl?: string;
  isActive: boolean;
};

export const PROMOTION_TEMPLATE_META: Record<
  ServicePromotionTemplate,
  { label: string; defaultTitle: string; defaultDescription: string; defaultDiscount: string }
> = {
  percent: {
    label: 'Скидка %',
    defaultTitle: 'Скидка на услугу',
    defaultDescription: 'Специальное предложение для клиентов',
    defaultDiscount: '-15%',
  },
  first_visit: {
    label: 'Первый визит',
    defaultTitle: 'Скидка для новых клиентов',
    defaultDescription: 'На первый визит в студию',
    defaultDiscount: '-15%',
  },
  weekly_combo: {
    label: 'Комплекс недели',
    defaultTitle: 'Комплекс недели',
    defaultDescription: 'Выгодное сочетание услуг',
    defaultDiscount: '-20%',
  },
  seasonal: {
    label: 'Сезонная акция',
    defaultTitle: 'Сезонная акция',
    defaultDescription: 'На выбранные услуги',
    defaultDiscount: '-25%',
  },
  bundle: {
    label: '2 услуги выгоднее',
    defaultTitle: 'Две услуги вместе',
    defaultDescription: 'Запишитесь на комплекс со скидкой',
    defaultDiscount: '-17%',
  },
  gift: {
    label: 'Подарок',
    defaultTitle: 'Подарок к услуге',
    defaultDescription: 'Бонус при записи',
    defaultDiscount: 'Подарок',
  },
  happy_hours: {
    label: 'Счастливые часы',
    defaultTitle: 'Счастливые часы',
    defaultDescription: 'Скидка в выбранное время',
    defaultDiscount: '-10%',
  },
};

export const SERVICES_TAB_SUBTITLES: Record<ServicesTabId, string> = {
  catalog: 'Каталог ваших услуг и управление',
  price: 'Цена и длительность услуг',
  bundles: 'Пакеты услуг и выгодные предложения',
  promotions: 'Акции и специальные предложения',
};
