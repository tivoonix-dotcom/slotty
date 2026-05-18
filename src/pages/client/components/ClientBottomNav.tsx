import { NavLink, useLocation } from 'react-router-dom';
import { HiSparkles, HiUserGroup, HiUserCircle } from 'react-icons/hi2';
import { MASTERS_PATH, PROFILE_PATH, SERVICES_PATH } from '../../../app/paths';

const TABS = [
  { to: MASTERS_PATH, label: 'Мастера', Icon: HiUserGroup },
  { to: SERVICES_PATH, label: 'Услуги', Icon: HiSparkles },
  { to: PROFILE_PATH, label: 'Профиль', Icon: HiUserCircle },
] as const;

export function ClientBottomNav() {
  const { pathname } = useLocation();
  const onMasterProfile = /^\/master\/[^/]+/.test(pathname);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
      <nav
        className="pointer-events-auto flex h-[72px] w-full max-w-lg items-stretch gap-1 rounded-[26px] border border-white/90 bg-white/95 px-1.5 py-1.5 shadow-[0_16px_44px_rgba(17,24,39,0.14)] backdrop-blur-xl"
        aria-label="Клиентский каталог"
      >
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === PROFILE_PATH || to === MASTERS_PATH}
            className={({ isActive }) => {
              const active =
                to === MASTERS_PATH ? isActive || onMasterProfile : isActive;
              return `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-1.5 transition duration-200 active:scale-[0.96] ${
                active
                  ? 'bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.10)]'
                  : 'text-[#9CA3AF] hover:bg-[#FAFAFA] hover:text-[#6B7280]'
              }`;
            }}
          >
            {({ isActive }) => {
              const active =
                to === MASTERS_PATH ? isActive || onMasterProfile : isActive;
              return (
                <>
                  <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
                  <span
                    className={`max-w-full truncate text-[10px] font-bold leading-none sm:text-[11px] ${
                      active ? 'text-[#F47C8C]' : ''
                    }`}
                  >
                    {label}
                  </span>
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
