import { env } from '../../config/env.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import { logNotification } from '../notifications/notificationLog.js';
import { insertUserNotification } from '../notifications/notificationsInsert.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { listPlatformAdminProfileIds } from '../notifications/platformAdmins.js';
import type { SupportSeverity, SupportTicketStatus } from './supportTicket.types.js';

const ADMIN_SUPPORT_PATH = '/platform-admin/support';
const MASTER_TICKET_PATH = '/master/settings/support/tickets';

function adminTicketUrl(ticketCode: string): string {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  return `${base}${ADMIN_SUPPORT_PATH}?ticket=${encodeURIComponent(ticketCode)}`;
}

function masterTicketUrl(ticketCode: string): string {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  return `${base}${MASTER_TICKET_PATH}/${encodeURIComponent(ticketCode)}`;
}

function isHighSeverity(severity: string): boolean {
  return severity === 'high' || severity === 'critical';
}

async function notifyPlatformAdminsInApp(params: {
  adminIds: string[];
  title: string;
  body: string;
  ticketId: string;
  ticketCode: string;
}): Promise<void> {
  await Promise.all(
    params.adminIds.map((adminId) =>
      insertUserNotification({
        userId: adminId,
        type: 'system',
        title: params.title,
        body: params.body,
        audience: 'master',
        relatedEntityType: 'support_ticket',
        relatedEntityId: params.ticketCode,
      }).catch(() => undefined),
    ),
  );
}

export async function notifyAdminsSupportTicketCreated(params: {
  ticketId: string;
  ticketCode: string;
  subject: string;
  severity: SupportSeverity;
  category: string;
  userId: string;
}): Promise<void> {
  const adminIds = await listPlatformAdminProfileIds();
  const urgent = isHighSeverity(params.severity);
  const title = urgent
    ? `Срочное обращение ${params.ticketCode}`
    : `Новое обращение ${params.ticketCode}`;
  const body = [
    params.subject,
    `Категория: ${params.category}`,
    `Срочность: ${params.severity}`,
    `Открыть: ${adminTicketUrl(params.ticketCode)}`,
  ].join('\n');

  await notifyPlatformAdminsInApp({
    adminIds,
    title,
    body,
    ticketId: params.ticketId,
    ticketCode: params.ticketCode,
  });

  logNotification('support.ticket.created', {
    ticketCode: params.ticketCode,
    severity: params.severity,
    category: params.category,
    adminCount: adminIds.length,
  });

  await writeAdminAuditLog({
    adminUserId: params.userId,
    action: 'support_ticket_created',
    entityType: 'support_ticket',
    entityId: params.ticketId,
    targetUserId: params.userId,
    metadata: {
      ticketCode: params.ticketCode,
      severity: params.severity,
      category: params.category,
    },
  }).catch(() => undefined);
}

export async function notifyAdminsSupportUserReply(params: {
  ticketId: string;
  ticketCode: string;
  subject: string;
  assignedTo: string | null;
  messagePreview: string;
}): Promise<void> {
  const adminIds = params.assignedTo
    ? [params.assignedTo]
    : await listPlatformAdminProfileIds();
  if (adminIds.length === 0) return;

  const title = `Ответ в обращении ${params.ticketCode}`;
  const body = [
    params.subject,
    params.messagePreview.slice(0, 400),
    `Открыть: ${adminTicketUrl(params.ticketCode)}`,
  ].join('\n');

  await notifyPlatformAdminsInApp({
    adminIds,
    title,
    body,
    ticketId: params.ticketId,
    ticketCode: params.ticketCode,
  });

  logNotification('support.ticket.user_reply', {
    ticketCode: params.ticketCode,
    adminCount: adminIds.length,
  });
}

export async function notifyMasterSupportAdminReply(params: {
  userId: string;
  ticketId: string;
  ticketCode: string;
  subject: string;
  messagePreview: string;
}): Promise<void> {
  const title = `Ответ поддержки: ${params.ticketCode}`;
  const body = [
    params.subject,
    params.messagePreview.slice(0, 500),
    `Открыть: ${masterTicketUrl(params.ticketCode)}`,
  ].join('\n');

  await notifyUser({
    userId: params.userId,
    type: 'system',
    audience: 'master',
    title,
    body,
    relatedEntityType: 'support_ticket',
    relatedEntityId: params.ticketCode,
    telegramHtml: `<b>${title}</b>\n${params.messagePreview.slice(0, 300)}`,
  }).catch(() => undefined);

  logNotification('support.ticket.admin_reply', { ticketCode: params.ticketCode });
}

export async function notifyMasterSupportStatusChanged(params: {
  userId: string;
  ticketId: string;
  ticketCode: string;
  subject: string;
  status: SupportTicketStatus;
}): Promise<void> {
  if (!['RESOLVED', 'WAITING_USER', 'CLOSED'].includes(params.status)) return;

  const statusLabels: Record<string, string> = {
    RESOLVED: 'решено',
    WAITING_USER: 'ожидает вашего ответа',
    CLOSED: 'закрыто',
  };
  const title = `Обращение ${params.ticketCode}: ${statusLabels[params.status] ?? params.status}`;
  const body = [
    params.subject,
    `Статус: ${params.status}`,
    `Открыть: ${masterTicketUrl(params.ticketCode)}`,
  ].join('\n');

  await notifyUser({
    userId: params.userId,
    type: 'system',
    audience: 'master',
    title,
    body,
    relatedEntityType: 'support_ticket',
    relatedEntityId: params.ticketCode,
    telegramHtml: `<b>${title}</b>\n${params.subject}`,
  }).catch(() => undefined);

  logNotification('support.ticket.status_changed', {
    ticketCode: params.ticketCode,
    status: params.status,
  });
}
