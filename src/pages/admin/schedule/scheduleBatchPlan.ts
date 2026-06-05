import { localDateTimeToUtcIso } from './scheduleUtils';

/** 0 = Пн … 6 = Вс (как в профиле мастера). */
export type BatchWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type BatchScheduleConfig = {
  startDateIso: string;
  endDateIso: string;
  weekdays: BatchWeekday[];
  dayStartTime: string;
  dayEndTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  slotDurationMinutes: number;
  serviceId?: string | null;
};

export type PlannedBatchSlot = {
  dateIso: string;
  startTime: string;
  endTime: string;
  startsAtIso: string;
  endsAtIso: string;
};

export type BatchSkipReason = 'overlap' | 'past' | 'plan_limit' | 'service_does_not_fit' | 'invalid';

export function jsDateToWorkDay(jsDay: number): BatchWeekday {
  return (jsDay === 0 ? 6 : jsDay - 1) as BatchWeekday;
}

export function timeToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(total: number): string {
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

function isInBreak(minute: number, breakStart?: string | null, breakEnd?: string | null): boolean {
  if (!breakStart?.trim() || !breakEnd?.trim()) return false;
  const bs = timeToMinutes(breakStart);
  const be = timeToMinutes(breakEnd);
  return minute >= bs && minute < be;
}

export function enumerateBatchDates(startDateIso: string, endDateIso: string): string[] {
  const start = parseIsoDate(startDateIso);
  const end = parseIsoDate(endDateIso);
  const out: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(isoFromDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function planBatchSlots(config: BatchScheduleConfig, now = new Date()): PlannedBatchSlot[] {
  const dayStart = timeToMinutes(config.dayStartTime);
  const dayEnd = timeToMinutes(config.dayEndTime);
  const duration = config.slotDurationMinutes;

  if (duration < 15 || dayEnd <= dayStart) return [];

  const weekdaySet = new Set(config.weekdays);
  const out: PlannedBatchSlot[] = [];

  for (const dateIso of enumerateBatchDates(config.startDateIso, config.endDateIso)) {
    const jsDay = parseIsoDate(dateIso).getDay();
    const workDay = jsDateToWorkDay(jsDay);
    if (!weekdaySet.has(workDay)) continue;

    for (let startMin = dayStart; startMin + duration <= dayEnd; startMin += duration) {
      if (isInBreak(startMin, config.breakStartTime, config.breakEndTime)) continue;
      if (
        config.breakStartTime &&
        config.breakEndTime &&
        startMin < timeToMinutes(config.breakEndTime) &&
        startMin + duration > timeToMinutes(config.breakStartTime)
      ) {
        continue;
      }

      const startTime = minutesToTime(startMin);
      const endTime = minutesToTime(startMin + duration);
      const startsAtIso = localDateTimeToUtcIso(dateIso, startTime);
      const endsAtIso = localDateTimeToUtcIso(dateIso, endTime);

      if (new Date(startsAtIso) < now) continue;

      out.push({ dateIso, startTime, endTime, startsAtIso, endsAtIso });
    }
  }

  return out;
}

export function addDaysIso(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
}

export function todayIsoLocal(): string {
  return isoFromDate(new Date());
}

export function filterNonOverlappingBatch(
  planned: PlannedBatchSlot[],
  existing: Array<{ startsAt: string; endsAt: string }>,
): { toCreate: PlannedBatchSlot[]; skippedOverlap: number } {
  const existingRanges = existing.map((s) => ({
    start: new Date(s.startsAt).getTime(),
    end: new Date(s.endsAt).getTime(),
  }));

  let skippedOverlap = 0;
  const accepted: PlannedBatchSlot[] = [];
  const acceptedRanges: Array<{ start: number; end: number }> = [];

  for (const slot of planned) {
    const start = new Date(slot.startsAtIso).getTime();
    const end = new Date(slot.endsAtIso).getTime();
    const overlapsExisting = existingRanges.some(
      (r) => start < r.end && end > r.start,
    );
    const overlapsAccepted = acceptedRanges.some(
      (r) => start < r.end && end > r.start,
    );
    if (overlapsExisting || overlapsAccepted) {
      skippedOverlap += 1;
      continue;
    }
    accepted.push(slot);
    acceptedRanges.push({ start, end });
  }

  return { toCreate: accepted, skippedOverlap };
}
