import { isTerminalStatus, normalizeDbStatus } from './appointmentStatus.js';

/** Допустимое окно до начала визита (мастер может начать чуть раньше). */
export const VISIT_EARLY_START_MS = 10 * 60 * 1000;
/** Буфер после окончания слота — ещё можно «Начать визит». */
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
  hasOpenDispute?: boolean;
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

function toMs(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function isVisitOverdue(
  endsAt: string | Date,
  status: string,
  now: Date,
): boolean {
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

function phaseCopy(phase: MasterAppointmentPhase, hasClientOnSiteSignal: boolean): {
  phaseLabel: string;
  helperText: string;
  warning: string | null;
} {
  switch (phase) {
    case 'pending':
      return {
        phaseLabel: 'Новая заявка',
        helperText: 'Подтвердите или отклоните заявку клиента.',
        warning: null,
      };
    case 'before_visit':
      return {
        phaseLabel: 'Запись подтверждена',
        helperText: 'Клиент записан на выбранное время.',
        warning: null,
      };
    case 'visit_window':
      return {
        phaseLabel: 'Время визита',
        helperText: hasClientOnSiteSignal
          ? 'Клиент сообщил, что он на месте. Начните визит, когда готовы.'
          : 'Клиент должен быть у вас. Начните визит, когда готовы.',
        warning: null,
      };
    case 'in_progress':
      return {
        phaseLabel: 'Визит идёт',
        helperText: 'После оказания услуги завершите визит.',
        warning: null,
      };
    case 'requires_attention':
      return {
        phaseLabel: 'Визит не закрыт',
        helperText: 'Время записи прошло. Закройте визит или сообщите о проблеме.',
        warning: 'Время визита уже прошло',
      };
    case 'completed':
      return {
        phaseLabel: 'Завершена',
        helperText: 'Визит завершён. Запись сохранена в истории.',
        warning: null,
      };
    default:
      return {
        phaseLabel: 'Запись закрыта',
        helperText: 'Дополнительные действия недоступны.',
        warning: null,
      };
  }
}

function buildActionsForPhase(
  phase: MasterAppointmentPhase,
  tab: MasterAppointmentsTab,
): Pick<
  MasterAppointmentLifecycleResult,
  'primaryAction' | 'secondaryAction' | 'moreActions' | 'allowsActiveLifecycle'
> {
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
      return {
        primaryAction: ACTION.confirm,
        secondaryAction: ACTION.reject,
        moreActions: [],
        allowsActiveLifecycle: true,
      };
    case 'before_visit':
      return {
        primaryAction: null,
        secondaryAction: ACTION.cancel,
        moreActions: [ACTION.contact_client],
        allowsActiveLifecycle: true,
      };
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
      return {
        primaryAction: null,
        secondaryAction: null,
        moreActions: [ACTION.view_details],
        allowsActiveLifecycle: false,
      };
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

  return {
    phase,
    phaseLabel: copy.phaseLabel,
    helperText: copy.helperText,
    warning: copy.warning,
    ...actions,
  };
}

export function assertCanStartVisit(params: {
  status: string;
  startsAt: string | Date;
  endsAt: string | Date;
  now?: Date;
  rules?: MasterAppointmentLifecycleRules;
}): void {
  const now = params.now ?? new Date();
  const db = normalizeDbStatus(params.status);
  if (!['confirmed', 'client_arrived'].includes(db)) {
    throw visitGuardError('BAD_STATUS', 'Начать визит можно только для подтверждённой записи');
  }
  if (isTerminalStatus(db)) {
    throw visitGuardError('BAD_STATUS', 'Запись уже закрыта');
  }
  if (!isInVisitStartWindow(params.startsAt, params.endsAt, now, params.rules)) {
    if (toMs(params.endsAt) < now.getTime()) {
      throw visitGuardError(
        'VISIT_WINDOW_PASSED',
        'Время визита уже прошло. Закройте запись вручную или сообщите о проблеме.',
      );
    }
    throw visitGuardError('VISIT_NOT_STARTED', 'Ещё рано начинать визит — дождитесь времени записи.');
  }
}

export function assertCanCompleteVisit(status: string): void {
  const db = normalizeDbStatus(status);
  if (db !== 'in_progress') {
    throw visitGuardError('BAD_STATUS', 'Завершить визит можно только во время активного визита.');
  }
}

export function assertCanCloseOverdueRecord(params: {
  status: string;
  endsAt: string | Date;
  now?: Date;
}): void {
  const now = params.now ?? new Date();
  const db = normalizeDbStatus(params.status);
  if (
    ![
      'confirmed',
      'client_arrived',
      'in_progress',
      'master_marked_completed',
      'client_confirmed_completed',
    ].includes(db)
  ) {
    throw visitGuardError('BAD_STATUS', 'Закрыть запись нельзя из текущего статуса.');
  }
  if (toMs(params.endsAt) >= now.getTime()) {
    throw visitGuardError('VISIT_NOT_OVER', 'Запись ещё не просрочена — используйте обычные действия.');
  }
}

export function assertCanReportNoShow(params: {
  status: string;
  startsAt: string | Date;
  endsAt: string | Date;
  now?: Date;
}): void {
  const now = params.now ?? new Date();
  const db = normalizeDbStatus(params.status);
  if (!['confirmed', 'client_arrived'].includes(db)) {
    throw visitGuardError(
      'BAD_STATUS',
      'Сообщить о неявке можно только для подтверждённой записи до начала визита.',
    );
  }
  const phase = resolveMasterAppointmentPhase(
    { status: db, startsAt: params.startsAt, endsAt: params.endsAt },
    now,
  );
  if (phase !== 'visit_window' && phase !== 'requires_attention') {
    throw visitGuardError(
      'BAD_TIMING',
      'Сообщить о неявке можно только во время визита или после окончания слота.',
    );
  }
}

export function assertLegacyInstantNoShowForbidden(): never {
  throw visitGuardError(
    'USE_SUPPORT_NO_SHOW',
    'Мгновенная неявка отключена. Используйте «Клиент не пришёл?» — обращение уйдёт в поддержку.',
  );
}

export function assertLegacyClientArrivedForbidden(): never {
  throw visitGuardError(
    'DEPRECATED_CLIENT_ARRIVED',
    'Действие устарело. Используйте «Начать визит» — сигнал клиента «на месте» отображается отдельно.',
  );
}

export function assertCanCancelBeforeEnd(params: {
  status: string;
  endsAt: string | Date;
  now?: Date;
}): void {
  const now = params.now ?? new Date();
  const db = normalizeDbStatus(params.status);
  if (!['pending', 'confirmed', 'client_arrived', 'in_progress'].includes(db)) {
    throw visitGuardError('BAD_STATUS', 'Отмена недоступна для этой записи.');
  }
  if (toMs(params.endsAt) < now.getTime()) {
    throw visitGuardError(
      'VISIT_WINDOW_PASSED',
      'Время визита уже прошло. Закройте запись вручную или сообщите о проблеме.',
    );
  }
}

class VisitGuardError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function visitGuardError(code: string, message: string): VisitGuardError {
  return new VisitGuardError(code, message);
}

export function isVisitGuardError(err: unknown): err is VisitGuardError {
  return err instanceof VisitGuardError;
}

export function visitGuardToApiCode(code: string): string {
  return code;
}

export { VisitGuardError };
