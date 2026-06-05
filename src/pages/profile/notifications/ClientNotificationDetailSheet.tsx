import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import { formatNotificationPreviewBody } from '../../../features/notifications/formatNotificationPreview';
import {
  parseNotificationSummary,
  shouldHideNotificationBody,
} from '../../../features/notifications/parseNotificationSummary';
import { resolveClientNotificationAction } from '../../../features/notifications/clientNotificationAction';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { AdminBottomSheet } from '../../admin/shared/AdminBottomSheet';
import { NotificationDetailFooterActions } from '../../admin/notifications/NotificationDetailFooterActions';

function notificationTypeLabel(type: string): string {
  switch (type) {
    case 'appointment_pending':
      return 'Заявка';
    case 'appointment_confirmed':
      return 'Подтверждение';
    case 'appointment_cancelled':
      return 'Отмена';
    case 'appointment_reminder':
      return 'Напоминание';
    case 'review_request':
      return 'Отзыв';
    default:
      return 'Уведомление';
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#EEEEEE] py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">
        {value}
      </span>
    </div>
  );
}

type Props = {
  item: MeNotificationRow | null;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
};

export function ClientNotificationDetailSheet({ item, onClose, onMarkRead }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!item?.id || item.read_at) return;
    onMarkRead?.(item.id);
  }, [item, onMarkRead]);

  const action = useMemo(() => (item ? resolveClientNotificationAction(item) : null), [item]);
  const summary = useMemo(() => (item ? parseNotificationSummary(item) : []), [item]);
  const preview = useMemo(() => (item ? formatNotificationPreviewBody(item) : ''), [item]);
  const hideBody = item ? shouldHideNotificationBody(item, summary) : false;
  const isNew = item ? !item.read_at : false;

  const goToAction = () => {
    if (!action) return;
    onClose();
    navigate(action.to);
  };

  return (
    <AdminBottomSheet
      open={Boolean(item)}
      onClose={onClose}
      variant="catalog"
      badge={isNew ? 'Новое' : undefined}
      title={item?.title ?? 'Уведомление'}
      subtitle={
        item
          ? `${notificationTypeLabel(item.type)} · ${formatNotificationListTime(item.created_at)}`
          : undefined
      }
      footer={
        <NotificationDetailFooterActions
          actions={
            action
              ? [
                  { id: 'open', label: action.label, variant: 'primary' },
                  { id: 'close', label: 'Закрыть', variant: 'secondary' },
                ]
              : [{ id: 'ack', label: 'Понятно', variant: 'primary' }]
          }
          onAction={(id) => {
            if (id === 'close' || id === 'ack') onClose();
            else goToAction();
          }}
        />
      }
    >
      {item ? (
        <div className="space-y-4">
          {summary.length > 0 ? (
            <div className="rounded-[10px] bg-white px-4 ring-1 ring-[#EEEEEE]">
              {summary.map((row) => (
                <SummaryRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          ) : null}

          {!hideBody ? (
            <div className="rounded-[10px] bg-[#F5F5F5] px-4 py-3.5">
              <p className="text-[15px] leading-relaxed text-[#374151]">{preview}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminBottomSheet>
  );
}
