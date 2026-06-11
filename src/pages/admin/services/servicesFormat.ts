import { EMPTY_DURATION } from '../../../shared/lib/emptyDisplayText';
import {
  getCategoryWorkPhotoUrl,
  resolveCategoryWorkCode,
} from '../../../features/catalog/categoryWorkPhotos';
import type { MasterDraft, MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { ServicePromotion, ServicePromotionStatus } from './servicesTypes';

export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function derivePromotionStatus(
  promo: Pick<ServicePromotion, 'status' | 'startsAt' | 'endsAt'>,
  today = isoDateLocal(new Date()),
): ServicePromotionStatus {
  if (promo.status === 'draft') return 'draft';
  if (promo.endsAt < today) return 'finished';
  if (promo.startsAt > today) return 'scheduled';
  return 'active';
}

export type ManagedService = MasterOnboardingService & {
  priceType?: 'fixed' | 'from';
  isActive?: boolean;
  sortOrder?: number;
  imageUrl?: string;
  coverFocalX?: number;
  coverFocalY?: number;
};

export function formatServicePrice(service: ManagedService): string {
  const prefix = service.priceType === 'from' ? 'от ' : '';
  return `${prefix}${service.priceByn} BYN`;
}

export function formatDurationRu(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return EMPTY_DURATION;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} мин`;
  if (m <= 0) return `${h} ч`;
  return `${h} ч ${m}м`;
}

function portfolioImageUrls(draft: MasterDraft): string[] {
  return (draft.portfolio ?? [])
    .map((p) => p.imageUrl?.trim())
    .filter((url): url is string => Boolean(url));
}

/** Фото категории мастера (`public/photos/каталог_услуги/`). */
export function draftCategoryWorkImageUrl(draft: MasterDraft): string {
  const code = resolveCategoryWorkCode(draft.primaryCategoryCode ?? draft.category);
  return getCategoryWorkPhotoUrl(code);
}

function portfolioImageForService(
  draft: MasterDraft,
  serviceId: string,
  serviceIndex: number,
): string | null {
  const urls = portfolioImageUrls(draft);
  if (!urls.length) return null;
  let idx = serviceIndex % urls.length;
  for (let i = 0; i < serviceId.length; i++) {
    idx = (idx + serviceId.charCodeAt(i)) % urls.length;
  }
  return urls[idx] ?? urls[0];
}

/** Превью в каталоге услуг: своё фото услуги или фото категории мастера. */
export function serviceCatalogThumbnailUrl(
  service: ManagedService,
  draft: MasterDraft,
): string {
  if (service.imageUrl?.trim()) return service.imageUrl.trim();
  return draftCategoryWorkImageUrl(draft);
}

/** Превью услуги: своё фото → работа из портфолио → фото категории. */
export function serviceImageUrl(
  service: ManagedService,
  draft: MasterDraft,
  serviceIndex = 0,
): string | null {
  if (service.imageUrl?.trim()) return service.imageUrl.trim();
  const fromPortfolio = portfolioImageForService(draft, service.id, serviceIndex);
  if (fromPortfolio) return fromPortfolio;
  return draftCategoryWorkImageUrl(draft);
}

export function resolvePromotionImage(params: {
  serviceId?: string;
  bundleId?: string;
  services: ManagedService[];
  bundles: { id: string; serviceIds: string[]; imageUrl?: string }[];
  draft: MasterDraft;
  fallback?: string;
}): string | null {
  const { serviceId, bundleId, services, bundles, draft, fallback } = params;
  if (fallback?.trim()) return fallback.trim();

  if (serviceId) {
    const svc = services.find((s) => s.id === serviceId);
    if (svc) return serviceImageUrl(svc, draft);
  }

  if (bundleId) {
    const bundle = bundles.find((b) => b.id === bundleId);
    if (bundle?.imageUrl) return bundle.imageUrl;
    const firstId = bundle?.serviceIds[0];
    if (firstId) {
      const svc = services.find((s) => s.id === firstId);
      if (svc) return serviceImageUrl(svc, draft);
    }
  }

  const portfolio = portfolioImageUrls(draft);
  if (portfolio[0]) return portfolio[0];
  return draftCategoryWorkImageUrl(draft);
}

export function promotionStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Активна';
    case 'scheduled':
      return 'Запланирована';
    case 'finished':
      return 'Завершена';
    default:
      return 'Черновик';
  }
}
