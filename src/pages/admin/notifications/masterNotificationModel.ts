import type { IconType } from 'react-icons';
import {
  HiBellAlert,
  HiCheckBadge,
  HiClock,
  HiCreditCard,
  HiExclamationTriangle,
  HiInboxArrowDown,
  HiMapPin,
  HiStar,
  HiXCircle,
} from 'react-icons/hi2';
import { formatNotificationPreviewBody } from '../../../features/notifications/formatNotificationPreview';
import { reviewNotificationNeedsMasterReply } from '../../../features/notifications/reviewNotificationAction';
import { parseBookingNotificationMetadata } from '../../../features/notifications/bookingNotificationMetadata';
import { parseNotificationSummary } from '../../../features/notifications/parseNotificationSummary';
import { resolveNotificationClientName } from '../../../features/notifications/resolveNotificationClientName';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import type { BookingNotificationViewModel } from './bookingNotificationModel';

export type MasterNotificationFilter =
  | 'all'
  | 'action_required'
  | 'appointments'
  | 'reminders'
  | 'reviews'
  | 'cancellations'
  | 'system';

export type MasterNotificationVisualKind =
  | 'new_request'
  | 'pending_request'
  | 'expiring_request'
  | 'client_signal'
  | 'reminder'
  | 'success'
  | 'review'
  | 'cancelled'
  | 'billing'
  | 'system';

export type MasterNotificationStatusId =
  | 'new'
  | 'action_required'
  | 'cancelled'
  | 'reminder'
  | 'completed'
  | 'system';

export type MasterNotificationVisualStyle = {
  kind: MasterNotificationVisualKind;
  icon: IconType;
  stripClass: string;
  stickerClass: string;
  stickerClassRead: string;
  emoji: string;
};

export type MasterNotificationStatusBadge = {
  id: MasterNotificationStatusId;
  label: string;
  className: string;
};

export type MasterNotificationStats = {
  actionRequired: number;
  unread: number;
  today: number;
  read: number;
};

export type MasterNotificationTimeGroupId = 'today' | 'yesterday' | 'earlier';

export type MasterNotificationTimeGroup = {
  id: MasterNotificationTimeGroupId;
  label: string;
  items: MeNotificationRow[];
};

export type MasterNotificationCardModel = {
  visual: MasterNotificationVisualStyle;
  statusBadge: MasterNotificationStatusBadge | null;
  isUnread: boolean;
  requiresAction: boolean;
  title: string;
  description: string;
  clientName: string | null;
  serviceName: string | null;
  whenLabel: string | null;
  listActionLabel: string;
  createdAtLabel: string;
};

export type MasterNotificationDetailActionId =
  | 'open_booking'
  | 'open_request'
  | 'contact_client'
  | 'view_review'
  | 'open_profile'
  | 'open_schedule'
  | 'open_billing'
  | 'open_support'
  | 'mark_read'
  | 'close'
  | 'details';

export type MasterNotificationDetailAction = {
  id: MasterNotificationDetailActionId;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
};

export type MasterNotificationDetailModel = {
  visual: MasterNotificationVisualStyle;
  statusBadge: MasterNotificationStatusBadge | null;
  title: string;
  createdAtLabel: string;
  narrative: string;
  contextRows: Array<{ label: string; value: string }>;
  highlight?: string | null;
  rating?: number | null;
  reviewBody?: string | null;
};

const ACTION_TITLES = new Set([
  'новая заявка',
  'заявка ждёт решения',
  'заявка скоро истечёт',
  'клиент на месте',
  'клиент сообщил о проблеме',
]);

function titleLower(item: MeNotificationRow): string {
  return item.title.trim().toLowerCase();
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isYesterday(iso: string): boolean {
  const d = new Date(iso);
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  return (
    d.getFullYear() === yest.getFullYear() &&
    d.getMonth() === yest.getMonth() &&
    d.getDate() === yest.getDate()
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

function extractRatingFromBody(body: string): number | null {
  const m = body.match(/\((\d)★\)|(\d)\s*★|(\d)\s*звезд/i);
  if (!m) return null;
  const n = Number(m[1] ?? m[2] ?? m[3]);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
}

export function resolveMasterNotificationVisualKind(item: MeNotificationRow): MasterNotificationVisualKind {
  const title = titleLower(item);

  if (item.related_entity_type === 'review' || title.includes('отзыв')) return 'review';
  if (
    item.type === 'appointment_cancelled' ||
    title.includes('отмен') ||
    title.includes('неявка') ||
    title.includes('заявка истекла')
  ) {
    return 'cancelled';
  }
  if (item.type === 'appointment_reminder' || title.includes('напоминан')) return 'reminder';
  if (
    title.includes('в пути') ||
    title.includes('опаздывает') ||
    title.includes('на месте') ||
    title.includes('комментарий клиента')
  ) {
    return 'client_signal';
  }
  if (title.includes('топе мастеров') || title.includes('топ мастера')) return 'success';
  if (item.type === 'billing') return 'billing';
  if (item.type === 'system') return 'system';
  if (
    item.type === 'appointment_confirmed' &&
    (title.includes('заверш') || title.includes('подтвердил') || title.includes('выполнен'))
  ) {
    return 'success';
  }
  if (title.includes('скоро истечёт')) return 'expiring_request';
  if (title.includes('ждёт решения')) return 'pending_request';
  if (title.includes('новая заявка') || item.type === 'appointment_new') return 'new_request';
  if (item.type === 'appointment_pending') return 'pending_request';
  return 'system';
}

export function isMasterRequestNotificationKind(kind: MasterNotificationVisualKind): boolean {
  return kind === 'new_request' || kind === 'pending_request' || kind === 'expiring_request';
}

const VISUAL_STYLES: Record<MasterNotificationVisualKind, Omit<MasterNotificationVisualStyle, 'kind'>> = {
  new_request: {
    icon: HiInboxArrowDown,
    stripClass: 'bg-[#FFF1F4]',
    stickerClass: 'bg-[#FFF1F4] text-[#F47C8C]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#F47C8C]',
    emoji: '📥',
  },
  pending_request: {
    icon: HiClock,
    stripClass: 'bg-[#EFF6FF]',
    stickerClass: 'bg-[#EFF6FF] text-[#2563EB]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#2563EB]',
    emoji: '⏳',
  },
  expiring_request: {
    icon: HiExclamationTriangle,
    stripClass: 'bg-[#FFF7ED]',
    stickerClass: 'bg-[#FFF7ED] text-[#EA580C]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#EA580C]',
    emoji: '⚠️',
  },
  client_signal: {
    icon: HiMapPin,
    stripClass: 'bg-[#EFF6FF]',
    stickerClass: 'bg-[#EFF6FF] text-[#2563EB]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#2563EB]',
    emoji: '📍',
  },
  reminder: {
    icon: HiClock,
    stripClass: 'bg-[#F5F3FF]',
    stickerClass: 'bg-[#F5F3FF] text-[#7C3AED]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#7C3AED]',
    emoji: '⏰',
  },
  success: {
    icon: HiCheckBadge,
    stripClass: 'bg-[#ECFDF5]',
    stickerClass: 'bg-[#ECFDF5] text-[#15803D]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#15803D]',
    emoji: '✅',
  },
  review: {
    icon: HiStar,
    stripClass: 'bg-[#ECFDF5]',
    stickerClass: 'bg-[#ECFDF5] text-[#15803D]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#D97706]',
    emoji: '⭐',
  },
  cancelled: {
    icon: HiXCircle,
    stripClass: 'bg-[#FFF7ED]',
    stickerClass: 'bg-[#FFF7ED] text-[#EA580C]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#EA580C]',
    emoji: '✕',
  },
  billing: {
    icon: HiCreditCard,
    stripClass: 'bg-[#F5F3FF]',
    stickerClass: 'bg-[#F5F3FF] text-[#7C3AED]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#7C3AED]',
    emoji: '💳',
  },
  system: {
    icon: HiBellAlert,
    stripClass: 'bg-[#F3F4F6]',
    stickerClass: 'bg-[#F3F4F6] text-[#6B7280]',
    stickerClassRead: 'bg-[#F5F5F5] text-[#6B7280]',
    emoji: 'ℹ️',
  },
};

export function getMasterNotificationVisual(item: MeNotificationRow): MasterNotificationVisualStyle {
  const kind = resolveMasterNotificationVisualKind(item);
  return { kind, ...VISUAL_STYLES[kind] };
}

export function masterNotificationRequiresAction(item: MeNotificationRow): boolean {
  if (!item.read_at && isMasterRequestNotificationKind(resolveMasterNotificationVisualKind(item))) {
    return true;
  }
  const title = titleLower(item);
  if (ACTION_TITLES.has(title)) return true;
  if (item.type === 'appointment_pending') return true;
  if (title.includes('на месте') && !item.read_at) return true;
  if (title.includes('ждёт решения') || title.includes('скоро истечёт')) return true;
  if (title.includes('проблеме')) return true;
  if (reviewNotificationNeedsMasterReply(item)) return true;
  return false;
}

export function resolveMasterNotificationStatusBadge(
  item: MeNotificationRow,
): MasterNotificationStatusBadge | null {
  const kind = resolveMasterNotificationVisualKind(item);
  const title = titleLower(item);

  if (!item.read_at) {
    return {
      id: 'new',
      label: 'Новое',
      className: 'bg-[#FFF1F4] text-[#F47C8C]',
    };
  }

  if (masterNotificationRequiresAction(item)) {
    return {
      id: 'action_required',
      label: 'Требует ответа',
      className: 'bg-[#FFF4E8] text-[#B45309]',
    };
  }

  if (kind === 'cancelled') {
    return {
      id: 'cancelled',
      label: 'Отмена',
      className: 'bg-[#FFF7ED] text-[#EA580C]',
    };
  }

  if (kind === 'reminder' || title.includes('напоминан')) {
    return {
      id: 'reminder',
      label: 'Напоминание',
      className: 'bg-[#F5F3FF] text-[#7C3AED]',
    };
  }

  if (kind === 'review' && reviewNotificationNeedsMasterReply(item)) {
    return {
      id: 'action_required',
      label: 'Нужен ответ',
      className: 'bg-[#FFF4E8] text-[#B45309]',
    };
  }

  if (kind === 'success' || kind === 'review') {
    return {
      id: 'completed',
      label: kind === 'review' ? 'Отзыв' : 'Выполнено',
      className: 'bg-[#ECFDF5] text-[#15803D]',
    };
  }

  if (kind === 'system' || kind === 'billing') {
    return {
      id: 'system',
      label: 'Системное',
      className: 'bg-[#F3F4F6] text-[#6B7280]',
    };
  }

  return null;
}

export function matchesMasterNotificationFilter(
  item: MeNotificationRow,
  filter: MasterNotificationFilter,
): boolean {
  if (filter === 'all') return true;
  const kind = resolveMasterNotificationVisualKind(item);
  const title = titleLower(item);

  switch (filter) {
    case 'action_required':
      return masterNotificationRequiresAction(item);
    case 'appointments':
      return (
        item.related_entity_type === 'appointment' ||
        ['appointment_new', 'appointment_pending', 'appointment_confirmed'].includes(item.type) ||
        isMasterRequestNotificationKind(kind) ||
        kind === 'client_signal' ||
        kind === 'success'
      );
    case 'reminders':
      return (
        kind === 'reminder' ||
        kind === 'pending_request' ||
        kind === 'expiring_request' ||
        title.includes('ждёт решения') ||
        title.includes('скоро истечёт')
      );
    case 'reviews':
      return kind === 'review' || item.related_entity_type === 'review';
    case 'cancellations':
      return kind === 'cancelled';
    case 'system':
      return kind === 'system' || kind === 'billing' || item.type === 'system' || item.type === 'billing';
    default:
      return true;
  }
}

export function computeMasterNotificationStats(items: MeNotificationRow[]): MasterNotificationStats {
  let actionRequired = 0;
  let unread = 0;
  let today = 0;
  let read = 0;

  for (const item of items) {
    if (!item.read_at) unread += 1;
    else read += 1;
    if (masterNotificationRequiresAction(item)) actionRequired += 1;
    if (isToday(item.created_at)) today += 1;
  }

  return { actionRequired, unread, today, read };
}

function formatEarlierGroupLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Ранее';
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function groupMasterNotificationsByTime(items: MeNotificationRow[]): MasterNotificationTimeGroup[] {
  const today: MeNotificationRow[] = [];
  const yesterday: MeNotificationRow[] = [];
  const earlierByDate = new Map<string, MeNotificationRow[]>();

  for (const item of items) {
    if (isToday(item.created_at)) {
      today.push(item);
      continue;
    }
    if (isYesterday(item.created_at)) {
      yesterday.push(item);
      continue;
    }
    const d = new Date(item.created_at);
    const key = Number.isNaN(d.getTime())
      ? 'unknown'
      : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const bucket = earlierByDate.get(key) ?? [];
    bucket.push(item);
    earlierByDate.set(key, bucket);
  }

  const groups: MasterNotificationTimeGroup[] = [];
  if (today.length) groups.push({ id: 'today', label: 'Сегодня', items: today });
  if (yesterday.length) groups.push({ id: 'yesterday', label: 'Вчера', items: yesterday });

  for (const [, bucket] of earlierByDate) {
    if (!bucket.length) continue;
    groups.push({
      id: 'earlier',
      label: formatEarlierGroupLabel(bucket[0].created_at),
      items: bucket,
    });
  }

  return groups;
}

function resolveListActionLabel(item: MeNotificationRow): string {
  const kind = resolveMasterNotificationVisualKind(item);
  const title = titleLower(item);

  if (
    isMasterRequestNotificationKind(kind) &&
    (item.type === 'appointment_pending' || title.includes('заявк'))
  ) {
    return 'Открыть заявку';
  }
  if (kind === 'client_signal') return 'Открыть запись';
  if (kind === 'reminder') return 'Открыть запись';
  if (kind === 'review') {
    return reviewNotificationNeedsMasterReply(item) ? 'Ответить на отзыв' : 'Посмотреть отзыв';
  }
  if (kind === 'cancelled') return 'Подробнее';
  if (kind === 'success') return 'Открыть запись';
  if (item.type === 'billing') return 'Тариф и оплата';
  if (item.related_entity_type === 'support_ticket') return 'Открыть обращение';
  return 'Подробнее';
}

function extractContextFromItem(item: MeNotificationRow): {
  clientName: string | null;
  serviceName: string | null;
  whenLabel: string | null;
} {
  const summary = parseNotificationSummary(item);
  const meta = parseBookingNotificationMetadata(item.metadata);

  const clientFromSummary = summary.find((r) => r.label === 'Клиент')?.value?.trim() ?? null;

  return {
    clientName:
      resolveNotificationClientName({
        full_name: clientFromSummary ?? meta?.clientName ?? null,
        phone: meta?.clientPhone ?? null,
      }) ?? clientFromSummary,
    serviceName: summary.find((r) => r.label === 'Услуга')?.value ?? meta?.serviceName?.trim() ?? null,
    whenLabel:
      summary.find((r) => r.label === 'Когда')?.value ??
      formatWhenFromIso(meta?.startsAt) ??
      null,
  };
}

export function buildMasterNotificationCardModel(item: MeNotificationRow): MasterNotificationCardModel {
  const visual = getMasterNotificationVisual(item);
  const { clientName, serviceName, whenLabel } = extractContextFromItem(item);

  return {
    visual,
    statusBadge: resolveMasterNotificationStatusBadge(item),
    isUnread: !item.read_at,
    requiresAction: masterNotificationRequiresAction(item),
    title: item.title,
    description: formatNotificationPreviewBody(item),
    clientName,
    serviceName,
    whenLabel,
    listActionLabel: resolveListActionLabel(item),
    createdAtLabel: formatNotificationListTime(item.created_at),
  };
}

function buildNarrative(item: MeNotificationRow): string {
  const kind = resolveMasterNotificationVisualKind(item);
  const title = titleLower(item);
  const { clientName, serviceName, whenLabel } = extractContextFromItem(item);
  const client = clientName ?? 'Клиент';
  const service = serviceName ? `«${serviceName}»` : 'запись';

  if (title.includes('в пути')) {
    return `${client} сообщил, что уже в пути и скоро будет на ${service}. Подготовьтесь к визиту.`;
  }
  if (title.includes('опаздывает')) {
    return `${client} предупредил об опоздании на ${service}${whenLabel ? ` (${whenLabel})` : ''}.`;
  }
  if (title.includes('на месте')) {
    return `${client} сообщил, что на месте. Подтвердите приход, когда будете готовы начать визит.`;
  }
  if (kind === 'new_request') {
    return `${client} отправил заявку на ${service}${whenLabel ? ` на ${whenLabel}` : ''}. Примите или отклоните заявку.`;
  }
  if (title.includes('ждёт решения')) {
    return `Заявка от ${client} на ${service} всё ещё ждёт вашего решения.`;
  }
  if (title.includes('скоро истечёт')) {
    return `Заявка от ${client} скоро истечёт — подтвердите или отклоните её.`;
  }
  if (title.includes('заявка истекла')) {
    return `Заявка от ${client} на ${service} истекла — вы не успели её подтвердить. Слот снова свободен.`;
  }
  if (kind === 'reminder') {
    return `Напоминание о предстоящей записи${whenLabel ? `: ${whenLabel}` : ''}. Проверьте детали визита.`;
  }
  if (kind === 'review') {
    const rating = extractRatingFromBody(item.body);
    const meta = parseBookingNotificationMetadata(item.metadata);
    const reviewRating = meta?.reviewRating ?? rating;
    const namedClient = clientName ?? meta?.clientName?.trim() ?? null;
    const namedService = serviceName ?? meta?.serviceName?.trim() ?? null;
    if (namedClient && namedService && reviewRating) {
      return `${namedClient} оставил отзыв ${reviewRating}★ после визита на «${namedService}».`;
    }
    if (namedClient && reviewRating) {
      return `${namedClient} оставил отзыв ${reviewRating}★ после визита.`;
    }
    return reviewRating
      ? `Клиент оставил отзыв ${reviewRating}★ после визита.`
      : 'Клиент оставил новый отзыв после визита.';
  }
  if (kind === 'cancelled') {
    return item.body.trim() || `Запись на ${service} была отменена.`;
  }
  if (kind === 'success') {
    if (title.includes('топе мастеров') || title.includes('топ мастера')) {
      return 'Ваш профиль в блоке «Топ мастера» — клиенты чаще увидят вас в каталоге.';
    }
    return item.body.trim() || `Событие по записи ${service} успешно завершено.`;
  }

  return formatNotificationPreviewBody(item) || item.body.trim();
}

export function buildMasterNotificationDetailModel(
  item: MeNotificationRow,
  booking?: BookingNotificationViewModel | null,
): MasterNotificationDetailModel {
  const visual = getMasterNotificationVisual(item);
  const summary = parseNotificationSummary(item);
  const contextRows: Array<{ label: string; value: string }> = [...summary];

  if (booking) {
    const appt = booking.appointment;
    const rows: Array<{ label: string; value: string }> = [];
    const client = appt.clientName?.trim();
    if (client) rows.push({ label: 'Клиент', value: client });
    if (appt.serviceTitle) rows.push({ label: 'Услуга', value: appt.serviceTitle });
    if (booking.whenRange) rows.push({ label: 'Дата и время', value: booking.whenRange });
    if (booking.visitFormat) rows.push({ label: 'Формат', value: booking.visitFormat });
    if (booking.visitAddress) rows.push({ label: 'Адрес', value: booking.visitAddress });
    if (appt.voucherNumber) rows.push({ label: 'Номер записи', value: appt.voucherNumber.toUpperCase() });
    if (appt.clientNote?.trim()) rows.push({ label: 'Комментарий', value: appt.clientNote.trim() });
    if (booking.cancelReason) rows.push({ label: 'Причина отмены', value: booking.cancelReason });
    return {
      visual,
      statusBadge: resolveMasterNotificationStatusBadge(item),
      title: item.title,
      createdAtLabel: formatNotificationListTime(item.created_at),
      narrative: buildNarrative(item),
      contextRows: rows,
      highlight: appt.clientNote?.trim() || null,
      rating: extractRatingFromBody(item.body),
      reviewBody: null,
    };
  }

  const rating = extractRatingFromBody(item.body);
  let highlight: string | null = null;
  const title = titleLower(item);
  if (title.includes('комментарий')) {
    const m = item.body.match(/комментарий[^:]*:\s*(.+)$/i);
    highlight = m?.[1]?.trim() ?? null;
  }

  return {
    visual,
    statusBadge: resolveMasterNotificationStatusBadge(item),
    title: item.title,
    createdAtLabel: formatNotificationListTime(item.created_at),
    narrative: buildNarrative(item),
    contextRows,
    highlight,
    rating,
    reviewBody: null,
  };
}

export function countByFilter(
  items: MeNotificationRow[],
  filter: MasterNotificationFilter,
): number {
  if (filter === 'all') return items.length;
  return items.filter((item) => matchesMasterNotificationFilter(item, filter)).length;
}
