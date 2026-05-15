import type { SlottySelectOption } from '../../../shared/ui/SlottySelect';

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** Сетка 06:00–23:00 с шагом 15 минут (как в редакторе окошек). */
export function buildScheduleQuarterHourTimes(): string[] {
  const out: string[] = [];
  for (let h = 6; h <= 23; h += 1) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 23 && m > 0) break;
      out.push(`${pad2(h)}:${pad2(m)}`);
    }
  }
  return out;
}

export const SCHEDULE_TIME_SELECT_OPTIONS: SlottySelectOption[] = buildScheduleQuarterHourTimes().map((time) => ({
  value: time,
  label: time,
}));

function normalizeHHMM(raw: string): string {
  const t = raw.trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return '09:00';
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function timeToMinutes(t: string): number {
  const [h, min] = normalizeHHMM(t).split(':').map(Number);
  return h * 60 + min;
}

/** Опции выбора времени: сетка + текущие значения, если они не на четверть часа (черновик с сервера). */
export function mergeScheduleTimeSelectOptions(...extraRaw: string[]): SlottySelectOption[] {
  const map = new Map<string, string>();
  for (const o of SCHEDULE_TIME_SELECT_OPTIONS) {
    map.set(o.value, o.label);
  }
  for (const raw of extraRaw) {
    const v = normalizeHHMM(raw);
    if (!map.has(v)) map.set(v, v);
  }
  return [...map.keys()]
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
    .map((value) => ({ value, label: value }));
}
