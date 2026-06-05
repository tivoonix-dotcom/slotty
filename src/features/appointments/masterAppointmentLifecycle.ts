/**
 * Lifecycle записи мастера (синхронно с server/src/lib/masterAppointmentLifecycle.ts).
 */
import { normalizeDbStatus } from './appointmentStatus';

export const VISIT_EARLY_START_MS = 10 * 60 * 1000;
export const VISIT_LATE_START_BUFFER_MS = 20 * 60 * 1000;

export type MasterAppointmentsTab = 'requests' | 'upcoming' | 'history';

export type MasterAppointmentPhase =
  | 'pending'
  | 'before_visit'
  | 'visit_window'
  | 'in_progress'
  | 'completed'
  | 'requires_attention'
  | 'terminal';

export type MasterAppointmentActionId =
  | 'confirm'
  | 'reject'
  | 'start_visit'
  | 'complete_visit'
  | 'close_record'
  | 'cancel'
  | 'cancel_visit'
  | 'report_no_show'
  | 'report_problem'
  | 'report_client'
  | 'contact_client'
  | 'view_details';

export type MasterAppointmentAction = {
  id: MasterAppointmentActionId;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
};

export type MasterAppointmentLifecycleInput = {
  status: string;
  startsAt: string | Date;
  endsAt: string | Date;
  hasClientOnSiteSignal?: boolean;
};

export type MasterAppointmentLifecycleRules = {
  visitEarlyStartMs?: number;
  visitLateStartBufferMs?: number;
};

export type MasterAppointmentLifecycleResult = {
  phase: MasterAppointmentPhase;
  phaseLabel: string;
  helperText: string;
  warning: string | null;
  primaryAction: MasterAppointmentAction | null;
  secondaryAction: MasterAppointmentAction | null;
  moreActions: MasterAppointmentAction[];
  allowsActiveLifecycle: boolean;
};

const TERMINAL = new Set([
  'completed',
  'no_show',
  'cancelled_by_client',
  'cancelled_by_master',
  'cancelled_by_admin',
  'disputed_by_client',
  'disputed_by_master',
  'expired',
]);

function toMs(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function isTerminalStatus(status: string): boolean {
  return TERMINAL.has(normalizeDbStatus(status));
}

export function isVisitOverdue(endsAt: string | Date, status: string, now: Date): boolean {
  const db = normalizeDbStatus(status);
  if (isTerminalStatus(db)) return false;
  if (!['confirmed', 'client_arrived', 'in_progress'].includes(db)) return false;
  return toMs(endsAt) < now.getTime();
}

export function isInVisitStartWindow(
  startsAt: string | Date,
  endsAt: string | Date,
  now: Date,
  rules?: MasterAppointmentLifecycleRules,
): boolean {
  const early = rules?.visitEarlyStartMs ?? VISIT_EARLY_START_MS;
  const late = rules?.visitLateStartBufferMs ?? VISIT_LATE_START_BUFFER_MS;
  const t = now.getTime();
  return t >= toMs(startsAt) - early && t <= toMs(endsAt) + late;
}

export function resolveMasterAppointmentPhase(
  input: MasterAppointmentLifecycleInput,
  now: Date,
  rules?: MasterAppointmentLifecycleRules,
): MasterAppointmentPhase {
  const db = normalizeDbStatus(input.status);
  if (db === 'pending') return 'pending';
  if (db === 'completed') return 'completed';
  if (isTerminalStatus(db)) return 'terminal';
  if (db === 'in_progress') {
    if (isVisitOverdue(input.endsAt, db, now)) return 'requires_attention';
    return 'in_progress';
  }
  if (db === 'master_marked_completed' || db === 'client_confirmed_completed') {
    if (toMs(input.endsAt) < now.getTime()) return 'requires_attention';
    return 'completed';
  }

  if (isVisitOverdue(input.endsAt, db, now)) return 'requires_attention';
  if (['confirmed', 'client_arrived'].includes(db)) {
    if (isInVisitStartWindow(input.startsAt, input.endsAt, now, rules)) return 'visit_window';
    return 'before_visit';
  }
  return 'terminal';
}

const ACTION: Record<MasterAppointmentActionId, MasterAppointmentAction> = {
  confirm: { id: 'confirm', label: 'Подтвердить заявку', variant: 'primary' },
  reject: { id: 'reject', label: 'Отклонить', variant: 'danger' },
  start_visit: { id: 'start_visit', label: 'Начать визит', variant: 'primary' },
  complete_visit: { id: 'complete_visit', label: 'Завершить визит', variant: 'primary' },
  close_record: { id: 'close_record', label: 'Закрыть запись', variant: 'primary' },
  cancel: { id: 'cancel', label: 'Отменить', variant: 'secondary' },
  cancel_visit: { id: 'cancel_visit', label: 'Отменить визит', variant: 'danger' },
  report_no_show: { id: 'report_no_show', label: 'Клиент не пришёл?', variant: 'secondary' },
  report_problem: { id: 'report_problem', label: 'Есть проблема', variant: 'secondary' },
  report_client: { id: 'report_client', label: 'Пожаловаться на клиента', variant: 'secondary' },
  contact_client: { id: 'contact_client', label: 'Связаться с клиентом', variant: 'secondary' },
  view_details: { id: 'view_details', label: 'Смотреть детали', variant: 'secondary' },
};

function phaseCopy(phase: MasterAppointmentPhase, hasClientOnSiteSignal: boolean) {
  switch (phase) {
    case 'pending':
      return { phaseLabel: 'Новая заявка', helperText: 'Подтвердите или отклоните заявку клиента.', warning: null };
    case 'before_visit':
      return { phaseLabel: 'Запись подтверждена', helperText: 'Клиент записан на выбранное время.', warning: null };
    case 'visit_window':
      return {
        phaseLabel: 'Время визита',
        helperText: hasClientOnSiteSignal
          ? 'Клиент сообщил, что он на месте. Начните визит, когда готовы.'
          : 'Клиент должен быть у вас. Начните визит, когда готовы.',
        warning: null,
      };
    case 'in_progress':
      return { phaseLabel: 'Визит идёт', helperText: 'После оказания услуги завершите визит.', warning: null };
    case 'requires_attention':
      return {
        phaseLabel: 'Визит не закрыт',
        helperText: 'Время записи прошло. Закройте визит или сообщите о проблеме.',
        warning: 'Время визита уже прошло',
      };
    case 'completed':
      return { phaseLabel: 'Завершена', helperText: 'Визит завершён. Запись сохранена в истории.', warning: null };
    default:
      return { phaseLabel: 'Запись закрыта', helperText: 'Дополнительные действия недоступны.', warning: null };
  }
}

function buildActionsForPhase(phase: MasterAppointmentPhase, tab: MasterAppointmentsTab) {
  if (tab === 'history') {
    if (phase === 'requires_attention') {
      return {
        primaryAction: ACTION.close_record,
        secondaryAction: ACTION.report_no_show,
        moreActions: [ACTION.report_problem],
        allowsActiveLifecycle: true,
      };
    }
    if (phase === 'completed') {
      return {
        primaryAction: ACTION.report_client,
        secondaryAction: null,
        moreActions: [],
        allowsActiveLifecycle: true,
      };
    }
    return {
      primaryAction: null,
      secondaryAction: null,
      moreActions: [ACTION.view_details],
      allowsActiveLifecycle: false,
    };
  }
  switch (phase) {
    case 'pending':
      return { primaryAction: ACTION.confirm, secondaryAction: ACTION.reject, moreActions: [], allowsActiveLifecycle: true };
    case 'before_visit':
      return { primaryAction: null, secondaryAction: ACTION.cancel, moreActions: [ACTION.contact_client], allowsActiveLifecycle: true };
    case 'visit_window':
      return {
        primaryAction: ACTION.start_visit,
        secondaryAction: ACTION.report_no_show,
        moreActions: [ACTION.cancel, ACTION.report_problem],
        allowsActiveLifecycle: true,
      };
    case 'in_progress':
      return {
        primaryAction: ACTION.complete_visit,
        secondaryAction: ACTION.report_problem,
        moreActions: [ACTION.cancel_visit],
        allowsActiveLifecycle: true,
      };
    case 'requires_attention':
      return {
        primaryAction: ACTION.close_record,
        secondaryAction: ACTION.report_no_show,
        moreActions: [ACTION.report_problem],
        allowsActiveLifecycle: true,
      };
    case 'completed':
      return {
        primaryAction: ACTION.report_client,
        secondaryAction: null,
        moreActions: [],
        allowsActiveLifecycle: true,
      };
    default:
      return { primaryAction: null, secondaryAction: null, moreActions: [ACTION.view_details], allowsActiveLifecycle: false };
  }
}

export function buildMasterAppointmentActions(
  appointment: MasterAppointmentLifecycleInput,
  now: Date,
  rules: MasterAppointmentLifecycleRules | undefined,
  tab: MasterAppointmentsTab,
): MasterAppointmentLifecycleResult {
  const phase = resolveMasterAppointmentPhase(appointment, now, rules);
  const copy = phaseCopy(phase, Boolean(appointment.hasClientOnSiteSignal));
  const actions = buildActionsForPhase(phase, tab);
  return { phase, phaseLabel: copy.phaseLabel, helperText: copy.helperText, warning: copy.warning, ...actions };
}

export function isRequiresAttentionAppointment(
  row: { status: string; dbStatus?: string; startsAt?: string; endsAt?: string; date?: string; time?: string },
  now = new Date(),
): boolean {
  const status = row.dbStatus ?? row.status;
  const endsAt = row.endsAt ?? (row.date && row.time ? `${row.date}T${row.time}:00` : null);
  const startsAt = row.startsAt ?? endsAt;
  if (!endsAt || !startsAt) return false;
  return (
    resolveMasterAppointmentPhase({ status, startsAt, endsAt, hasClientOnSiteSignal: false }, now) ===
    'requires_attention'
  );
}
