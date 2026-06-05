import { ApiError } from '../../utils/ApiError.js';
import { assertProfileCanManageMasterContent } from '../profiles/profileAccount.service.js';
import { createMySlot } from './slots.service.js';

export type BatchCreateSlotsInput = {
  startDate: string;
  endDate: string;
  weekdays: number[];
  dayStartTime: string;
  dayEndTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  slotDurationMinutes: number;
  serviceId?: string | null;
};

export type BatchSkipReason = 'overlap' | 'past' | 'plan_limit' | 'service_does_not_fit' | 'invalid';

export type BatchCreateSlotsResult = {
  created: number;
  skipped: number;
  skippedReasons: Array<{ date: string; time: string; reason: BatchSkipReason }>;
};

function timeToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d);
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function jsDateToWorkDay(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const out: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(isoFromDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function isInBreak(minute: number, breakStart?: string | null, breakEnd?: string | null): boolean {
  if (!breakStart?.trim() || !breakEnd?.trim()) return false;
  return minute >= timeToMinutes(breakStart) && minute < timeToMinutes(breakEnd);
}

export function buildBatchCandidates(input: BatchCreateSlotsInput, now = new Date()) {
  const dayStart = timeToMinutes(input.dayStartTime);
  const dayEnd = timeToMinutes(input.dayEndTime);
  const duration = input.slotDurationMinutes;
  const weekdaySet = new Set(input.weekdays);
  const out: Array<{ date: string; time: string; startsAt: Date; endsAt: Date }> = [];

  if (duration < 15 || dayEnd <= dayStart) return out;

  for (const date of enumerateDates(input.startDate, input.endDate)) {
    const workDay = jsDateToWorkDay(parseIsoDate(date).getDay());
    if (!weekdaySet.has(workDay)) continue;

    for (let startMin = dayStart; startMin + duration <= dayEnd; startMin += duration) {
      if (isInBreak(startMin, input.breakStartTime, input.breakEndTime)) continue;
      if (
        input.breakStartTime &&
        input.breakEndTime &&
        startMin < timeToMinutes(input.breakEndTime) &&
        startMin + duration > timeToMinutes(input.breakStartTime)
      ) {
        continue;
      }

      const startTime = minutesToTime(startMin);
      const endTime = minutesToTime(startMin + duration);
      const [y, mo, d] = date.split('-').map(Number);
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startsAt = new Date(y!, mo! - 1, d!, sh, sm, 0, 0);
      const endsAt = new Date(y!, mo! - 1, d!, eh, em, 0, 0);
      if (startsAt < now) continue;
      out.push({ date, time: startTime, startsAt, endsAt });
    }
  }

  return out;
}

export function mapSkipReason(code: string | undefined): BatchSkipReason {
  if (code === 'SLOT_OVERLAP') return 'overlap';
  if (code === 'SLOT_IN_PAST') return 'past';
  if (code === 'LIMIT_SCHEDULE_DAYS_REACHED') return 'plan_limit';
  if (code === 'SERVICE_DOES_NOT_FIT' || code === 'BAD_SLOT_RANGE' || code === 'SLOT_TOO_LONG') {
    return 'service_does_not_fit';
  }
  return 'invalid';
}

export async function createMySlotsBatch(
  masterId: string,
  input: BatchCreateSlotsInput,
): Promise<BatchCreateSlotsResult> {
  await assertProfileCanManageMasterContent(masterId);

  if (!input.weekdays.length) {
    throw ApiError.badRequest('Выберите хотя бы один рабочий день', 'NO_WEEKDAYS');
  }

  const { listMyServices } = await import('../services/services.service.js');
  const services = await listMyServices(masterId);
  const activeCount = services.filter((s) => s.isActive !== false).length;
  if (activeCount <= 0) {
    throw ApiError.badRequest('Сначала добавьте активную услугу', 'NO_ACTIVE_SERVICE');
  }

  const candidates = buildBatchCandidates(input);
  let created = 0;
  let skipped = 0;
  const skippedReasons: BatchCreateSlotsResult['skippedReasons'] = [];

  for (const candidate of candidates) {
    try {
      await createMySlot(masterId, {
        startsAt: candidate.startsAt,
        endsAt: candidate.endsAt,
        serviceId: input.serviceId ?? null,
      });
      created += 1;
    } catch (e) {
      skipped += 1;
      const code = e instanceof ApiError ? e.code : undefined;
      skippedReasons.push({
        date: candidate.date,
        time: candidate.time,
        reason: mapSkipReason(code),
      });
    }
  }

  return { created, skipped, skippedReasons };
}
