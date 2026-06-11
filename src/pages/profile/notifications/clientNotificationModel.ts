import { resolveClientNotificationAction } from '../../../features/notifications/clientNotificationAction';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import { formatNotificationPreviewBody } from '../../../features/notifications/formatNotificationPreview';
import { parseBookingNotificationMetadata } from '../../../features/notifications/bookingNotificationMetadata';
import { parseNotificationSummary } from '../../../features/notifications/parseNotificationSummary';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import {
  getMasterNotificationVisual,
  groupMasterNotificationsByTime,
  resolveMasterNotificationStatusBadge,
  resolveMasterNotificationVisualKind,
  type MasterNotificationCardModel,
  type MasterNotificationFilter,
  type MasterNotificationStats,
  type MasterNotificationTimeGroup,
} from '../../admin/notifications/masterNotificationModel';

export type ClientNotificationStats = MasterNotificationStats;
export type ClientNotificationFilter = MasterNotificationFilter;
export type ClientNotificationTimeGroup = MasterNotificationTimeGroup;
export type ClientNotificationCardModel = MasterNotificationCardModel;

export { groupMasterNotificationsByTime as groupClientNotificationsByTime };

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatWhenFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function clientNotificationRequiresAction(item: MeNotificationRow): boolean {
  if (item.read_at) return false;
  if (item.type === 'review_request') return true;
  return resolveClientNotificationAction(item) !== null;
}

export function matchesClientNotificationFilter(
  item: MeNotificationRow,
  filter: ClientNotificationFilter,
): boolean {
  if (filter === 'all') return true;

  const kind = resolveMasterNotificationVisualKind(item);
  const title = item.title.trim().toLowerCase();

  switch (filter) {
    case 'action_required':
      return clientNotificationRequiresAction(item);
    case 'appointments':
      return (
        item.related_entity_type === 'appointment' ||
        ['appointment_pending', 'appointment_confirmed', 'appointment_new'].includes(item.type) ||
        kind === 'success'
      );
    case 'reminders':
      return kind === 'reminder' || item.type === 'appointment_reminder';
    case 'reviews':
      return kind === 'review' || item.type === 'review_request' || item.related_entity_type === 'review';
    case 'cancellations':
      return kind === 'cancelled' || item.type === 'appointment_cancelled' || title.includes('отмен');
    case 'system':
      return kind === 'system' || kind === 'billing' || item.type === 'system' || item.type === 'billing';
    default:
      return true;
  }
}

export function computeClientNotificationStats(items: MeNotificationRow[]): ClientNotificationStats {
  let actionRequired = 0;
  let unread = 0;
  let today = 0;
  let read = 0;

  for (const item of items) {
    if (!item.read_at) unread += 1;
    else read += 1;
    if (clientNotificationRequiresAction(item)) actionRequired += 1;
    if (isToday(item.created_at)) today += 1;
  }

  return { actionRequired, unread, today, read };
}

export function countClientNotificationsByFilter(
  items: MeNotificationRow[],
  filter: ClientNotificationFilter,
): number {
  if (filter === 'all') return items.length;
  return items.filter((item) => matchesClientNotificationFilter(item, filter)).length;
}

function extractContextFromItem(item: MeNotificationRow): {
  masterName: string | null;
  serviceName: string | null;
  whenLabel: string | null;
} {
  const summary = parseNotificationSummary(item);
  const meta = parseBookingNotificationMetadata(item.metadata);

  return {
    masterName: summary.find((r) => r.label === 'Мастер')?.value?.trim() ?? null,
    serviceName: summary.find((r) => r.label === 'Услуга')?.value ?? meta?.serviceName?.trim() ?? null,
    whenLabel:
      summary.find((r) => r.label === 'Когда')?.value ??
      formatWhenFromIso(meta?.startsAt) ??
      null,
  };
}

function resolveListActionLabel(item: MeNotificationRow): string {
  return resolveClientNotificationAction(item)?.label ?? 'Подробнее';
}

export function buildClientNotificationCardModel(item: MeNotificationRow): ClientNotificationCardModel {
  const visual = getMasterNotificationVisual(item);
  const { masterName, serviceName, whenLabel } = extractContextFromItem(item);

  return {
    visual,
    statusBadge: resolveMasterNotificationStatusBadge(item),
    isUnread: !item.read_at,
    requiresAction: clientNotificationRequiresAction(item),
    title: item.title,
    description: formatNotificationPreviewBody(item),
    clientName: masterName,
    serviceName,
    whenLabel,
    listActionLabel: resolveListActionLabel(item),
    createdAtLabel: formatNotificationListTime(item.created_at),
  };
}
