import { NavLink } from 'react-router-dom';
import { SettingsSearchBox } from '../../admin/settings/workspace/SettingsSearchBox';
import {
  settingsNavGroupLabel,
  settingsNavItemClass,
  SETTINGS_SIDEBAR_WIDTH,
} from '../../admin/settings/workspace/settingsWorkspaceTheme';
import {
  CLIENT_SETTINGS_NAV_GROUPS,
  flattenClientSettingsNavItems,
  type ClientSettingsNavItem,
} from './clientSettingsNav';

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  onNavigate?: () => void;
  className?: string;
};

function filterItems(query: string): ClientSettingsNavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return flattenClientSettingsNavItems();
  return flattenClientSettingsNavItems().filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q)),
  );
}

export function ClientSettingsSidebar({ search, onSearchChange, onNavigate, className = '' }: Props) {
  const filtered = filterItems(search);
  const filteredIds = new Set(filtered.map((i) => i.id));

  return (
    <aside
      className={`${SETTINGS_SIDEBAR_WIDTH} flex h-full max-h-full shrink-0 flex-col overflow-hidden border-r border-[#eef0f5] bg-white ${className}`}
      aria-label="Настройки клиента"
    >
      <div className="shrink-0 border-b border-[#eef0f5] pt-4">
        <SettingsSearchBox value={search} onChange={onSearchChange} placeholder="Поиск настроек" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {CLIENT_SETTINGS_NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => filteredIds.has(i.id));
          if (!items.length) return null;

          return (
            <div key={group.id}>
              <p className={settingsNavGroupLabel}>{group.label}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.to}
                        end={!item.matchPrefix}
                        onClick={onNavigate}
                        className={({ isActive }) => settingsNavItemClass(isActive)}
                      >
                        <Icon className="shrink-0 opacity-90" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-[14px] text-[#9CA3AF]">Ничего не найдено</p>
        ) : null}
      </nav>
    </aside>
  );
}
