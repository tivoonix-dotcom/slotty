import { apiFetch } from '../../../shared/api/backendClient';

async function readApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return j?.error?.message ?? `Ошибка ${res.status}`;
}

export type PublicSlotDto = {
  id: string;
  masterId: string;
  serviceId: string | null;
  bookingServiceId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  source: string;
  masterDisplayName: string;
  serviceTitle: string;
  servicePrice: number;
};

export async function fetchPublicSlots(params: {
  masterId?: string;
  serviceId?: string;
  category?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<PublicSlotDto[]> {
  const q = new URLSearchParams();
  if (params.masterId) q.set('masterId', params.masterId);
  if (params.serviceId) q.set('serviceId', params.serviceId);
  if (params.category) q.set('category', params.category);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  if (params.limit != null) q.set('limit', String(params.limit));
  const qs = q.toString();
  const res = await apiFetch(`/api/slots${qs ? `?${qs}` : ''}`, { skipAuth: true });
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { slots?: PublicSlotDto[] };
  return j.slots ?? [];
}
