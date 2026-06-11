import type { MasterNotificationStats } from './masterNotificationModel';

export type NotificationsSummaryCopy = {
  title: string;
  subtitle: string;
};

export function notificationsSummaryCopy(stats: MasterNotificationStats): NotificationsSummaryCopy {
  if (stats.actionRequired > 0) {
    const count = stats.actionRequired;
    return {
      title: count === 1 ? '1 уведомление требует ответа' : `${count} уведомлений требуют ответа`,
      subtitle: 'Подтвердите заявку, ответьте на отзыв или выполните другое действие',
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
    subtitle: 'Все события по записям, клиентам и напоминаниям',
  };
}
