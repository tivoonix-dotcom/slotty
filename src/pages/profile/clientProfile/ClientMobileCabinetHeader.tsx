import type { CSSProperties, Ref } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { HUB_PATH, PROFILE_NOTIFICATIONS_PATH } from '../../../app/paths';
import { useIsMasterUser } from '../../../features/profile/hooks/useIsMasterUser';
import { CabinetRoleSwitch } from '../../../shared/layout/CabinetRoleSwitch';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { ADMIN_CABINET_SHELL_MAX } from '../../admin/overview/adminOverviewTheme';
import { NotificationBellLink } from '../../admin/notifications/notificationBellUi';

function IconBurger({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  shellRef?: Ref<HTMLDivElement>;
  menuOpen: boolean;
  onMenuOpen: () => void;
  hasNewNotifications: boolean;
  notificationCount: number;
};

function HeaderActions({
  className = '',
  isNotifications,
  hasNewNotifications,
  notificationCount,
  menuOpen,
  onMenuOpen,
}: {
  className?: string;
  isNotifications: boolean;
  hasNewNotifications: boolean;
  notificationCount: number;
  menuOpen: boolean;
  onMenuOpen: () => void;
}) {
  return (
    <div className={`flex shrink-0 items-center gap-1.5 ${className}`.trim()}>
      <NotificationBellLink
        to={PROFILE_NOTIFICATIONS_PATH}
        isActive={isNotifications}
        hasUnread={hasNewNotifications}
        count={notificationCount}
        variant="mobile"
        ringClass=""
        ariaLabel={
          notificationCount > 0
            ? `Уведомления, ${notificationCount} непрочитанных`
            : hasNewNotifications
              ? 'Уведомления, есть новые'
              : 'Уведомления'
        }
      />
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-[#111827] transition hover:bg-[#EBEBEB] active:scale-[0.97]"
        aria-label="Меню разделов"
        aria-expanded={menuOpen}
      >
        <IconBurger className="h-5 w-5 text-neutral-800" />
      </button>
    </div>
  );
}

export function ClientMobileCabinetHeader({
  shellRef,
  menuOpen,
  onMenuOpen,
  hasNewNotifications,
  notificationCount,
}: Props) {
  const { pathname } = useLocation();
  const isNotifications = pathname === PROFILE_NOTIFICATIONS_PATH;
  const isMasterUser = useIsMasterUser();

  return (
    <div
      ref={shellRef}
      className="sticky top-0 z-40 w-full min-w-0 shrink-0 overflow-x-clip bg-white lg:hidden"
      style={
        {
          '--slotty-client-mobile-header-h': '4.5rem',
        } as CSSProperties
      }
    >
      <div
        className={`mx-auto w-full min-w-0 ${ADMIN_CABINET_SHELL_MAX} px-3 pb-2 pt-[calc(0.375rem+env(safe-area-inset-top,0px))]`}
      >
        <div className="flex min-h-10 w-full min-w-0 items-center gap-2">
          {isMasterUser ? (
            <CabinetRoleSwitch active="client" compact className="min-w-0 max-w-[11.5rem] shrink" />
          ) : (
            <Link
              to={HUB_PATH}
              aria-label="SLOTTY — на главную"
              className="inline-flex h-10 shrink-0 items-center overflow-visible transition hover:opacity-60 active:scale-[0.99]"
            >
              <SlottyImg
                src={HEADER_LOGO_SRC}
                alt=""
                decoding="async"
                fetchPriority="low"
                className="h-10 w-auto max-w-[min(12rem,42vw)] -translate-x-6 object-contain object-left"
              />
            </Link>
          )}
          <HeaderActions
            className="ml-auto"
            isNotifications={isNotifications}
            hasNewNotifications={hasNewNotifications}
            notificationCount={notificationCount}
            menuOpen={menuOpen}
            onMenuOpen={onMenuOpen}
          />
        </div>
      </div>
    </div>
  );
}
