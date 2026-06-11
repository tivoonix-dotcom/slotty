import { getServiceCoverStockPhotoUrl } from '../../features/catalog/serviceCoverStockPhoto';

export type MasterLandingServiceDemoCategory = {
  id: string;
  chip: string;
  title: string;
  price: string;
  titlePlaceholder: string;
  pricePlaceholder: string;
  categoryCode: string;
  coverSrc: string;
};

export const MASTER_LANDING_SERVICE_DEMO_CATEGORIES: MasterLandingServiceDemoCategory[] = [
  {
    id: 'manicure',
    chip: 'Маникюр',
    title: 'Маникюр с покрытием',
    price: '45',
    titlePlaceholder: 'Например, маникюр с покрытием',
    pricePlaceholder: '45',
    categoryCode: 'manicure',
    coverSrc: getServiceCoverStockPhotoUrl('manicure', 'Маникюр'),
  },
  {
    id: 'pedicure',
    chip: 'Педикюр',
    title: 'Педикюр с покрытием',
    price: '55',
    titlePlaceholder: 'Например, педикюр с покрытием',
    pricePlaceholder: '55',
    categoryCode: 'manicure',
    coverSrc: getServiceCoverStockPhotoUrl('manicure', 'Педикюр'),
  },
  {
    id: 'gel',
    chip: 'Гель-лак',
    title: 'Гель-лак',
    price: '35',
    titlePlaceholder: 'Например, гель-лак',
    pricePlaceholder: '35',
    categoryCode: 'manicure',
    coverSrc: getServiceCoverStockPhotoUrl('manicure', 'Гель-лак'),
  },
];
