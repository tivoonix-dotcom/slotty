import type { MasterServiceCreatedDto } from '../../../features/admin/api/masterCabinetApi';
import type { MasterDraft, MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { ManagedService } from './servicesFormat';

export function cabinetServiceDtoToManaged(
  row: MasterServiceCreatedDto,
  fallbackSort = 0,
): ManagedService {
  return {
    id: row.id,
    title: row.title,
    durationMin: row.durationMinutes,
    priceByn: row.price,
    description: row.description || undefined,
    priceType: row.priceType === 'from' ? 'from' : 'fixed',
    isActive: row.isActive,
    sortOrder: row.sortOrder ?? fallbackSort,
    imageUrl: row.coverImageUrl ?? undefined,
    coverFocalX: row.coverFocalX,
    coverFocalY: row.coverFocalY,
  };
}

export function reindexManagedServices(list: ManagedService[]): ManagedService[] {
  return list.map((service, index) => ({
    ...service,
    sortOrder: index,
  }));
}

export function draftWithServices(draft: MasterDraft, services: ManagedService[]): MasterDraft {
  return {
    ...draft,
    services: reindexManagedServices(services) as MasterOnboardingService[],
  };
}
