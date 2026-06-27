import {
  appointmentStatusLabel,
  normalizeDbStatus,
} from '../../../features/appointments/appointmentStatus';
import { isVisitOverdue } from '../../../features/appointments/masterAppointmentLifecycle';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { bookingSourceLabel } from '../appointments/appointmentsFormat';
import { formatPendingDeadline } from '../appointments/formatPendingDeadline';
import { formatBynRu } from '../overview/overviewFormat';

export type BookingNotificationActionId = 'accept' | 'reject' | 'open' | 'cancel' | 'close';

export type BookingNotificationFooterAction = {
  id: BookingNotificationActionId;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
};

export function formatAppointmentWhenRange(
  startsAt: string,
  endsAt?: string | null,
): string {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return 'Дата не указана';
  const date = start.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const startTime = start.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (!endsAt) return `${date}, ${startTime}`;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return `${date}, ${startTime}`;
  const endTime = end.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date}, ${startTime}–${endTime}`;
}

export function formatVisitFormatLabel(visitType?: string | null): string {
  if (visitType === 'at_home') return 'На дому';
  if (visitType === 'studio') return 'В салоне';
  return 'В салоне';
}

export function formatVisitAddress(address?: string | null): string {
  const value = address?.trim();
  return value || 'Адрес не указан';
}

export type BookingNotificationTimingContext = {
  endsAt?: string | null;
  now?: Date;
};

export function resolveBookingVisitEndsAt(
  appointment: Pick<DemoMasterAppointment, 'endsAt' | 'startsAt' | 'date' | 'time'>,
): string | null {
  if (appointment.endsAt) return appointment.endsAt;
  if (appointment.startsAt) return appointment.startsAt;
  if (appointment.date && appointment.time) return `${appointment.date}T${appointment.time}:00`;
  return null;
}

export function isOverdueBookingNotification(
  dbStatus: string,
  timing?: BookingNotificationTimingContext,
): boolean {
  const endsAt = timing?.endsAt;
  if (!endsAt) return false;
  return isVisitOverdue(endsAt, dbStatus, timing?.now ?? new Date());
}

export function bookingNotificationStatusBadge(
  dbStatus: string,
  timing?: BookingNotificationTimingContext,
): {
  label: string;
  className: string;
} {
  const status = normalizeDbStatus(dbStatus);
  if (isOverdueBookingNotification(status, timing)) {
    return {
      label: 'Визит не закрыт',
      className: 'bg-[#FFF4E8] text-[#B45309]',
    };
  }
  if (status === 'pending') {
    return {
      label: 'Ожидает подтверждения',
      className: 'bg-[#FFF4E8] text-[#B45309]',
    };
  }
  if (status === 'confirmed' || status === 'client_arrived') {
    return {
      label: appointmentStatusLabel(status),
      className: 'bg-[#ECFDF5] text-[#16A34A]',
    };
  }
  if (
    status === 'cancelled_by_client' ||
    status === 'cancelled_by_master' ||
    status === 'cancelled_by_admin' ||
    status === 'expired'
  ) {
    return {
      label: 'Отменена',
      className: 'bg-[#F3F4F6] text-[#6B7280]',
    };
  }
  if (status === 'completed') {
    return {
      label: 'Завершена',
      className: 'bg-[#EEF2FF] text-[#4F46E5]',
    };
  }
  return {
    label: appointmentStatusLabel(status),
    className: 'bg-[#EBEBEB] text-[#6B7280]',
  };
}

export function isTerminalBookingStatus(dbStatus: string): boolean {
  const status = normalizeDbStatus(dbStatus);
  return [
    'cancelled_by_client',
    'cancelled_by_master',
    'cancelled_by_admin',
    'completed',
    'no_show',
    'expired',
    'disputed_by_client',
    'disputed_by_master',
  ].includes(status);
}

export function isPendingBookingStatus(dbStatus: string): boolean {
  return normalizeDbStatus(dbStatus) === 'pending';
}

export function resolveBookingNotificationActions(
  dbStatus: string,
  timing?: BookingNotificationTimingContext,
): BookingNotificationFooterAction[] {
  const status = normalizeDbStatus(dbStatus);

  if (status === 'pending') {
    return [
      { id: 'accept', label: 'Принять запись', variant: 'primary' },
      { id: 'reject', label: 'Отклонить', variant: 'danger' },
      { id: 'open', label: 'Открыть запись', variant: 'secondary' },
      { id: 'close', label: 'Закрыть', variant: 'secondary' },
    ];
  }

  if (status === 'confirmed' || status === 'client_arrived' || status === 'in_progress') {
    if (isOverdueBookingNotification(status, timing)) {
      return [
        { id: 'open', label: 'Открыть запись', variant: 'primary' },
        { id: 'close', label: 'Закрыть', variant: 'secondary' },
      ];
    }
    return [
      { id: 'open', label: 'Открыть запись', variant: 'primary' },
      { id: 'cancel', label: 'Отменить', variant: 'danger' },
      { id: 'close', label: 'Закрыть', variant: 'secondary' },
    ];
  }

  if (isTerminalBookingStatus(status)) {
    return [
      { id: 'open', label: 'Открыть запись', variant: 'primary' },
      { id: 'close', label: 'Закрыть', variant: 'secondary' },
    ];
  }

  return [
    { id: 'open', label: 'Открыть запись', variant: 'primary' },
    { id: 'close', label: 'Закрыть', variant: 'secondary' },
  ];
}

export function bookingNotificationHint(
  dbStatus: string,
  notificationType: string,
  pendingExpiresAt?: string | null,
  timing?: BookingNotificationTimingContext,
): string {
  if (isPendingBookingStatus(dbStatus)) {
    const deadline = formatPendingDeadline(pendingExpiresAt);
    if (deadline) return deadline.helper;
    return 'Проверьте детали и примите или отклоните заявку. После подтверждения клиент получит уведомление.';
  }
  if (isTerminalBookingStatus(dbStatus)) {
    return 'Запись уже закрыта. Откройте карточку, чтобы посмотреть историю и детали.';
  }
  if (isOverdueBookingNotification(dbStatus, timing)) {
    return 'Время записи уже прошло. Откройте карточку и закройте визит или отметьте, что клиент не пришёл.';
  }
  if (notificationType === 'appointment_reminder') {
    return 'Напоминание о предстоящей записи. Откройте карточку, если нужны контакты клиента.';
  }
  return 'Откройте запись в кабинете, чтобы управлять визитом.';
}

export function serviceCategoryLabel(category?: string | null): string | null {
  const value = category?.trim();
  return value || null;
}

export function formatServicePrice(priceByn: number): string {
  if (!Number.isFinite(priceByn) || priceByn <= 0) return 'Цена не указана';
  return formatBynRu(priceByn);
}

export function formatBookingSource(source?: string | null): string {
  return bookingSourceLabel(source);
}

export type BookingNotificationViewModel = {
  appointment: DemoMasterAppointment;
  dbStatus: string;
  whenRange: string;
  visitFormat: string;
  visitAddress: string;
  serviceCategory: string | null;
  cancelReason: string | null;
  statusBadge: ReturnType<typeof bookingNotificationStatusBadge>;
};

export function buildBookingNotificationViewModel(
  appointment: DemoMasterAppointment,
  extras?: {
    visitType?: string | null;
    serviceCategory?: string | null;
    cancelReason?: string | null;
  },
): BookingNotificationViewModel {
  const dbStatus = appointment.dbStatus ?? appointment.status;
  const timing = { endsAt: resolveBookingVisitEndsAt(appointment) };
  return {
    appointment,
    dbStatus,
    whenRange: formatAppointmentWhenRange(
      appointment.startsAt ?? `${appointment.date}T${appointment.time}:00`,
      appointment.endsAt,
    ),
    visitFormat: formatVisitFormatLabel(extras?.visitType),
    visitAddress: formatVisitAddress(appointment.addressShort),
    serviceCategory: serviceCategoryLabel(extras?.serviceCategory),
    cancelReason: extras?.cancelReason?.trim() || null,
    statusBadge: bookingNotificationStatusBadge(dbStatus, timing),
  };
}
