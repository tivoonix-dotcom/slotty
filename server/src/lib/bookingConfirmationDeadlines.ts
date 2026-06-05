/** Правила дедлайна подтверждения pending-заявок (настраиваемые константы). */

export const BOOKING_CONFIRMATION_RULES = {
  /** Мастер должен ответить в течение 3 ч после заявки (если визит > 24 ч). */
  RESPONSE_WINDOW_MS: 3 * 60 * 60_000,
  /** Минимум 3 ч до начала визита для подтверждения. */
  MIN_CONFIRMATION_LEAD_MS: 3 * 60 * 60_000,
  /** Срочная заявка: ответ за 15 минут. */
  URGENT_RESPONSE_WINDOW_MS: 15 * 60_000,
  /** Порог «срочной» заявки — меньше 3 ч до визита. */
  URGENT_THRESHOLD_MS: 3 * 60 * 60_000,
  /** Порог «далёкой» заявки — больше 24 ч до визита. */
  FAR_BOOKING_THRESHOLD_MS: 24 * 60 * 60_000,
  /** Платформенный минимум до начала слота (MVP: без last-minute). */
  PLATFORM_MIN_BOOKING_LEAD_MS: 60 * 60_000,
  /** Напоминание мастеру о pending через N после создания. */
  MASTER_PENDING_REMINDER_MS: 30 * 60_000,
  /** Предупреждение мастеру за N до истечения pending. */
  MASTER_PENDING_DEADLINE_WARNING_MS: 15 * 60_000,
} as const;

export function msUntilStart(startsAt: Date | string, now = Date.now()): number {
  const t = startsAt instanceof Date ? startsAt.getTime() : new Date(startsAt).getTime();
  return t - now;
}

/** Когда pending-заявка должна автоматически истечь. */
export function computePendingExpiresAt(
  createdAt: Date | string,
  startsAt: Date | string,
): Date {
  const createdMs = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  const startMs = startsAt instanceof Date ? startsAt.getTime() : new Date(startsAt).getTime();
  const msUntil = startMs - createdMs;

  if (msUntil < BOOKING_CONFIRMATION_RULES.URGENT_THRESHOLD_MS) {
    return new Date(createdMs + BOOKING_CONFIRMATION_RULES.URGENT_RESPONSE_WINDOW_MS);
  }

  const leadDeadline = startMs - BOOKING_CONFIRMATION_RULES.MIN_CONFIRMATION_LEAD_MS;

  if (msUntil < BOOKING_CONFIRMATION_RULES.FAR_BOOKING_THRESHOLD_MS) {
    return new Date(Math.max(createdMs, leadDeadline));
  }

  const responseDeadline = createdMs + BOOKING_CONFIRMATION_RULES.RESPONSE_WINDOW_MS;
  return new Date(Math.min(responseDeadline, leadDeadline));
}

export function assertPlatformBookingLeadTime(slotStart: Date, now = Date.now()): void {
  const delta = slotStart.getTime() - now;
  if (delta < BOOKING_CONFIRMATION_RULES.PLATFORM_MIN_BOOKING_LEAD_MS) {
    const err = new Error('Это время уже слишком близко. Выберите более позднее окно.');
    (err as Error & { code: string }).code = 'BOOKING_TOO_SOON';
    throw err;
  }
}
