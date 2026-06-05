/** Статусы записи в БД и отображение в UI. */

export const DB_APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'client_arrived',
  'in_progress',
  'master_marked_completed',
  'client_confirmed_completed',
  'completed',
  'no_show',
  'cancelled_by_client',
  'cancelled_by_master',
  'cancelled_by_admin',
  'disputed_by_client',
  'disputed_by_master',
  'expired',
] as const;

export type DbAppointmentStatus = (typeof DB_APPOINTMENT_STATUSES)[number];

export type UiAppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'client_arrived'
  | 'in_progress'
  | 'master_marked_completed'
  | 'client_confirmed_completed'
  | 'completed'
  | 'no_show'
  | 'cancelled'
  | 'disputed';

const TERMINAL_STATUSES = new Set<DbAppointmentStatus>([
  'completed',
  'no_show',
  'cancelled_by_client',
  'cancelled_by_master',
  'cancelled_by_admin',
  'disputed_by_client',
  'disputed_by_master',
  'expired',
]);

export function normalizeDbStatus(raw: string): DbAppointmentStatus {
  const s = raw.trim() as DbAppointmentStatus;
  if ((DB_APPOINTMENT_STATUSES as readonly string[]).includes(s)) return s;
  return 'pending';
}

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.has(normalizeDbStatus(status));
}

export function dbStatusToUi(status: string): UiAppointmentStatus {
  const s = normalizeDbStatus(status);
  switch (s) {
    case 'pending':
      return 'pending';
    case 'confirmed':
      return 'confirmed';
    case 'client_arrived':
      return 'client_arrived';
    case 'in_progress':
      return 'in_progress';
    case 'master_marked_completed':
      return 'master_marked_completed';
    case 'client_confirmed_completed':
      return 'client_confirmed_completed';
    case 'completed':
      return 'completed';
    case 'no_show':
      return 'no_show';
    case 'disputed_by_client':
    case 'disputed_by_master':
      return 'disputed';
    case 'cancelled_by_client':
    case 'cancelled_by_master':
    case 'cancelled_by_admin':
    case 'expired':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export function appointmentStatusLabel(status: string): string {
  const ui = dbStatusToUi(status);
  switch (ui) {
    case 'pending':
      return 'Новая заявка';
    case 'confirmed':
      return 'Подтверждена';
    case 'client_arrived':
      return 'Клиент пришёл';
    case 'in_progress':
      return 'Визит начат';
    case 'master_marked_completed':
      return 'Ожидает подтверждения клиента';
    case 'client_confirmed_completed':
      return 'Клиент подтвердил выполнение';
    case 'completed':
      return 'Завершена';
    case 'no_show':
      return 'Неявка';
    case 'disputed':
      return 'Спор';
    case 'cancelled':
      return 'Отменена';
    default:
      return status;
  }
}

export function statusHint(status: string): string {
  const s = normalizeDbStatus(status);
  switch (s) {
    case 'pending':
      return 'Подтвердите или отклоните заявку';
    case 'confirmed':
      return 'Клиент записан на выбранное время. Начните визит, когда наступит время записи.';
    case 'client_arrived':
      return 'Клиент сообщил, что на месте. Начните визит, когда будете готовы.';
    case 'in_progress':
      return 'После оказания услуги завершите визит.';
    case 'master_marked_completed':
      return 'Ожидаем подтверждение клиента';
    case 'client_confirmed_completed':
      return 'Подтвердите завершение со своей стороны';
    case 'completed':
      return 'Визит завершён';
    case 'no_show':
      return 'Клиент не пришёл на запись';
    case 'disputed_by_client':
      return 'Клиент сообщил о проблеме — ожидайте решения';
    case 'disputed_by_master':
      return 'Открыт спор — ожидайте решения админа';
    case 'cancelled_by_client':
    case 'cancelled_by_master':
    case 'cancelled_by_admin':
      return 'Запись отменена';
    default:
      return '';
  }
}

export function isRequestsTabStatus(status: string): boolean {
  return normalizeDbStatus(status) === 'pending';
}

export function isUpcomingTabStatus(status: string): boolean {
  const s = normalizeDbStatus(status);
  return (
    s === 'confirmed' ||
    s === 'client_arrived' ||
    s === 'in_progress' ||
    s === 'master_marked_completed' ||
    s === 'client_confirmed_completed'
  );
}

export function isHistoryTabStatus(status: string): boolean {
  const s = normalizeDbStatus(status);
  return (
    s === 'completed' ||
    s === 'no_show' ||
    s === 'cancelled_by_client' ||
    s === 'cancelled_by_master' ||
    s === 'cancelled_by_admin' ||
    s === 'disputed_by_client' ||
    s === 'disputed_by_master' ||
    s === 'expired'
  );
}

/** Фактический доход — только полностью завершённые визиты. */
export function countsTowardEarned(status: string): boolean {
  return normalizeDbStatus(status) === 'completed';
}

/** Квалифицирующий визит клиента для аналитики «Клиенты» (не pending/cancelled/expired/no_show). */
export function isQualifyingClientVisit(status: string): boolean {
  const s = normalizeDbStatus(status);
  return (
    s === 'confirmed' ||
    s === 'completed' ||
    s === 'in_progress' ||
    s === 'client_arrived' ||
    s === 'master_marked_completed' ||
    s === 'client_confirmed_completed'
  );
}

export function isCompletedClientVisit(status: string): boolean {
  return normalizeDbStatus(status) === 'completed';
}

export function isUpcomingQualifyingClientVisit(
  status: string,
  visitDateIso: string,
  todayIso: string,
): boolean {
  if (visitDateIso < todayIso) return false;
  const s = normalizeDbStatus(status);
  return (
    s === 'confirmed' ||
    s === 'client_arrived' ||
    s === 'in_progress' ||
    s === 'master_marked_completed' ||
    s === 'client_confirmed_completed'
  );
}

/** Ожидаемый доход — подтверждённые и активные визиты до финального completed. */
export function countsTowardExpected(status: string): boolean {
  const s = normalizeDbStatus(status);
  return (
    s === 'confirmed' ||
    s === 'client_arrived' ||
    s === 'in_progress' ||
    s === 'master_marked_completed' ||
    s === 'client_confirmed_completed'
  );
}

/** Доход «на подтверждении» — мастер отметил выполнение, клиент ещё не подтвердил. */
export function countsTowardPendingConfirmation(status: string): boolean {
  return normalizeDbStatus(status) === 'master_marked_completed';
}

export function countsAsDisputedRevenue(status: string): boolean {
  const s = normalizeDbStatus(status);
  return s === 'disputed_by_client' || s === 'disputed_by_master';
}

export function canClientLeaveReview(status: string, hasOpenDispute: boolean): boolean {
  if (hasOpenDispute) return false;
  return normalizeDbStatus(status) === 'completed';
}

/** SQL fragment for master list/stats «Предстоящие». */
export const UPCOMING_TAB_SQL = `a.status in (
  'confirmed', 'client_arrived', 'in_progress',
  'master_marked_completed', 'client_confirmed_completed'
) and a.ends_at >= now()`;

/** SQL fragment for master list/stats «История». */
export const HISTORY_TAB_SQL = `(
  a.status in (
    'completed', 'no_show',
    'cancelled_by_client', 'cancelled_by_master', 'cancelled_by_admin',
    'disputed_by_client', 'disputed_by_master', 'expired'
  )
  or (
    a.ends_at < now()
    and a.status in (
      'confirmed', 'client_arrived', 'in_progress',
      'master_marked_completed', 'client_confirmed_completed'
    )
  )
)`;

/** Статусы для expected revenue (сумма price_snapshot). */
export const EXPECTED_REVENUE_STATUS_SQL = `a.status in (
  'confirmed', 'client_arrived', 'in_progress',
  'master_marked_completed', 'client_confirmed_completed'
)`;

export const DISPUTED_REVENUE_STATUS_SQL = `a.status in ('disputed_by_client', 'disputed_by_master')`;

export const EARNED_REVENUE_STATUS_SQL = `a.status = 'completed'`;
