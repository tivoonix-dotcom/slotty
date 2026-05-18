import type { DemoMasterService } from '../../features/services/model/demoMasters';

export function formatServicePrice(service: DemoMasterService): string {
  if (service.price <= 0) return 'Бесплатно';
  const prefix = service.priceType === 'from' ? 'от ' : '';
  return `${prefix}${Math.round(service.price)} BYN`;
}
