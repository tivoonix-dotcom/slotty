export type ServicesTabId = 'catalog' | 'price' | 'bundles' | 'promotions';

export type ServicePromotionTemplate =
  | 'first_visit'
  | 'weekly_combo'
  | 'seasonal'
  | 'happy_hours'
  | 'free_slots'
  /** @deprecated legacy stored promos */
  | 'percent'
  | 'bundle'
  | 'gift';

export type ServicePromotionStatus = 'active' | 'scheduled' | 'finished' | 'draft';

export type ServicePromotionDiscountType = 'percent' | 'money' | 'gift';

/** @deprecated legacy */
export type ServicePromotionImageSource = 'service' | 'portfolio' | 'upload' | 'template';

export type ServicePromotion = {
  id: string;
  template: ServicePromotionTemplate;
  title: string;
  description: string;
  serviceId: string;
  serviceTitle: string;
  discountType: ServicePromotionDiscountType;
  discountValue: number;
  discountLabel: string;
  startsAt: string;
  endsAt: string;
  status: ServicePromotionStatus;
  backgroundImage: string;
  createdAt: string;
  /** @deprecated */
  bundleId?: string;
  imageUrl?: string;
  imageSource?: ServicePromotionImageSource;
};

export type ServiceBundleStatus = 'visible' | 'hidden' | 'draft';

export type ServiceBundleImageSource = 'service' | 'portfolio' | 'upload' | 'placeholder';

export type ServiceBundle = {
  id: string;
  title: string;
  description: string;
  serviceIds: string[];
  originalPrice: number;
  bundlePrice: number;
  discountPercent: number;
  discountAmount: number;
  durationMinutes: number;
  imageUrl?: string;
  imageSource: ServiceBundleImageSource;
  status: ServiceBundleStatus;
  createdAt: string;
  updatedAt: string;
  /** @deprecated */
  priceByn?: number;
  /** @deprecated */
  oldPriceByn?: number;
  /** @deprecated */
  isActive?: boolean;
};

export const SERVICES_TAB_SUBTITLES: Record<ServicesTabId, string> = {
  catalog: 'Каталог ваших услуг и управление',
  price: 'Цена и длительность услуг',
  bundles: 'Пакеты услуг и выгодные предложения',
  promotions: 'Создавайте специальные предложения для клиентов',
};
