import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

async function readApiError(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export type MySlotDto = {
  id: string;
  masterId: string;
  serviceId: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  source: string;
  createdAt: string;
};

function mapMySlot(row: Record<string, unknown>): MySlotDto {
  return {
    id: String(row.id),
    masterId: String(row.master_id),
    serviceId: row.service_id != null ? String(row.service_id) : null,
    startsAt: new Date(row.starts_at as string).toISOString(),
    endsAt: new Date(row.ends_at as string).toISOString(),
    status: String(row.status),
    source: String(row.source),
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

export async function getMySlots(): Promise<MySlotDto[]> {
  const res = await apiFetch('/api/masters/me/slots');
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { slots?: Record<string, unknown>[] };
  return (j.slots ?? []).map(mapMySlot);
}

export async function createMySlot(payload: {
  startsAt: string;
  endsAt: string;
  serviceId?: string | null;
}): Promise<MySlotDto> {
  const res = await apiFetch('/api/masters/me/slots', {
    method: 'POST',
    body: JSON.stringify({
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      serviceId: payload.serviceId ?? null,
    }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  const row = (await res.json()) as Record<string, unknown>;
  return mapMySlot(row);
}

export async function updateMySlot(
  slotId: string,
  payload: { startsAt?: string; endsAt?: string; serviceId?: string | null },
): Promise<MySlotDto> {
  const res = await apiFetch(`/api/masters/me/slots/${encodeURIComponent(slotId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  const row = (await res.json()) as Record<string, unknown>;
  return mapMySlot(row);
}

export async function deleteMySlot(slotId: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/slots/${encodeURIComponent(slotId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readApiError(res));
}

export type BatchCreateSlotsResult = {
  created: number;
  skipped: number;
  skippedReasons: Array<{
    date: string;
    time: string;
    reason: 'overlap' | 'past' | 'plan_limit' | 'service_does_not_fit' | 'invalid';
  }>;
};

export async function createMySlotsBatch(payload: {
  startDate: string;
  endDate: string;
  weekdays: number[];
  dayStartTime: string;
  dayEndTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  slotDurationMinutes: number;
  serviceId?: string | null;
}): Promise<BatchCreateSlotsResult> {
  const res = await apiFetch('/api/masters/me/slots/batch', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as BatchCreateSlotsResult;
}
