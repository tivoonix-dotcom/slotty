import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AdminBottomSheet } from '../../shared/AdminBottomSheet';
import { SettingsSearchBox } from './SettingsSearchBox';
import { SettingsSidebarTariffCard } from './SettingsSidebarTariffCard';
import {
  flattenSettingsNavItems,
  SETTINGS_NAV_GROUPS,
  type SettingsNavItem,
} from './settingsNav';
import { settingsNavGroupLabel } from './settingsWorkspaceTheme';
import { SettingsStatusBadge } from './settingsUi';

type Props = {
  open: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (v: string) => void;
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

function mobileMenuItemClass(active: boolean, disabled?: boolean) {
  if (disabled) {
    return 'flex min-h-[44px] w-full items-center rounded-[10px] px-3 py-2.5 text-left text-[15px] font-medium text-[#9CA3AF] opacity-70';
  }
  return `flex min-h-[44px] w-full items-center rounded-[10px] px-3 py-2.5 text-left text-[15px] transition active:scale-[0.99] ${
    active
      ? 'bg-[#F47C8C] font-semibold text-white'
      : 'font-medium text-[#374151] hover:bg-[#FAFAFA]'
  }`;
}

function SettingsMobileSettingsNav({
  search,
  onNavigate,
}: {
  search: string;
  onNavigate: () => void;
}) {
  const filtered = filterItems(search);
  const filteredIds = new Set(filtered.map((i) => i.id));

  return (
    <nav aria-label="Настройки">
      {SETTINGS_NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => filteredIds.has(i.id));
        if (!items.length) return null;
        return (
          <div key={group.id} className="mb-4 last:mb-0">
            <p className={settingsNavGroupLabel}>{group.label}</p>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  {item.disabled ? (
                    <div className={mobileMenuItemClass(false, true)}>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <SettingsStatusBadge tone="pink">{item.badge}</SettingsStatusBadge>
                      ) : null}
                    </div>
                  ) : (
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      className={({ isActive }) => mobileMenuItemClass(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.badge ? (
                            <SettingsStatusBadge tone={isActive ? 'neutral' : 'pink'}>
                              {item.badge}
                            </SettingsStatusBadge>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {filtered.length === 0 ? (
        <p className="px-3 py-6 text-[14px] text-[#9CA3AF]">Ничего не найдено</p>
      ) : null}
    </nav>
  );
}

export function SettingsMobileDrawer({ open, onClose, search, onSearchChange }: Props) {
  const location = useLocation();
  const prevPathnameRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathnameRef.current === location.pathname) return;
    prevPathnameRef.current = location.pathname;
    onClose();
  }, [location.pathname, onClose]);

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title="Настройки"
      variant="catalog"
      borderless
      headerAfter={<SettingsSearchBox value={search} onChange={onSearchChange} />}
      footer={<SettingsSidebarTariffCard onNavigate={onClose} />}
    >
      <SettingsMobileSettingsNav search={search} onNavigate={onClose} />
    </AdminBottomSheet>
  );
}
