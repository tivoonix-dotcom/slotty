import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';
import type { ServiceBundle, ServicePromotion } from '../../../pages/admin/services/servicesTypes';

async function readApiError(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export type MasterBundleDto = {
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
  imageSource: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type MasterPromotionDto = {
  id: string;
  template: string;
  title: string;
  description: string;
  serviceId: string;
  serviceTitle: string;
  discountType: string;
  discountValue: number;
  discountLabel: string;
  startsAt: string;
  endsAt: string;
  status: string;
  backgroundImage: string;
  createdAt: string;
};

export function bundleDtoToClient(row: MasterBundleDto): ServiceBundle {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    serviceIds: row.serviceIds,
    originalPrice: row.originalPrice,
    bundlePrice: row.bundlePrice,
    discountPercent: row.discountPercent,
    discountAmount: row.discountAmount,
    durationMinutes: row.durationMinutes,
    imageUrl: row.imageUrl,
    imageSource: row.imageSource as ServiceBundle['imageSource'],
    status: row.status as ServiceBundle['status'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function promotionDtoToClient(row: MasterPromotionDto): ServicePromotion {
  return {
    id: row.id,
    template: row.template as ServicePromotion['template'],
    title: row.title,
    description: row.description,
    serviceId: row.serviceId,
    serviceTitle: row.serviceTitle,
    discountType: row.discountType as ServicePromotion['discountType'],
    discountValue: row.discountValue,
    discountLabel: row.discountLabel,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status as ServicePromotion['status'],
    backgroundImage: row.backgroundImage,
    createdAt: row.createdAt,
  };
}

export async function fetchMasterBundles(): Promise<ServiceBundle[]> {
  const res = await apiFetch('/api/masters/me/bundles');
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { bundles?: MasterBundleDto[] };
  return (j.bundles ?? []).map(bundleDtoToClient);
}

export async function postMasterBundle(body: {
  title: string;
  description?: string;
  serviceIds: string[];
  originalPrice: number;
  bundlePrice: number;
  discountPercent: number;
  discountAmount: number;
  durationMinutes: number;
  imageUrl?: string;
  imageSource?: string;
  status: ServiceBundle['status'];
}): Promise<ServiceBundle> {
  const res = await apiFetch('/api/masters/me/bundles', { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await readApiError(res));
  return bundleDtoToClient((await res.json()) as MasterBundleDto);
}

export async function patchMasterBundle(
  bundleId: string,
  body: Partial<{
    title: string;
    description: string;
    serviceIds: string[];
    originalPrice: number;
    bundlePrice: number;
    discountPercent: number;
    discountAmount: number;
    durationMinutes: number;
    imageUrl: string | null;
    imageSource: string;
    status: ServiceBundle['status'];
  }>,
): Promise<ServiceBundle> {
  const res = await apiFetch(`/api/masters/me/bundles/${bundleId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return bundleDtoToClient((await res.json()) as MasterBundleDto);
}

export async function deleteMasterBundle(bundleId: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/bundles/${bundleId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(await readApiError(res));
}

export async function fetchMasterPromotions(): Promise<ServicePromotion[]> {
  const res = await apiFetch('/api/masters/me/promotions');
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { promotions?: MasterPromotionDto[] };
  return (j.promotions ?? []).map(promotionDtoToClient);
}

export async function postMasterPromotion(body: {
  template: string;
  title: string;
  description?: string;
  serviceId: string;
  discountType: ServicePromotion['discountType'];
  discountValue: number;
  discountLabel: string;
  startsAt: string;
  endsAt: string;
  status?: ServicePromotion['status'];
  backgroundImage?: string;
  publish?: boolean;
  slotIds?: string[];
}): Promise<ServicePromotion> {
  const res = await apiFetch('/api/masters/me/promotions', { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await readApiError(res));
  return promotionDtoToClient((await res.json()) as MasterPromotionDto);
}

export async function patchMasterPromotion(
  promotionId: string,
  body: Partial<{
    template: string;
    title: string;
    description: string;
    serviceId: string;
    discountType: ServicePromotion['discountType'];
    discountValue: number;
    discountLabel: string;
    startsAt: string;
    endsAt: string;
    status: ServicePromotion['status'];
    backgroundImage: string;
    publish?: boolean;
  }>,
): Promise<ServicePromotion> {
  const res = await apiFetch(`/api/masters/me/promotions/${promotionId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return promotionDtoToClient((await res.json()) as MasterPromotionDto);
}

export async function deleteMasterPromotion(promotionId: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/promotions/${promotionId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(await readApiError(res));
}
