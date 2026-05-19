import { insertUserNotification, type NotificationType } from './notificationsInsert.js';
import { sendNotificationToProfile } from '../telegram/telegramProfileNotifications.js';
import type { SendTelegramMessageResult } from '../telegram/telegram.service.js';

export type NotifyUserParams = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  /** HTML для Telegram; если не задан — Telegram не отправляется. */
  telegramHtml?: string;
};

function logTelegramIssue(context: string, res: SendTelegramMessageResult): void {
  if (res.status === 'error') {
    console.warn(`[notify] ${context} telegram:`, res.message);
  }
}

/** In-app уведомление + опционально сообщение в Telegram. */
export async function notifyUser(params: NotifyUserParams): Promise<void> {
  await insertUserNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId,
  });

  if (!params.telegramHtml?.trim()) return;

  try {
    const res = await sendNotificationToProfile(params.userId, params.telegramHtml);
    logTelegramIssue(`${params.type} user=${params.userId}`, res);
  } catch (e) {
    console.warn(
      `[notify] ${params.type} telegram failed:`,
      e instanceof Error ? e.message : e,
    );
  }
}
