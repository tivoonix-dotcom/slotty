import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { HiScissors, HiUserCircle } from 'react-icons/hi2';
import { PROFILE_PATH, SERVICES_PATH } from '../../../app/paths';

const TABS = [
  {
    to: SERVICES_PATH,
    label: 'Услуги',
    Icon: HiScissors,
    match: (pathname: string) => pathname.startsWith(SERVICES_PATH) || /^\/master\/[^/]+/.test(pathname),
  },
  {
    to: PROFILE_PATH,
    label: 'Профиль',
    Icon: HiUserCircle,
    match: (pathname: string) => pathname === PROFILE_PATH || pathname.startsWith(`${PROFILE_PATH}/`),
  },
] as const;

export function ClientBottomNav() {
  const { pathname } = useLocation();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <nav
      className="fixed inset-x-0 bottom-0 z-50 box-border grid w-full min-w-full grid-cols-2 overflow-hidden border-t border-[#E8E8E8] bg-white pb-[env(safe-area-inset-bottom,0px)] pt-1 shadow-[0_-6px_20px_rgba(17,24,39,0.06)] lg:hidden"
      style={{ minHeight: '3.5rem' }}
      aria-label="Клиентский каталог"
    >
      {TABS.map(({ to, label, Icon, match }) => {
        const active = match(pathname);

        return (
          <NavLink
            key={to}
            to={to}
            className={`relative flex min-h-[3.25rem] w-full min-w-0 flex-col items-center justify-center gap-1 transition-colors duration-200 active:opacity-90 ${
              active
                ? 'bg-[#F47C8C] text-white'
                : 'bg-white text-[#9CA3AF] hover:bg-[#FAFAFA] hover:text-[#6B7280]'
            }`}
          >
            <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
            <span className="max-w-full truncate text-[10px] font-bold leading-none sm:text-[11px]">
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>,
    document.body,
  );
}
