import { apiFetch } from '../../../shared/api/backendClient';
import type { PrimaryLocationBody } from '../../master-onboarding/api/becomeMasterApi';
import { patchMasterMe, putMasterPrimaryLocation } from './masterCabinetApi';

async function readApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return j?.error?.message ?? `Ошибка ${res.status}`;
}

export type BookingRulesDto = {
  bookingRules: string | null;
  cancellationPolicy: string | null;
  paymentNote: string | null;
  paymentMethods: string[];
};

export type StructuredBookingRulesDto = {
  minBookingNoticeMinutes: number;
  requiresMasterConfirmation: boolean;
  freeCancelBeforeMinutes: number;
  lateCancelPolicy: 'mark_late' | 'require_agreement' | 'warning_only';
  allowedLatenessMinutes: number;
  lateArrivalPolicy: 'master_can_cancel' | 'shorten_visit' | 'reschedule_by_agreement';
  noShowAfterMinutes: number;
  noShowPolicy: 'mark_no_show' | 'client_can_dispute';
  rescheduleEnabled: boolean;
  rescheduleBeforeMinutes: number;
  rescheduleLimit: number | null;
  paymentMethods: string[];
  preferredBankIds: string[];
  paymentComment: string | null;
  prepaymentRequired: boolean;
  refundPolicyEnabled: boolean;
  refundPolicyText: string | null;
  visitPreparationText: string | null;
  contraindicationsText: string | null;
  completionScore: number;
  updatedAt: string | null;
  bookingRules: string | null;
  cancellationPolicy: string | null;
  paymentNote: string | null;
  clientPreview: string[];
};

export async function fetchMyBookingRulesStructured(): Promise<StructuredBookingRulesDto> {
  const res = await apiFetch('/api/masters/me/booking-rules');
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as StructuredBookingRulesDto;
}

export async function putMyBookingRulesStructured(
  payload: Partial<Omit<StructuredBookingRulesDto, 'clientPreview' | 'updatedAt' | 'completionScore'>>,
): Promise<StructuredBookingRulesDto> {
  const res = await apiFetch('/api/masters/me/booking-rules', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as StructuredBookingRulesDto;
}

export async function updateMyMasterProfile(payload: {
  displayName?: string;
  bio?: string;
  phone?: string | null;
  contact?: string | null;
  photoUrl?: string | null;
  slug?: string | null;
  primaryCategoryCode?: string | null;
  publicationStatus?: 'draft' | 'published' | 'hidden' | 'blocked' | 'paused';
  globalBufferMinutes?: number;
}): Promise<void> {
  await patchMasterMe(payload);
}

export async function updateMyMasterLocation(payload: PrimaryLocationBody): Promise<void> {
  await putMasterPrimaryLocation(payload);
}

export async function updateMyBookingRules(payload: {
  bookingRules?: string | null;
  cancellationPolicy?: string | null;
  paymentNote?: string | null;
  paymentMethods?: string[];
}): Promise<BookingRulesDto> {
  const res = await apiFetch('/api/masters/me/booking-rules', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as BookingRulesDto;
}

export type CareerItemDto = {
  id: string;
  type: string;
  title: string;
  place: string;
  startYear: number | null;
  endYear: number | null;
  description: string | null;
  sortOrder: number;
};

export async function fetchMyCareer(): Promise<CareerItemDto[]> {
  const res = await apiFetch('/api/masters/me/career');
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { career?: CareerItemDto[] };
  return j.career ?? [];
}

export async function createCareerItem(payload: {
  type: string;
  title: string;
  place: string;
  startYear?: number | null;
  endYear?: number | null;
  description?: string | null;
  sortOrder?: number;
}): Promise<CareerItemDto> {
  const res = await apiFetch('/api/masters/me/career', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as CareerItemDto;
}

export async function updateCareerItem(
  id: string,
  payload: {
    type?: string;
    title?: string;
    place?: string;
    startYear?: number | null;
    endYear?: number | null;
    description?: string | null;
    sortOrder?: number;
  },
): Promise<void> {
  const res = await apiFetch(`/api/masters/me/career/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function deleteCareerItem(id: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/career/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readApiError(res));
}

export type CertificateDto = {
  id: string;
  title: string;
  issuer: string;
  year: number | null;
  imageUrl: string | null;
  description: string | null;
  sortOrder: number;
};

export async function createCertificate(payload: {
  title: string;
  issuer: string;
  year?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
}): Promise<CertificateDto> {
  const res = await apiFetch('/api/masters/me/certificates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as CertificateDto;
}

export async function updateCertificate(
  id: string,
  payload: {
    title?: string;
    issuer?: string;
    year?: number | null;
    description?: string | null;
    imageUrl?: string | null;
    sortOrder?: number;
  },
): Promise<void> {
  const res = await apiFetch(`/api/masters/me/certificates/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function deleteCertificate(id: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/certificates/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readApiError(res));
}

export type PortfolioItemDto = {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  sortOrder: number;
};

export async function createPortfolioItem(payload: {
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  sortOrder?: number;
}): Promise<PortfolioItemDto> {
  const res = await apiFetch('/api/masters/me/portfolio', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as PortfolioItemDto;
}

export async function updatePortfolioItem(
  id: string,
  payload: {
    imageUrl?: string;
    title?: string | null;
    description?: string | null;
    sortOrder?: number;
  },
): Promise<void> {
  const res = await apiFetch(`/api/masters/me/portfolio/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function deletePortfolioItem(id: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/portfolio/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readApiError(res));
}

function careerPayload(item: {
  type: string;
  title: string;
  place: string;
  startYear?: string;
  endYear?: string;
  description?: string;
}) {
  const syRaw = item.startYear?.trim() ? Number.parseInt(item.startYear, 10) : NaN;
  const eyRaw = item.endYear?.trim() ? Number.parseInt(item.endYear, 10) : NaN;
  return {
    type: item.type,
    title: item.title,
    place: item.place,
    startYear: Number.isFinite(syRaw) ? syRaw : null,
    endYear: Number.isFinite(eyRaw) ? eyRaw : null,
    description: item.description?.trim() || null,
  };
}

function careerEqual(
  a: { type: string; title: string; place: string; startYear?: string; endYear?: string; description?: string },
  b: typeof a,
) {
  return (
    a.type === b.type &&
    a.title === b.title &&
    a.place === b.place &&
    (a.startYear ?? '') === (b.startYear ?? '') &&
    (a.endYear ?? '') === (b.endYear ?? '') &&
    (a.description ?? '') === (b.description ?? '')
  );
}

/** Синхронизация списка карьеры с бэкендом по диффу (после сохранения в sheet). */
export async function syncCareerItems(
  prev: Array<{
    id: string;
    type: string;
    title: string;
    place: string;
    startYear?: string;
    endYear?: string;
    description?: string;
  }>,
  next: typeof prev,
): Promise<void> {
  const nextIds = new Set(next.map((p) => p.id));
  for (const p of prev) {
    if (!nextIds.has(p.id)) await deleteCareerItem(p.id);
  }
  for (let i = 0; i < next.length; i += 1) {
    const n = next[i]!;
    const old = prev.find((x) => x.id === n.id);
    const sortOrder = i;
    if (!old) {
      await createCareerItem({ ...careerPayload(n), sortOrder });
    } else if (!careerEqual(old, n)) {
      await updateCareerItem(n.id, { ...careerPayload(n), sortOrder });
    } else if (prev.indexOf(old) !== i) {
      await updateCareerItem(n.id, { sortOrder });
    }
  }
}

function certPayload(c: {
  title: string;
  issuer: string;
  year?: string;
  description?: string;
  imageUrl?: string;
}) {
  const yRaw = c.year?.trim() ? Number.parseInt(c.year, 10) : NaN;
  return {
    title: c.title,
    issuer: c.issuer,
    year: Number.isFinite(yRaw) ? yRaw : null,
    description: c.description?.trim() || null,
    imageUrl: c.imageUrl?.trim() || null,
  };
}

function certEqual(
  a: { title: string; issuer: string; year?: string; description?: string; imageUrl?: string },
  b: typeof a,
) {
  return (
    a.title === b.title &&
    a.issuer === b.issuer &&
    (a.year ?? '') === (b.year ?? '') &&
    (a.description ?? '') === (b.description ?? '') &&
    (a.imageUrl ?? '') === (b.imageUrl ?? '')
  );
}

export async function syncCertificates(
  prev: Array<{ id: string; title: string; issuer: string; year?: string; description?: string; imageUrl?: string }>,
  next: typeof prev,
): Promise<void> {
  for (const p of prev) {
    if (!next.some((n) => n.id === p.id)) await deleteCertificate(p.id);
  }
  for (let i = 0; i < next.length; i += 1) {
    const n = next[i]!;
    const old = prev.find((x) => x.id === n.id);
    const sortOrder = i;
    if (!old) {
      await createCertificate({ ...certPayload(n), sortOrder });
    } else if (!certEqual(old, n)) {
      await updateCertificate(n.id, { ...certPayload(n), sortOrder });
    } else if (prev.indexOf(old) !== i) {
      await updateCertificate(n.id, { sortOrder });
    }
  }
}

function portfolioPayload(p: { title?: string; description?: string; imageUrl: string }, sortOrder: number) {
  return {
    imageUrl: p.imageUrl.trim(),
    title: p.title?.trim() || null,
    description: p.description?.trim() || null,
    sortOrder,
  };
}

function portfolioEqual(
  a: { title?: string; description?: string; imageUrl: string },
  b: typeof a,
): boolean {
  return (
    (a.title ?? '') === (b.title ?? '') &&
    (a.description ?? '') === (b.description ?? '') &&
    a.imageUrl === b.imageUrl
  );
}

export async function syncPortfolioItems(
  prev: Array<{ id: string; title?: string; description?: string; imageUrl: string }>,
  next: typeof prev,
): Promise<void> {
  for (const p of prev) {
    if (!next.some((n) => n.id === p.id)) await deletePortfolioItem(p.id);
  }
  for (let i = 0; i < next.length; i += 1) {
    const n = next[i]!;
    const old = prev.find((x) => x.id === n.id);
    const sortOrder = i;
    if (!old) {
      await createPortfolioItem(portfolioPayload(n, sortOrder));
    } else if (!portfolioEqual(old, n)) {
      await updatePortfolioItem(n.id, portfolioPayload(n, sortOrder));
    } else if (prev.indexOf(old) !== i) {
      await updatePortfolioItem(n.id, { sortOrder });
    }
  }
}
