import { useLayoutEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ADMIN_NOTIFICATIONS_PATH, MASTER_SETTINGS_PATH } from '../../app/paths';
import { useAdminNotifications } from './notifications/AdminNotificationsContext';
import { NotificationBellBadge, notificationBellLinkClass } from './notifications/notificationBellUi';
import { ADMIN_PAGE_TITLES, IconNavNotifications, resolveAdminSectionMeta } from './adminCabinetNav';
import { ProfileCompletionHeaderCard } from './profile/ProfileCompletionHeaderCard';
export function AdminDesktopTopBar() {
  const headerRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { hasUnread, unreadCount } = useAdminNotifications();
  const title = pathname.startsWith(MASTER_SETTINGS_PATH)
    ? (resolveAdminSectionMeta(pathname)?.title ?? 'Настройки')
    : (ADMIN_PAGE_TITLES[pathname] ?? 'Кабинет мастера');
  const isNotifications = pathname === ADMIN_NOTIFICATIONS_PATH;

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncTopbarHeight = () => {
      document.documentElement.style.setProperty(
        '--slotty-admin-desktop-topbar-h',
        `${el.offsetHeight}px`,
      );
    };

    syncTopbarHeight();
    const ro = new ResizeObserver(syncTopbarHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 hidden shrink-0 border-b border-[#EAECEF] bg-white px-8 py-4 lg:block"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.04em] text-[#111827]">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <ProfileCompletionHeaderCard variant="header" className="max-w-[14rem]" />

          <Link
            to={ADMIN_NOTIFICATIONS_PATH}
            className={notificationBellLinkClass(isNotifications, hasUnread, 'desktop')}
            aria-label={hasUnread ? `Уведомления, ${unreadCount} новых` : 'Уведомления'}
          >
            <IconNavNotifications />
            <NotificationBellBadge count={unreadCount} ringClass="ring-[#F5F6FA]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
