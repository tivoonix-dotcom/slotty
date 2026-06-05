import { useMemo, type MouseEvent } from 'react';
import { HiBellAlert } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import { formatNotificationPreviewBody } from '../../../features/notifications/formatNotificationPreview';
import { resolveClientNotificationAction } from '../../../features/notifications/clientNotificationAction';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import {
  clientNotificationsBadgeNew,
  clientNotificationsCardBody,
  clientNotificationsCardContent,
  clientNotificationsCardInteractive,
  clientNotificationsIconStrip,
  clientNotificationsIconStripRead,
  clientNotificationsIconStripUnread,
  clientNotificationsIconWrap,
  clientNotificationsMetaAccent,
} from './clientNotificationsTheme';

function notificationIconClass(type: string): string {
  switch (type) {
    case 'appointment_cancelled':
      return 'bg-[#FFF7ED] text-[#EA580C] ring-[#FED7AA]';
    case 'appointment_reminder':
      return 'bg-[#EFF6FF] text-[#2563EB] ring-[#BFDBFE]';
    case 'review_request':
      return 'bg-[#F5F3FF] text-[#7C3AED] ring-[#DDD6FE]';
    case 'appointment_pending':
    case 'appointment_new':
      return 'bg-[#FFF1F4] text-[#F47C8C] ring-[#FDE8ED]';
    case 'appointment_confirmed':
      return 'bg-[#ECFDF5] text-[#15803D] ring-[#BBF7D0]';
    default:
      return '';
  }
}

type Props = {
  item: MeNotificationRow;
  index?: number;
  onOpen: (item: MeNotificationRow) => void;
  onMarkRead?: (id: string) => void;
};

export function ClientNotificationCard({ item, index = 0, onOpen, onMarkRead }: Props) {
  const navigate = useNavigate();
  const action = useMemo(() => resolveClientNotificationAction(item), [item]);
  const preview = useMemo(() => formatNotificationPreviewBody(item), [item]);
  const isNew = !item.read_at;
  const typeIconClass = notificationIconClass(item.type);
  const iconWrap = typeIconClass
    ? `${clientNotificationsIconWrap} ${typeIconClass}`
    : clientNotificationsIconWrap;

  const openDetail = () => {
    if (!item.read_at) onMarkRead?.(item.id);
    if (action) {
      navigate(action.to);
      return;
    }
    onOpen(item);
  };

  const openAction = (e: MouseEvent) => {
    e.stopPropagation();
    if (!action) return;
    if (!item.read_at) onMarkRead?.(item.id);
    navigate(action.to);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      }}
      className={clientNotificationsCardInteractive}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className={clientNotificationsCardBody}>
        <div className={`${clientNotificationsIconStrip} ${isNew ? clientNotificationsIconStripUnread : clientNotificationsIconStripRead}`}>
          <span className={iconWrap}>
            <HiBellAlert className="h-5 w-5" aria-hidden />
          </span>
        </div>

        <div className={clientNotificationsCardContent}>
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-[#111827] lg:text-[16px]">
              {item.title}
            </p>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {isNew ? <span className={clientNotificationsBadgeNew}>Новое</span> : null}
              <time
                className={`text-[12px] tabular-nums ${isNew ? clientNotificationsMetaAccent : 'font-medium text-[#9CA3AF]'}`}
              >
                {formatNotificationListTime(item.created_at)}
              </time>
            </div>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-[#6B7280]">{preview}</p>
          {action ? (
            <button
              type="button"
              onClick={openAction}
              className="mt-2.5 inline-flex text-[13px] font-bold text-[#F47C8C] transition hover:text-[#e86b7c]"
            >
              {action.label} →
            </button>
          ) : (
            <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">Подробнее</p>
          )}
        </div>
      </div>
    </article>
  );
}
