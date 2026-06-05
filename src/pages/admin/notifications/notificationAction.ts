import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_BILLING_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PATH,
  getAdminOverviewReputationPath,
  getMasterAdminAppointmentsPath,
  getMasterPath,
  MASTER_SETTINGS_SUPPORT_TICKETS_PATH,
} from '../../../app/paths';
import { reviewNotificationNeedsMasterReply } from '../../../features/notifications/reviewNotificationAction';
import { parseBookingNotificationMetadata } from '../../../features/notifications/bookingNotificationMetadata';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import type { AppointmentsTabId } from '../appointments/appointmentsTypes';
import { resolveMasterNotificationVisualKind } from './masterNotificationModel';

export type MasterNotificationAction = {
  label: string;
  pathname: string;
  /** Полный путь с query, например /admin/appointments?tab=requests&focus=… */
  to: string;
};

const APPOINTMENT_NOTIFY_TYPES = new Set([
  'appointment_new',
  'appointment_pending',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_reminder',
]);

function appointmentsTabForNotifyType(type: string, title: string): AppointmentsTabId {
  const lower = title.toLowerCase();
  switch (type) {
    case 'appointment_new':
    case 'appointment_pending':
      return 'requests';
    case 'appointment_confirmed':
    case 'appointment_reminder':
      return 'upcoming';
    default:
      if (lower.includes('отмен') || lower.includes('неявка')) return 'history';
      return 'history';
  }
}

function buildAppointmentsAction(
  item: MeNotificationRow,
  appointmentId?: string | null,
  labelOverride?: string,
): MasterNotificationAction {
  const tab = appointmentsTabForNotifyType(item.type, item.title);
  const to = getMasterAdminAppointmentsPath({
    tab: tab === 'requests' ? undefined : tab,
    focus: appointmentId ?? undefined,
  });
  const label =
    labelOverride ??
    (tab === 'requests'
      ? appointmentId
        ? 'Открыть заявку'
        : 'К заявкам'
      : appointmentId
        ? 'Открыть запись'
        : 'К записям');
  return { label, pathname: ADMIN_APPOINTMENTS_PATH, to };
}

export function resolveMasterNotificationAction(
  item: MeNotificationRow,
): MasterNotificationAction | null {
  const kind = resolveMasterNotificationVisualKind(item);
  const title = item.title.toLowerCase();

  if (kind === 'review' || item.related_entity_type === 'review') {
    if (reviewNotificationNeedsMasterReply(item)) {
      const reputationPath = getAdminOverviewReputationPath();
      return {
        label: 'Ответить на отзыв',
        pathname: ADMIN_OVERVIEW_PATH,
        to: reputationPath,
      };
    }
    const meta = parseBookingNotificationMetadata(item.metadata);
    const appointmentId = meta?.bookingId ?? null;
    if (appointmentId) {
      return {
        label: 'Открыть запись',
        pathname: ADMIN_APPOINTMENTS_PATH,
        to: getMasterAdminAppointmentsPath({ tab: 'history', focus: appointmentId }),
      };
    }
    return {
      label: 'Посмотреть отзыв',
      pathname: ADMIN_PATH,
      to: ADMIN_PATH,
    };
  }

  if (item.related_entity_type === 'appointment' || APPOINTMENT_NOTIFY_TYPES.has(item.type)) {
    if (title.includes('в пути') || title.includes('опаздывает') || title.includes('на месте')) {
      return buildAppointmentsAction(item, item.related_entity_id, 'Открыть запись');
    }
    if (item.type === 'appointment_pending' || title.includes('заявк')) {
      return buildAppointmentsAction(item, item.related_entity_id, 'Открыть заявку');
    }
    if (kind === 'cancelled') {
      return buildAppointmentsAction(item, item.related_entity_id, 'Подробнее');
    }
    return buildAppointmentsAction(item, item.related_entity_id);
  }

  if (title.includes('топе мастеров') || title.includes('топ мастера')) {
    const masterId = item.related_entity_id;
    if (masterId) {
      const path = getMasterPath(masterId);
      return { label: 'Смотреть в каталоге', pathname: path, to: path };
    }
  }

  if (item.type === 'billing') {
    return {
      label: 'Тариф и оплата',
      pathname: ADMIN_BILLING_PATH,
      to: ADMIN_BILLING_PATH,
    };
  }

  if (item.related_entity_type === 'support_ticket' && item.related_entity_id) {
    const ticketPath = `${MASTER_SETTINGS_SUPPORT_TICKETS_PATH}/${item.related_entity_id}`;
    return {
      label: 'Открыть обращение',
      pathname: MASTER_SETTINGS_SUPPORT_TICKETS_PATH,
      to: ticketPath,
    };
  }

  if (item.type === 'system' && item.title.includes('SUP-')) {
    const match = item.title.match(/SUP-[A-Z0-9-]+/i);
    if (match) {
      const to = `${MASTER_SETTINGS_SUPPORT_TICKETS_PATH}/${match[0]}`;
      return { label: 'Открыть обращение', pathname: MASTER_SETTINGS_SUPPORT_TICKETS_PATH, to };
    }
  }

  return null;
}

export function resolveMasterContactAction(item: MeNotificationRow): MasterNotificationAction | null {
  const booking = resolveMasterNotificationAction(item);
  if (booking?.label.includes('запис') || booking?.label.includes('заявк')) {
    return { ...booking, label: 'Связаться с клиентом' };
  }
  return booking;
}
