import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { ADMIN_SETTINGS_LOGIN_METHODS_PATH, ADMIN_SETTINGS_SUPPORT_PATH } from '../../../app/paths';
import { IconNavProfile, IconNavSupport } from '../adminCabinetNav';

const TABS: Array<{
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { to: ADMIN_SETTINGS_LOGIN_METHODS_PATH, label: 'Способы входа', Icon: IconNavProfile },
  { to: ADMIN_SETTINGS_SUPPORT_PATH, label: 'Справка', Icon: IconNavSupport },
];

type Props = {
  className?: string;
};

export function SettingsSectionTabs({ className = '' }: Props) {
  return (
    <nav
      className={`flex w-full gap-1 overflow-x-auto rounded-[20px] bg-[#f6f7fb] p-1.5 ring-1 ring-[#EAECEF] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`.trim()}
      aria-label="Разделы настроек"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] px-3 text-[13px] font-bold transition sm:text-[14px] ${
              isActive
                ? 'bg-white text-[#ff5f7a] shadow-[0_4px_14px_rgba(255,95,122,0.12)] ring-1 ring-[#FDE8ED]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`
          }
        >
          <tab.Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
