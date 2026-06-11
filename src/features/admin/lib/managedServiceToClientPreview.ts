import type { DemoMasterService } from '../../services/model/demoMasters';
import type { MasterOnboardingService } from '../../profile/lib/demoMasterStorage';

/** Услуга кабинета → формат публичного профиля мастера (список при записи). */
export function managedServiceToClientPreview(
  service: MasterOnboardingService & { priceType?: 'fixed' | 'from' },
): DemoMasterService {
  return {
    id: service.id,
    title: service.title.trim() || 'Услуга',
    duration: service.durationMin,
    price: service.priceByn,
    description: service.description?.trim() ?? '',
    priceType: service.priceType ?? 'fixed',
    coverImageUrl: service.imageUrl?.trim() || undefined,
    coverFocalX: service.coverFocalX,
    coverFocalY: service.coverFocalY,
  };
}
