import { useLayoutEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ADMIN_NOTIFICATIONS_PATH, ADMIN_SETTINGS_PATH } from '../../app/paths';
import { useAdminNotifications } from './notifications/AdminNotificationsContext';
import { ADMIN_PAGE_TITLES, IconNavNotifications } from './adminCabinetNav';
import { ProfileCompletionHeaderCard } from './profile/ProfileCompletionHeaderCard';

export function AdminDesktopTopBar() {
  const headerRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { hasUnread, unreadCount } = useAdminNotifications();
  const title = pathname.startsWith(ADMIN_SETTINGS_PATH)
    ? 'Настройки'
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
          <p className="mt-0.5 text-[13px] text-[#6B7280]">SLOTTY · кабинет мастера</p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <ProfileCompletionHeaderCard variant="header" className="max-w-[14rem]" />

          <Link
            to={ADMIN_NOTIFICATIONS_PATH}
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
              isNotifications
                ? 'bg-[#FFF1F4] text-[#ff5f7a] ring-1 ring-[#FDE8ED]'
                : 'bg-white text-[#374151] ring-1 ring-[#EAECEF] hover:bg-[#FAFAFA]'
            }`}
            aria-label={hasUnread ? `Уведомления, ${unreadCount} новых` : 'Уведомления'}
          >
            <IconNavNotifications />
            {hasUnread ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff5f7a] px-1 text-[10px] font-bold text-white ring-2 ring-[#F5F6FA]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
