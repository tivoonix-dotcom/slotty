import { Link } from 'react-router-dom';
import { HiBellAlert } from 'react-icons/hi2';
import { ADMIN_NOTIFICATIONS_PATH } from '../../../app/paths';
import { useAdminNotifications } from './AdminNotificationsContext';

export function AdminNotificationsBanner() {
  const { hasUnread, unreadCount, notifications } = useAdminNotifications();
  if (!hasUnread) return null;

  const latest = notifications.find((n) => !n.read_at) ?? notifications[0];
  if (!latest) return null;

  return (
    <Link
      to={ADMIN_NOTIFICATIONS_PATH}
      className="mb-4 flex items-start gap-3 rounded-[22px] border border-[#FDE8ED] bg-gradient-to-r from-[#FFF9FB] to-[#FFF1F4] px-4 py-3.5 shadow-[0_8px_28px_rgba(255,95,122,0.1)] transition active:scale-[0.99] hover:border-[#F9A8B4]"
    >
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_6px_16px_rgba(255,95,122,0.28)]">
        <HiBellAlert className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold text-[#111827]">
            {unreadCount === 1 ? 'Новое уведомление' : `${unreadCount} новых уведомления`}
          </span>
          <span className="shrink-0 text-[13px] font-bold text-[#ff5f7a]">Открыть →</span>
        </span>
        <span className="mt-1 block truncate text-[14px] text-[#6B7280]">{latest.title}</span>
      </span>
    </Link>
  );
}
