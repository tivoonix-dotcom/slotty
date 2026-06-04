import { env } from '../../config/env.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import { insertUserNotification } from '../notifications/notificationsInsert.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { listPlatformAdminProfileIds } from '../notifications/platformAdmins.js';

const ADMIN_DELETION_PATH = '/platform-admin/requests?kind=account-deletion';

function adminDeletionUrl(): string {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  return `${base}${ADMIN_DELETION_PATH}`;
}

export async function notifyAdminsAccountDeletionRequested(params: {
  requestId: string;
  userId: string;
  userFullName: string;
}): Promise<void> {
  const adminIds = await listPlatformAdminProfileIds();
  const title = 'Запрос на удаление аккаунта';
  const body = [
    params.userFullName,
    `User ID: ${params.userId}`,
    `Открыть: ${adminDeletionUrl()}`,
  ].join('\n');

  await Promise.all(
    adminIds.map((adminId) =>
      insertUserNotification({
        userId: adminId,
        type: 'system',
        title,
        body,
        relatedEntityType: 'account_deletion_request',
        relatedEntityId: params.requestId,
      }).catch(() => undefined),
    ),
  );

  await writeAdminAuditLog({
    adminUserId: params.userId,
    action: 'account_deletion_requested',
    entityType: 'account_deletion_request',
    entityId: params.requestId,
    targetUserId: params.userId,
    metadata: { userFullName: params.userFullName },
  }).catch(() => undefined);
}

export async function notifyUserDeletionProcessed(params: {
  userId: string;
  approved: boolean;
  adminNote: string | null;
}): Promise<void> {
  const title = params.approved
    ? 'Аккаунт удалён'
    : 'Запрос на удаление отклонён';
  const body = params.approved
    ? 'Ваш аккаунт SLOTTY удалён. Вход и использование сервиса больше недоступны.'
    : [
        'Администратор отклонил запрос на удаление аккаунта.',
        params.adminNote?.trim() ? `Комментарий: ${params.adminNote.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n');

  await notifyUser({
    userId: params.userId,
    type: 'system',
    title,
    body,
    relatedEntityType: 'account_deletion_request',
    relatedEntityId: params.userId,
  }).catch(() => undefined);
}
