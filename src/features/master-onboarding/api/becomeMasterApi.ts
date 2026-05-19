import { apiFetch } from '../../../shared/api/backendClient';

export type ServiceCategoryDto = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
};

async function readApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return j?.error?.message ?? `Ошибка ${res.status}`;
}

export async function fetchServiceCategories(): Promise<ServiceCategoryDto[]> {
  const res = await apiFetch('/api/catalog/service-categories', { skipAuth: true });
  if (!res.ok) throw new Error(await readApiError(res));
  const d = (await res.json()) as { categories?: ServiceCategoryDto[] };
  return d.categories ?? [];
}

export type MasterMePostBody = {
  displayName: string;
  bio?: string;
  phone?: string | null;
  contact?: string | null;
  photoUrl?: string | null;
  slug?: string | null;
  primaryCategoryCode?: string | null;
};

export async function postMasterMe(body: MasterMePostBody): Promise<unknown> {
  const res = await apiFetch('/api/masters/me', { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json();
}

export type PrimaryLocationBody = {
  visitType: 'studio' | 'at_home';
  city: string;
  street: string;
  building: string;
  buildingDetail?: string | null;
  salonName?: string | null;
  district?: string | null;
  showExactAddressAfterBooking?: boolean | null;
  entrance?: string | null;
  floor?: string | null;
  room?: string | null;
  intercom?: string | null;
  landmark?: string | null;
  directions?: string | null;
  clientNote?: string | null;
  publicAddress: string;
  lat?: number | null;
  lng?: number | null;
};

export async function putMasterPrimaryLocation(body: PrimaryLocationBody): Promise<void> {
  const res = await apiFetch('/api/masters/me/primary-location', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export type ScheduleRuleDto = { weekday: number; startTime: string; endTime: string };

export async function putMasterScheduleRules(rules: ScheduleRuleDto[]): Promise<void> {
  const res = await apiFetch('/api/masters/me/schedule-rules', {
    method: 'PUT',
    body: JSON.stringify({ rules }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export type CertificateItemDto = {
  title: string;
  issuer: string | null;
  year?: number | null;
  description?: string | null;
  imageUrl?: string | null;
};

export async function postMasterCertificates(items: CertificateItemDto[]): Promise<void> {
  if (!items.length) return;
  const res = await apiFetch('/api/masters/me/certificates/batch', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export type CreateServiceBody = {
  categoryId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  priceAmount: number;
  priceType?: 'fixed' | 'from';
  sortOrder?: number;
};

export async function postMasterService(body: CreateServiceBody): Promise<void> {
  const res = await apiFetch('/api/masters/me/services', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export const DEFAULT_WEEKDAY_SCHEDULE: ScheduleRuleDto[] = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  startTime: '09:00',
  endTime: '18:00',
}));

export type MasterOnboardingLocationPayload = {
  visitType: 'studio' | 'at_home';
  city: string;
  street: string;
  building: string;
  buildingDetail?: string | null;
  salonName?: string | null;
  district?: string | null;
  showExactAddressAfterBooking?: boolean | null;
  entrance?: string | null;
  floor?: string | null;
  room?: string | null;
  intercom?: string | null;
  landmark?: string | null;
  directions?: string | null;
  clientNote?: string | null;
  lat?: number | null;
  lng?: number | null;
  publicAddress: string;
};

export type MasterOnboardingScheduleRulePayload = {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export type MasterOnboardingServicePayload = {
  title: string;
  description?: string;
  durationMinutes: number;
  priceAmount: number;
  priceType?: 'fixed' | 'from';
  sortOrder?: number;
};

export type MasterOnboardingCertificatePayload = {
  title: string;
  issuer: string | null;
  year?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  sortOrder?: number;
};

export type MasterOnboardingContactItem = {
  type: 'telegram' | 'viber' | 'vk' | 'instagram' | 'whatsapp' | 'other';
  value: string;
};

export type MasterOnboardingPayload = {
  categoryCode: string;
  name: string;
  description?: string;
  phone?: string | null;
  /** Краткая строка для совместимости; при наличии `contacts` дублирует агрегат на клиенте. */
  contact?: string | null;
  contacts?: MasterOnboardingContactItem[] | null;
  photoUrl?: string | null;
  location: MasterOnboardingLocationPayload;
  scheduleRules: MasterOnboardingScheduleRulePayload[];
  services: MasterOnboardingServicePayload[];
  certificates: MasterOnboardingCertificatePayload[];
  /** Сейчас без оплаты сохраняется только basic. */
  masterPlan?: 'basic';
  proInterested?: boolean;
};

export type MasterOnboardingResponse = {
  master: Record<string, unknown>;
  location: Record<string, unknown> | null;
  services: unknown[];
  scheduleRules: unknown[];
  certificates: unknown[];
};

export async function submitMasterOnboarding(payload: MasterOnboardingPayload): Promise<MasterOnboardingResponse> {
  const res = await apiFetch('/api/masters/me/onboarding', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MasterOnboardingResponse;
}
