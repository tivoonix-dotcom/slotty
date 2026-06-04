import { NavLink } from 'react-router-dom';
import { SettingsSearchBox } from './SettingsSearchBox';
import { SettingsSidebarTariffCard } from './SettingsSidebarTariffCard';
import {
  flattenSettingsNavItems,
  SETTINGS_NAV_GROUPS,
  type SettingsNavItem,
} from './settingsNav';
import { settingsNavGroupLabel, settingsNavItemClass, SETTINGS_SIDEBAR_WIDTH } from './settingsWorkspaceTheme';
import { SettingsStatusBadge } from './settingsUi';

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  onNavigate?: () => void;
  className?: string;
};

function filterItems(query: string): SettingsNavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return flattenSettingsNavItems();
  return flattenSettingsNavItems().filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q)),
  );
}

export function SettingsSidebar({ search, onSearchChange, onNavigate, className = '' }: Props) {
  const filtered = filterItems(search);
  const filteredIds = new Set(filtered.map((i) => i.id));

  return (
    <aside
      className={`${SETTINGS_SIDEBAR_WIDTH} flex h-dvh max-h-dvh shrink-0 flex-col border-r border-[#eef0f5] bg-white ${className}`}
      aria-label="Настройки"
    >
      <div className="shrink-0 border-b border-[#eef0f5] px-4 pb-3 pt-5">
        <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#111827]">Настройки</h1>
      </div>
      <SettingsSearchBox value={search} onChange={onSearchChange} />

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {SETTINGS_NAV_GROUPS.map((group) => {
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
                        onClick={onNavigate}
                        className={({ isActive }) => settingsNavItemClass(isActive)}
                        aria-disabled={item.disabled || undefined}
                      >
                        <Icon className="shrink-0 opacity-90" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.badge ? (
                          <SettingsStatusBadge tone="pink">{item.badge}</SettingsStatusBadge>
                        ) : null}
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

      <div className="shrink-0 border-t border-[#EEEEEE] bg-white p-3">
        <SettingsSidebarTariffCard onNavigate={onNavigate} />
      </div>
    </aside>
  );
}
