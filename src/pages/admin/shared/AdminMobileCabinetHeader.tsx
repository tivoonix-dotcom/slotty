import type { CSSProperties, RefObject } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { ADMIN_NOTIFICATIONS_PATH, HUB_PATH } from '../../../app/paths';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { IconNavNotifications } from '../adminCabinetNav';
import { ADMIN_CABINET_SHELL_MAX } from '../overview/adminOverviewTheme';
import { ProfileCompletionHeaderCard } from '../profile/ProfileCompletionHeaderCard';
import { NotificationBellBadge, notificationBellLinkClass } from '../notifications/notificationBellUi';
import { useAdminNotifications } from '../notifications/AdminNotificationsContext';

function IconBurger({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  shellRef?: RefObject<HTMLDivElement>;
  menuOpen: boolean;
  onMenuOpen: () => void;
  menuLabel?: string;
};

export function AdminMobileCabinetHeader({
  shellRef,
  menuOpen,
  onMenuOpen,
  menuLabel = 'Меню разделов',
}: Props) {
  const { pathname } = useLocation();
  const isNotifications = pathname === ADMIN_NOTIFICATIONS_PATH;
  const { hasAttention, bellCount } = useAdminNotifications();

  return (
    <div
      ref={shellRef}
      className="sticky top-0 z-40 w-full min-w-0 bg-white lg:hidden"
      style={
        {
          '--slotty-admin-header-h': '5.25rem',
        } as CSSProperties
      }
    >
      <div
        className={`mx-auto flex w-full min-w-0 ${ADMIN_CABINET_SHELL_MAX} items-center justify-between gap-3 px-4 pb-1 pt-[calc(0.25rem+env(safe-area-inset-top,0px))]`}
      >
        <Link
          to={HUB_PATH}
          aria-label="SLOTTY — на главную"
          className="inline-flex h-20 min-h-20 shrink-0 items-center overflow-visible outline-none ring-0 transition hover:opacity-60 active:scale-[0.99] sm:h-[5.5rem] sm:min-h-[5.5rem]"
        >
          <SlottyImg
            src={HEADER_LOGO_SRC}
            alt=""
            decoding="async"
            fetchPriority="low"
            className="h-20 w-auto max-w-[min(20rem,70vw)] -translate-x-10 translate-y-[5px] object-contain object-left sm:h-[5.5rem] sm:max-w-[22rem] sm:-translate-x-12 sm:translate-y-[7px]"
          />
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ProfileCompletionHeaderCard variant="header" className="hidden min-[380px]:flex" />
          <Link
            to={ADMIN_NOTIFICATIONS_PATH}
            className={notificationBellLinkClass(isNotifications, hasAttention, 'mobile')}
            aria-label={
              bellCount > 0
                ? `Уведомления, ${bellCount} непрочитанных`
                : hasAttention
                  ? 'Уведомления, есть задачи'
                  : 'Уведомления'
            }
          >
            <IconNavNotifications />
            <NotificationBellBadge count={bellCount} />
          </Link>
          <button
            type="button"
            onClick={onMenuOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3F4F6] text-[#111827] transition hover:bg-[#E4E7EC] active:scale-[0.97]"
            aria-label={menuLabel}
            aria-expanded={menuOpen}
          >
            <IconBurger className="text-neutral-800" />
          </button>
        </div>
      </div>
      <div className={`mx-auto w-full min-w-0 px-4 pb-2 min-[380px]:hidden ${ADMIN_CABINET_SHELL_MAX}`}>
        <ProfileCompletionHeaderCard variant="header" className="max-w-none w-full" />
      </div>
      <div className="w-full border-b-2 border-[#F47C8C]" aria-hidden />
    </div>
  );
}
