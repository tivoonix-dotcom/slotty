import { Link } from 'react-router-dom';
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
      className="mb-4 flex items-start gap-3 rounded-[22px] bg-[#FFF1F4] px-4 py-3.5 ring-1 ring-[#F47C8C]/25 transition active:scale-[0.99]"
    >
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#F47C8C]">
        <span className="relative">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#F47C8C] ring-2 ring-white" aria-hidden />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-[#111827]">
            {unreadCount === 1 ? 'Новое уведомление' : `${unreadCount} новых уведомления`}
          </span>
          <span className="shrink-0 text-[13px] font-semibold text-[#F47C8C]">Открыть →</span>
        </span>
        <span className="mt-1 block truncate text-[14px] text-[#6B7280]">{latest.title}</span>
      </span>
    </Link>
  );
}
