import { NavLink, useLocation } from 'react-router-dom';
import { CLIENT_SETTINGS_NAV_GROUPS } from './clientSettingsNav';
import { clientSettingsNavGroupLabel, clientSettingsNavItemClass } from './clientSettingsTheme';

export function ClientSettingsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav className="flex flex-col" aria-label="Разделы настроек">
      {CLIENT_SETTINGS_NAV_GROUPS.map((group) => (
        <div key={group.id}>
          <p className={clientSettingsNavGroupLabel}>{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active =
                item.matchPrefix === true
                  ? pathname === item.to || pathname.startsWith(`${item.to}/`)
                  : pathname === item.to ||
                    (item.id === 'documents' && pathname.startsWith(`${item.to}/`));

              return (
                <li key={item.id}>
                  <NavLink
                    to={item.to}
                    end={!item.matchPrefix}
                    onClick={onNavigate}
                    className={clientSettingsNavItemClass(active)}
                  >
                    <Icon className="shrink-0 opacity-90" />
                    <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
