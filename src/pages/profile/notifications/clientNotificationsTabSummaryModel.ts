import type { ClientNotificationStats } from './clientNotificationModel';

export type ClientNotificationsSummaryCopy = {
  title: string;
  subtitle: string;
};

export function clientNotificationsSummaryCopy(
  stats: ClientNotificationStats,
): ClientNotificationsSummaryCopy {
  if (stats.actionRequired > 0) {
    const count = stats.actionRequired;
    return {
      title: count === 1 ? '1 уведомление требует действия' : `${count} уведомлений требуют действия`,
      subtitle: 'Оставьте отзыв или откройте запись, чтобы ничего не пропустить',
    };
  }

  if (stats.unread > 0) {
    const count = stats.unread;
    return {
      title: count === 1 ? '1 непрочитанное уведомление' : `${count} непрочитанных уведомлений`,
      subtitle: 'Откройте карточку, чтобы посмотреть детали',
    };
  }

  return {
    title: 'Уведомления',
    subtitle: 'Все события по вашим записям и напоминаниям',
  };
}
