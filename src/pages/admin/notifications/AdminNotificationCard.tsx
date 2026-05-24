import { useCallback } from 'react';
import { HiBellAlert } from 'react-icons/hi2';
import { markNotificationReadApi, type MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import {
  notifAccentIcon,
  notifAccentIconSoft,
  notifBadgeNew,
  notifCardRead,
  notifCardUnread,
  notifMetaAccent,
} from './adminNotificationsTheme';

function notificationAccent(type: string): { soft: boolean; iconClass: string } {
  switch (type) {
    case 'appointment_new':
      return { soft: false, iconClass: '' };
    case 'appointment_cancelled':
      return { soft: true, iconClass: 'bg-[#FFF7ED] text-[#EA580C] ring-[#FED7AA]' };
    case 'appointment_reminder':
      return { soft: true, iconClass: 'bg-[#EFF6FF] text-[#2563EB] ring-[#BFDBFE]' };
    case 'billing':
      return { soft: true, iconClass: 'bg-[#F5F3FF] text-[#7C3AED] ring-[#DDD6FE]' };
    default:
      return { soft: true, iconClass: '' };
  }
}

type Props = {
  item: MeNotificationRow;
  index?: number;
  onAfterRead?: () => void;
};

export function AdminNotificationCard({ item, index = 0, onAfterRead }: Props) {
  const isNew = !item.read_at;
  const accent = notificationAccent(item.type);
  const iconWrap = accent.soft && accent.iconClass
    ? `${notifAccentIconSoft} h-10 w-10 ${accent.iconClass}`
    : isNew
      ? `${notifAccentIcon} h-10 w-10`
      : `${notifAccentIconSoft} h-10 w-10`;

  const onClick = useCallback(() => {
    if (item.read_at) return;
    void (async () => {
      try {
        await markNotificationReadApi(item.id);
        onAfterRead?.();
      } catch {
        /* ignore */
      }
    })();
  }, [item.id, item.read_at, onAfterRead]);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`${isNew ? `${notifCardUnread} pl-5` : notifCardRead} cursor-pointer px-4 py-3.5 transition active:scale-[0.99]`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex gap-3">
        <span className={`mt-0.5 shrink-0 ${iconWrap}`}>
          <HiBellAlert className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-[#111827] lg:text-[16px]">
              {item.title}
            </p>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {isNew ? <span className={notifBadgeNew}>Новое</span> : null}
              <time className={`text-[12px] tabular-nums ${isNew ? notifMetaAccent : 'font-medium text-[#9CA3AF]'}`}>
                {formatNotificationListTime(item.created_at)}
              </time>
            </div>
          </div>
          <p className="mt-1.5 line-clamp-3 text-[14px] leading-snug text-[#6B7280]">{item.body}</p>
        </div>
      </div>
    </article>
  );
}
