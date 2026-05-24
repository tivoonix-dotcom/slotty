import { NavLink, useLocation } from 'react-router-dom';
import { HiScissors, HiUserCircle, HiUserGroup } from 'react-icons/hi2';
import { MASTERS_PATH, PROFILE_PATH, SERVICES_PATH } from '../../../app/paths';

const TABS = [
  { to: SERVICES_PATH, label: 'Услуги', Icon: HiScissors, match: (pathname: string) => pathname.startsWith(SERVICES_PATH) },
  { to: MASTERS_PATH, label: 'Мастера', Icon: HiUserGroup, match: (pathname: string) => pathname === MASTERS_PATH || pathname.startsWith(`${MASTERS_PATH}/`) },
  { to: PROFILE_PATH, label: 'Профиль', Icon: HiUserCircle, match: (pathname: string) => pathname === PROFILE_PATH || pathname.startsWith(`${PROFILE_PATH}/`) },
] as const;

export function ClientBottomNav() {
  const { pathname } = useLocation();
  const onMasterProfile = /^\/master\/[^/]+/.test(pathname);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom,0px))] lg:hidden">
      <nav
        className="pointer-events-auto flex h-[72px] w-full max-w-lg items-stretch gap-1 rounded-[26px] border border-white/90 bg-white/95 px-1.5 py-1.5 shadow-[0_16px_44px_rgba(17,24,39,0.14)] backdrop-blur-xl"
        aria-label="Клиентский каталог"
      >
        {TABS.map(({ to, label, Icon, match }) => {
          const active =
            to === MASTERS_PATH
              ? match(pathname) || onMasterProfile
              : match(pathname);

          return (
            <NavLink
              key={to}
              to={to}
              end={to === MASTERS_PATH}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-1.5 transition duration-200 active:scale-[0.96] ${
                active
                  ? 'bg-[#F47C8C] text-white shadow-[0_4px_14px_rgba(244,124,140,0.35)]'
                  : 'text-[#9CA3AF] hover:bg-[#FAFAFA] hover:text-[#6B7280]'
              }`}
            >
              <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
              <span
                className={`max-w-full truncate text-[10px] font-bold leading-none sm:text-[11px] ${
                  active ? 'text-white' : ''
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
