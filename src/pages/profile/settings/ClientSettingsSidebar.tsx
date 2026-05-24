import { NavLink, useLocation } from 'react-router-dom';
import {
  PROFILE_SETTINGS_DOCUMENTS_PATH,
  PROFILE_SETTINGS_LOGIN_METHODS_PATH,
  PROFILE_SETTINGS_SUPPORT_PATH,
} from '../../../app/paths';
import {
  settingsSidebarClass,
  settingsSidebarLinkActiveClass,
  settingsSidebarLinkClass,
} from './clientSettingsTheme';

const NAV = [
  { to: PROFILE_SETTINGS_LOGIN_METHODS_PATH, label: 'Способы входа' },
  { to: PROFILE_SETTINGS_SUPPORT_PATH, label: 'Поддержка' },
  { to: PROFILE_SETTINGS_DOCUMENTS_PATH, label: 'Документы' },
] as const;

export function ClientSettingsSidebar() {
  const { pathname } = useLocation();

  return (
    <nav className={settingsSidebarClass} aria-label="Разделы настроек">
      {NAV.map((item) => {
        const active =
          pathname === item.to ||
          (item.to === PROFILE_SETTINGS_DOCUMENTS_PATH &&
            pathname.startsWith(PROFILE_SETTINGS_DOCUMENTS_PATH));

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to !== PROFILE_SETTINGS_DOCUMENTS_PATH}
            className={active ? settingsSidebarLinkActiveClass : settingsSidebarLinkClass}
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
