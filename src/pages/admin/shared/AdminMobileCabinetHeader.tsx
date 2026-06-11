import type { CSSProperties, RefObject } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { ADMIN_NOTIFICATIONS_PATH, HUB_PATH } from '../../../app/paths';
import { useIsMasterUser } from '../../../features/profile/hooks/useIsMasterUser';
import { CabinetRoleSwitch } from '../../../shared/layout/CabinetRoleSwitch';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { ADMIN_CABINET_SHELL_MAX } from '../overview/adminOverviewTheme';
import { ProfileCompletionHeaderCard } from '../profile/ProfileCompletionHeaderCard';
import { NotificationBellLink } from '../notifications/notificationBellUi';
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
  const isMasterUser = useIsMasterUser();
  return (
    <div
      ref={shellRef}
      className="sticky top-0 z-40 w-full min-w-0 bg-white lg:hidden"
      style={
        {
          '--slotty-admin-header-h': '4.5rem',
        } as CSSProperties
      }
    >
      <div
        className={`mx-auto w-full min-w-0 ${ADMIN_CABINET_SHELL_MAX} px-3 pb-2 pt-[calc(0.375rem+env(safe-area-inset-top,0px))]`}
      >
        {isMasterUser ? (
          <div className="flex min-h-10 w-full min-w-0 items-center gap-2">
            <Link
              to={HUB_PATH}
              aria-label="SLOTTY — на главную"
              className="inline-flex h-10 w-12 shrink-0 items-center overflow-visible transition hover:opacity-60 active:scale-[0.99]"
            >
              <SlottyImg
                src={HEADER_LOGO_SRC}
                alt=""
                decoding="async"
                fetchPriority="low"
                className="h-10 w-auto max-w-none -translate-x-4 object-contain object-left"
              />
            </Link>
            <CabinetRoleSwitch active="master" compact className="min-w-0 max-w-[11rem] flex-1" />
            <ProfileCompletionHeaderCard variant="header" className="hidden min-[360px]:inline-flex shrink-0" />
            <NotificationBellLink
              to={ADMIN_NOTIFICATIONS_PATH}
              isActive={isNotifications}
              hasUnread={hasAttention}
              count={bellCount}
              variant="mobile"
              ringClass=""
              ariaLabel={
                bellCount > 0
                  ? `Уведомления, ${bellCount} непрочитанных`
                  : hasAttention
                    ? 'Уведомления, есть задачи'
                    : 'Уведомления'
              }
            />
            <button
              type="button"
              onClick={onMenuOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-[#111827] transition hover:bg-[#EBEBEB] active:scale-[0.97]"
              aria-label={menuLabel}
              aria-expanded={menuOpen}
            >
              <IconBurger className="h-5 w-5 text-neutral-800" />
            </button>
          </div>
        ) : (
          <div className="flex min-h-10 w-full min-w-0 items-center justify-between gap-2">
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
            <div className="flex shrink-0 items-center gap-1.5">
              <ProfileCompletionHeaderCard variant="header" className="shrink-0" />
              <NotificationBellLink
                to={ADMIN_NOTIFICATIONS_PATH}
                isActive={isNotifications}
                hasUnread={hasAttention}
                count={bellCount}
                variant="mobile"
                ringClass=""
                ariaLabel={
                  bellCount > 0
                    ? `Уведомления, ${bellCount} непрочитанных`
                    : hasAttention
                      ? 'Уведомления, есть задачи'
                      : 'Уведомления'
                }
              />
              <button
                type="button"
                onClick={onMenuOpen}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-[#111827] transition hover:bg-[#EBEBEB] active:scale-[0.97]"
                aria-label={menuLabel}
                aria-expanded={menuOpen}
              >
                <IconBurger className="h-5 w-5 text-neutral-800" />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className={`mx-auto w-full min-w-0 px-3 pb-2 min-[360px]:hidden ${ADMIN_CABINET_SHELL_MAX}`}>
        <ProfileCompletionHeaderCard variant="header" className="w-full max-w-none" />
      </div>
    </div>
  );
}
