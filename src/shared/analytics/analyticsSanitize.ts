import type { AnalyticsEventPayload } from './analyticsEvents';

const BLOCKED_KEYS = new Set([
  'email',
  'phone',
  'name',
  'fullName',
  'full_name',
  'clientName',
  'masterName',
  'token',
  'password',
  'address',
  'note',
  'comment',
]);

const FORBIDDEN_VALUE = /localhost|undefined|@/i;

/** Убирает PII и небезопасные значения из payload событий. */
export function sanitizeAnalyticsPayload(
  payload?: AnalyticsEventPayload,
): AnalyticsEventPayload | undefined {
  if (!payload) return undefined;
  const out: AnalyticsEventPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (BLOCKED_KEYS.has(key)) continue;
    if (value == null) continue;
    if (typeof value === 'string' && FORBIDDEN_VALUE.test(value)) continue;
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
