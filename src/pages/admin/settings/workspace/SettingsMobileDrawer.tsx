import { useEffect, useRef, useState } from 'react';
import { HiArrowLeft, HiChevronRight, HiSparkles } from 'react-icons/hi2';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { MASTER_SETTINGS_PATH, PLATFORM_ADMIN_PATH } from '../../../../app/paths';
import { useAuth } from '../../../../features/auth/AuthProvider';
import { isPlatformAdmin } from '../../../../features/auth/lib/isPlatformAdmin';
import { useAdminNotifications } from '../../notifications/AdminNotificationsContext';
import { AdminBottomSheet } from '../../shared/AdminBottomSheet';
import {
  ADMIN_BILLING_NAV,
  ADMIN_MAIN_NAV,
  ADMIN_NOTIFICATIONS_NAV,
  ADMIN_SETTINGS_NAV,
  type AdminNavItem,
  AdminCabinetNavLink,
} from '../../adminCabinetNav';
import { SettingsSearchBox } from './SettingsSearchBox';
import { SettingsSidebarTariffCard } from './SettingsSidebarTariffCard';
import {
  flattenSettingsNavItems,
  SETTINGS_NAV_GROUPS,
  type SettingsNavItem,
} from './settingsNav';
import { settingsNavGroupLabel } from './settingsWorkspaceTheme';
import { SettingsStatusBadge } from './settingsUi';

type Panel = 'cabinet' | 'settings';

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
  return `flex min-h-[44px] w-full items-center rounded-[10px] px-3 py-2.5 text-left text-[15px] transition ${
    active
      ? 'bg-[#F1EFEF] font-semibold text-[#111827]'
      : 'font-medium text-[#374151] hover:bg-[#FAFAFA]'
  }`;
}

function cabinetNavClass(active: boolean): string {
  return `flex min-h-12 w-full items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left transition active:scale-[0.99] ${
    active ? 'bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.25)]' : 'bg-[#F1EFEF] text-neutral-900'
  }`;
}

function CabinetNavRow({
  item,
  onNavigate,
  trailing,
}: {
  item: AdminNavItem;
  onNavigate: () => void;
  trailing?: React.ReactNode;
}) {
  const Icon = item.icon;
  return (
    <AdminCabinetNavLink
      item={item}
      onClick={onNavigate}
      className={(isActive) => cabinetNavClass(isActive)}
    >
      {() => (
        <>
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <Icon className="h-5 w-5 shrink-0 opacity-95" />
            <span className="truncate text-[15px] font-semibold">{item.label}</span>
          </span>
          {trailing}
        </>
      )}
    </AdminCabinetNavLink>
  );
}

function SettingsMobileCabinetPanel({
  onClose,
  onOpenSettings,
}: {
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  const { profile } = useAuth();
  const { hasUnread, unreadCount } = useAdminNotifications();
  const showPlatformAdmin = isPlatformAdmin(profile);

  return (
    <nav className="flex flex-col gap-2 pb-1" aria-label="Разделы кабинета">
      {ADMIN_MAIN_NAV.map((item) => (
        <CabinetNavRow key={item.to} item={item} onNavigate={onClose} />
      ))}

      <CabinetNavRow
        item={ADMIN_NOTIFICATIONS_NAV}
        onNavigate={onClose}
        trailing={
          hasUnread ? (
            <span className="rounded-full bg-[#ff5f7a] px-2 py-0.5 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null
        }
      />
      <CabinetNavRow item={ADMIN_BILLING_NAV} onNavigate={onClose} />

      <button
        type="button"
        onClick={onOpenSettings}
        className="flex min-h-12 w-full items-center gap-3 rounded-[18px] bg-[#FFF1F4] px-4 py-3 text-left text-[15px] font-semibold text-[#ff5f7a] transition hover:bg-[#FFE8EE] active:scale-[0.99]"
      >
        <ADMIN_SETTINGS_NAV.icon className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{ADMIN_SETTINGS_NAV.label}</span>
        <HiChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      </button>

      {showPlatformAdmin ? (
        <NavLink
          to={PLATFORM_ADMIN_PATH}
          onClick={onClose}
          className={({ isActive }) => cabinetNavClass(isActive)}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <HiSparkles className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate text-[15px] font-semibold">Админка SLOTTY</span>
          </span>
        </NavLink>
      ) : null}
    </nav>
  );
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
          <div key={group.id}>
            <p className={settingsNavGroupLabel}>{group.label}</p>
            <ul className="space-y-0.5">
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
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <SettingsStatusBadge tone="pink">{item.badge}</SettingsStatusBadge>
                      ) : null}
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

function SettingsSheetHeader({
  panel,
  onBack,
  onNavigateHome,
}: {
  panel: Panel;
  onBack: () => void;
  onNavigateHome: () => void;
}) {
  if (panel === 'settings') {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f6f7fb] text-[#6B7280] transition hover:bg-[#FFF1F4] hover:text-[#ff5f7a] active:scale-[0.97]"
          aria-label="Разделы кабинета"
        >
          <HiArrowLeft className="h-5 w-5" />
        </button>
        <h2
          id="admin-sheet-title"
          className="min-w-0 flex-1 truncate font-black tracking-[-0.04em] text-[#111827] text-[20px] leading-tight"
        >
          Настройки
        </h2>
        <Link
          to={MASTER_SETTINGS_PATH}
          onClick={onNavigateHome}
          className="shrink-0 text-[13px] font-semibold text-[#ff5f7a]"
        >
          Главная
        </Link>
      </div>
    );
  }

  return (
    <h2
      id="admin-sheet-title"
      className="font-black tracking-[-0.04em] text-[#111827] text-[20px] leading-tight"
    >
      Разделы кабинета
    </h2>
  );
}

export function SettingsMobileDrawer({ open, onClose, search, onSearchChange }: Props) {
  const [panel, setPanel] = useState<Panel>('settings');
  const location = useLocation();

  useEffect(() => {
    if (open) setPanel('settings');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (panel === 'settings') onClose();
        else setPanel('settings');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, panel, onClose]);

  const prevPathnameRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathnameRef.current === location.pathname) return;
    prevPathnameRef.current = location.pathname;
    onClose();
  }, [location.pathname, onClose]);

  if (typeof document === 'undefined') return null;

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      headerContent={
        <SettingsSheetHeader
          panel={panel}
          onBack={() => setPanel('cabinet')}
          onNavigateHome={onClose}
        />
      }
      headerAfter={
        panel === 'settings' ? (
          <SettingsSearchBox value={search} onChange={onSearchChange} />
        ) : undefined
      }
      footer={
        panel === 'settings' ? (
          <SettingsSidebarTariffCard onNavigate={onClose} />
        ) : undefined
      }
    >
      {panel === 'cabinet' ? (
        <SettingsMobileCabinetPanel
          onClose={onClose}
          onOpenSettings={() => setPanel('settings')}
        />
      ) : (
        <SettingsMobileSettingsNav search={search} onNavigate={onClose} />
      )}
    </AdminBottomSheet>
  );
}
