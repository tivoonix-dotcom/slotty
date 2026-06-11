import type { CSSProperties, Ref } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { PROFILE_NOTIFICATIONS_PATH, SERVICES_PATH } from '../../../app/paths';
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
  isNotifications,
  hasNewNotifications,
  notificationCount,
  menuOpen,
  onMenuOpen,
}: {
  isNotifications: boolean;
  hasNewNotifications: boolean;
  notificationCount: number;
  menuOpen: boolean;
  onMenuOpen: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
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

function HeaderLogo({ compact }: { compact?: boolean }) {
  return (
    <Link
      to={SERVICES_PATH}
      aria-label="SLOTTY — каталог услуг"
      className={`inline-flex shrink-0 items-center overflow-visible transition hover:opacity-60 active:scale-[0.99] ${
        compact ? 'h-10 w-12' : 'h-10'
      }`}
    >
      <SlottyImg
        src={HEADER_LOGO_SRC}
        alt=""
        decoding="async"
        fetchPriority="low"
        className={
          compact
            ? 'h-10 w-auto max-w-none -translate-x-4 object-contain object-left'
            : 'h-10 w-auto max-w-[min(12rem,42vw)] -translate-x-6 object-contain object-left'
        }
      />
    </Link>
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
        {isMasterUser ? (
          <div className="flex min-h-10 w-full min-w-0 items-center gap-2">
            <HeaderLogo compact />
            <CabinetRoleSwitch active="client" compact className="min-w-0 max-w-[11rem] flex-1" />
            <HeaderActions
              isNotifications={isNotifications}
              hasNewNotifications={hasNewNotifications}
              notificationCount={notificationCount}
              menuOpen={menuOpen}
              onMenuOpen={onMenuOpen}
            />
          </div>
        ) : (
          <div className="flex w-full min-w-0 items-center justify-between gap-2">
            <HeaderLogo />
            <HeaderActions
              isNotifications={isNotifications}
              hasNewNotifications={hasNewNotifications}
              notificationCount={notificationCount}
              menuOpen={menuOpen}
              onMenuOpen={onMenuOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
}
