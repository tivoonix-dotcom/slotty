import type { NotificationType } from './notificationsInsert.js';

export type NotificationAudience = 'master' | 'client';

export type NotificationLike = {
  type: string;
  title: string;
  body: string;
};

const CLIENT_ONLY_TYPES = new Set<NotificationType>(['review_request']);

/** appointment_confirmed — и у клиента, и у мастера; различаем по заголовку. */
const CLIENT_CONFIRMED_TITLES = new Set([
  'Запись подтверждена',
  'Подтвердите выполнение услуги',
]);

const MASTER_CONFIRMED_TITLES = new Set([
  'Запись завершена',
  'Клиент подтвердил выполнение',
]);

const MASTER_ONLY_TYPES = new Set<NotificationType>(['appointment_new', 'billing']);

/** appointment_pending у клиента — только «Заявка отправлена»; остальные заголовки — мастерские напоминания. */
const CLIENT_PENDING_TITLES = new Set(['Заявка отправлена']);

const MASTER_PENDING_TITLES = new Set(['Заявка ждёт решения', 'Заявка скоро истечёт']);

const MASTER_CANCELLED_TITLES = new Set(['Клиент отменил запись']);

function isMasterExpiredBooking(row: NotificationLike): boolean {
  if (row.title.trim() !== 'Заявка истекла') return false;
  const body = row.body.trim();
  return body.includes('Вы не успели подтвердить') || body.startsWith('Заявка истекла:');
}

function isMasterReminder(row: NotificationLike): boolean {
  if (row.body.includes('Клиент должен быть у вас')) return true;
  if (row.title.includes('у вас')) return true;
  return false;
}

function isMasterSystemNotification(row: NotificationLike): boolean {
  const title = row.title.trim();
  if (title === 'Новый отзыв') return true;
  if (title === 'Вы в топе мастеров') return true;
  if (title === 'Архив данных готов') return true;
  if (title === 'Клиент сообщил о проблеме') return true;
  if (title === 'Запрос на удаление аккаунта') return true;
  if (title.startsWith('Категория профиля')) return true;
  if (title.startsWith('Заявка на смену категории')) return true;
  if (title.startsWith('Ответ поддержки:')) return true;
  if (title.startsWith('Обращение ')) return true;
  if (/тариф|Pro|оплат/i.test(title)) return true;
  return false;
}

export function resolveNotificationAudience(row: NotificationLike): NotificationAudience {
  const type = row.type as NotificationType;
  if (type === 'appointment_confirmed') {
    const title = row.title.trim();
    if (MASTER_CONFIRMED_TITLES.has(title)) return 'master';
    if (CLIENT_CONFIRMED_TITLES.has(title)) return 'client';
    if (row.body.trim().startsWith('Клиент:')) return 'master';
    return 'client';
  }
  if (type === 'appointment_pending') {
    const title = row.title.trim();
    if (MASTER_PENDING_TITLES.has(title)) return 'master';
    if (CLIENT_PENDING_TITLES.has(title)) return 'client';
    return 'client';
  }
  if (CLIENT_ONLY_TYPES.has(type)) return 'client';
  if (MASTER_ONLY_TYPES.has(type)) return 'master';
  if (type === 'appointment_cancelled') {
    if (MASTER_CANCELLED_TITLES.has(row.title.trim())) return 'master';
    if (isMasterExpiredBooking(row)) return 'master';
    return 'client';
  }
  if (type === 'appointment_reminder') {
    return isMasterReminder(row) ? 'master' : 'client';
  }
  if (type === 'system') {
    return isMasterSystemNotification(row) ? 'master' : 'client';
  }
  return 'client';
}

export function filterNotificationsForAudience<T extends NotificationLike>(
  rows: T[],
  audience: NotificationAudience,
): T[] {
  return rows.filter((row) => resolveNotificationAudience(row) === audience);
}
