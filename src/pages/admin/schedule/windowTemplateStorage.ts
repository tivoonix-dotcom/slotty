import type { WindowTemplate } from './scheduleTypes';
import { TEMPLATE_ACCENTS } from './scheduleTypes';

const KEY_PREFIX = 'slotty_window_templates';

function storageKey(masterId: string): string {
  return `${KEY_PREFIX}_${masterId || 'local'}`;
}

export function loadWindowTemplates(masterId: string): WindowTemplate[] {
  try {
    const raw = localStorage.getItem(storageKey(masterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is WindowTemplate =>
        Boolean(t) &&
        typeof t === 'object' &&
        typeof (t as WindowTemplate).id === 'string' &&
        typeof (t as WindowTemplate).serviceId === 'string' &&
        typeof (t as WindowTemplate).durationMinutes === 'number',
    );
  } catch {
    return [];
  }
}

export function saveWindowTemplates(masterId: string, templates: WindowTemplate[]): void {
  try {
    localStorage.setItem(storageKey(masterId), JSON.stringify(templates));
  } catch {
    /* ignore */
  }
}

export function createTemplatePayload(
  serviceId: string,
  serviceName: string,
  durationMinutes: number,
  title?: string,
  index = 0,
): WindowTemplate {
  const dur = formatDurationShort(durationMinutes);
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `tpl-${Date.now()}`,
    title: title?.trim() || `${serviceName} · ${dur}`,
    serviceId,
    serviceName,
    durationMinutes,
    accent: TEMPLATE_ACCENTS[index % TEMPLATE_ACCENTS.length] ?? TEMPLATE_ACCENTS[0],
  };
}

function formatDurationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
