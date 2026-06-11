import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';
import type { CategoryChangePolicyDto } from '../lib/categoryChangePolicy';
import type { PrimaryLocationBody, ScheduleRuleDto } from '../../master-onboarding/api/becomeMasterApi';

async function readApiError(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export type MasterCabinetProfileDto = {
  masterId: string;
  displayName: string;
  slug: string | null;
  primaryCategoryId: string | null;
  bio: string;
  phone: string | null;
  contact: string | null;
  contacts?: unknown | null;
  photoUrl: string | null;
  publicationStatus: string;
  rating: number;
  reviewsCount: number;
  globalBufferMinutes: number;
  portfolioCoverItemId?: string | null;
  createdAt: string;
};

export type MasterCabinetCategoryDto = { code: string; name: string } | null;

export type MasterCabinetLocationDto = {
  id: string;
  visitType: string;
  city: string;
  street: string;
  building: string;
  buildingDetail: string | null;
  salonName?: string | null;
  district?: string | null;
  entrance: string | null;
  floor: string | null;
  room: string | null;
  intercom: string | null;
  landmark: string | null;
  directions: string | null;
  clientNote: string | null;
  publicAddress: string;
  isPrimary: boolean;
  lat: number | null;
  lng: number | null;
  showExactAddressAfterBooking?: boolean;
} | null;

export type MasterCabinetScheduleRuleDto = {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type MasterCabinetServiceDto = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  priceType: string;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  coverImageUrl: string | null;
  coverFocalX: number;
  coverFocalY: number;
};

export type MasterCabinetDto = {
  profile: MasterCabinetProfileDto;
  primaryCategory: MasterCabinetCategoryDto;
  categoryChangePolicy?: CategoryChangePolicyDto;
  primaryLocation: MasterCabinetLocationDto;
  scheduleRules: MasterCabinetScheduleRuleDto[];
  services: MasterCabinetServiceDto[];
  bookingRules: {
    bookingRules: string | null;
    cancellationPolicy: string | null;
    paymentNote: string | null;
    paymentMethods?: string[];
  } | null;
  certificates: Array<{
    id: string;
    title: string;
    issuer: string;
    year: number | null;
    imageUrl: string | null;
    description: string | null;
    sortOrder: number;
  }>;
  portfolio: Array<{
    id: string;
    imageUrl: string;
    title: string | null;
    description: string | null;
    sortOrder: number;
  }>;
  career: Array<{
    id: string;
    type: string;
    title: string;
    place: string;
    startYear: number | null;
    endYear: number | null;
    description: string | null;
    sortOrder: number;
  }>;
};

export async function fetchMasterCabinet(): Promise<MasterCabinetDto> {
  const res = await apiFetch('/api/masters/me');
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MasterCabinetDto;
}

export type MasterContactPatch = {
  type: 'telegram' | 'viber' | 'vk' | 'instagram' | 'whatsapp' | 'other';
  value: string;
};

export async function patchMasterMe(body: {
  displayName?: string;
  bio?: string;
  phone?: string | null;
  contact?: string | null;
  contacts?: MasterContactPatch[] | null;
  photoUrl?: string | null;
  primaryCategoryCode?: string | null;
  publicationStatus?: 'draft' | 'published' | 'hidden' | 'blocked' | 'paused';
  portfolioCoverItemId?: string | null;
}): Promise<void> {
  const res = await apiFetch('/api/masters/me', { method: 'PATCH', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function uploadMasterPortfolioImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiFetch('/api/masters/me/portfolio/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { imageUrl: string };
  return j.imageUrl;
}

export async function uploadMasterCertificateImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiFetch('/api/masters/me/certificates/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { imageUrl: string };
  return j.imageUrl;
}

export async function uploadMasterHeroPhotoFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiFetch('/api/masters/me/photo', { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { imageUrl: string };
  return j.imageUrl;
}

/** Data URL изображения → multipart на сервер (выбор файла в листе «Основное»). */
export async function uploadMasterHeroPhotoFromDataUrl(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
  const file = new File([blob], `hero.${ext}`, { type: blob.type || 'image/jpeg' });
  return uploadMasterHeroPhotoFile(file);
}

/**
 * Фото из Telegram (https) → сервер скачивает и кладёт в Storage (без протухающих CDN-ссылок).
 */
export async function uploadMasterHeroPhotoFromRemoteUrl(imageUrl: string): Promise<string> {
  const url = imageUrl.trim();
  if (!url.startsWith('https://')) {
    throw new Error('Некорректная ссылка на фото');
  }
  const res = await apiFetch('/api/masters/me/photo/from-url', {
    method: 'POST',
    body: JSON.stringify({ imageUrl: url }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { imageUrl: string };
  return j.imageUrl;
}

export async function putMasterPrimaryLocation(body: PrimaryLocationBody): Promise<void> {
  const res = await apiFetch('/api/masters/me/primary-location', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function putMasterScheduleRules(rules: ScheduleRuleDto[]): Promise<void> {
  const res = await apiFetch('/api/masters/me/schedule-rules', {
    method: 'PUT',
    body: JSON.stringify({ rules }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export type MasterAppointmentListRow = {
  id: string;
  client_id: string;
  service_id: string;
  slot_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  price_snapshot: string;
  service_title_snapshot: string;
  service_duration_snapshot?: number | null;
  client_note: string | null;
  client_reference_photo_url: string | null;
  created_at?: string;
  client_name: string;
  client_phone: string | null;
  client_email?: string | null;
  client_telegram_username?: string | null;
  client_telegram_id?: string | null;
  client_avatar_url?: string | null;
  booking_source?: string | null;
  cancel_reason?: string | null;
  voucher_number?: string | null;
};

export type MasterAppointmentsTab = 'pending' | 'upcoming' | 'history' | 'active' | 'all';

export type MasterAppointmentsListResult = {
  appointments: MasterAppointmentListRow[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type MasterAppointmentStatsDto = {
  pending: number;
  upcoming: number;
  history: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount?: number;
  earnedTotal: number;
  expectedTotal?: number;
  disputedTotal?: number;
};

function buildAppointmentsQuery(params?: {
  limit?: number;
  offset?: number;
  tab?: MasterAppointmentsTab;
}): string {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  if (params?.tab) sp.set('tab', params.tab);
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchMasterAppointments(
  params?: { limit?: number; offset?: number; tab?: MasterAppointmentsTab },
): Promise<MasterAppointmentsListResult> {
  const res = await apiFetch(`/api/masters/me/appointments${buildAppointmentsQuery(params)}`);
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as {
    appointments?: MasterAppointmentListRow[];
    total?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
  };
  const appointments = j.appointments ?? [];
  const limit = j.limit ?? params?.limit ?? appointments.length;
  const offset = j.offset ?? params?.offset ?? 0;
  const total = j.total ?? appointments.length;
  const hasMore = j.hasMore ?? offset + appointments.length < total;
  return { appointments, total, limit, offset, hasMore };
}

export async function fetchMasterAppointmentStats(): Promise<MasterAppointmentStatsDto> {
  const res = await apiFetch('/api/masters/me/appointments/stats');
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { stats?: MasterAppointmentStatsDto };
  return (
    j.stats ?? {
      pending: 0,
      upcoming: 0,
      history: 0,
      completedCount: 0,
      cancelledCount: 0,
      earnedTotal: 0,
    }
  );
}

export async function patchMasterAppointmentConfirm(appointmentId: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/confirm`, { method: 'PATCH' });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function patchMasterAppointmentComplete(appointmentId: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/mark-completed`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function patchMasterAppointmentCancel(
  appointmentId: string,
  reason: string,
  category?: string,
): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason, category }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function patchMasterAppointmentClientArrived(appointmentId: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/client-arrived`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function patchMasterAppointmentStart(appointmentId: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/start`, { method: 'PATCH' });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function patchMasterAppointmentNoShow(
  appointmentId: string,
  comment?: string,
): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/no-show`, {
    method: 'PATCH',
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function patchMasterAppointmentClose(
  appointmentId: string,
  reason?: string,
): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/close`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function postMasterReportNoShow(
  appointmentId: string,
  body: { waitedMinutes: number; hadClientContact: boolean; comment?: string },
): Promise<{ ticketCode: string }> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/report-no-show`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ticketCode: string };
}

export type MasterServiceCreatedDto = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  priceType: string;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  coverImageUrl: string | null;
  coverFocalX: number;
  coverFocalY: number;
};

export async function postMasterService(body: {
  categoryId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  priceAmount: number;
  priceType?: 'fixed' | 'from';
  sortOrder?: number;
  coverImageUrl: string;
  coverFocalX?: number;
  coverFocalY?: number;
}): Promise<MasterServiceCreatedDto> {
  const res = await apiFetch('/api/masters/me/services', { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MasterServiceCreatedDto;
}

export async function patchMasterService(
  serviceId: string,
  body: {
    title?: string;
    description?: string;
    durationMinutes?: number;
    priceAmount?: number;
    priceType?: 'fixed' | 'from';
    sortOrder?: number;
    isActive?: boolean;
    categoryId?: string;
    coverImageUrl?: string | null;
    coverFocalX?: number;
    coverFocalY?: number;
  },
): Promise<MasterServiceCreatedDto> {
  const res = await apiFetch(`/api/masters/me/services/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MasterServiceCreatedDto;
}

export async function deleteMasterService(serviceId: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/services/${serviceId}`, { method: 'DELETE' });
  if (res.ok || res.status === 404) return;
  throw new Error(await readApiError(res));
}
