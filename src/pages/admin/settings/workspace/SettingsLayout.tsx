import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../features/auth/AuthProvider';
import { isPlatformAdmin } from '../../../../features/auth/lib/isPlatformAdmin';
import { useMasterPlanEntitlements } from '../../../../features/billing/useMasterPlanEntitlements';
import { AdminCabinetBurgerMenu } from '../../shared/AdminCabinetBurgerMenu';
import { AdminMobileCabinetHeader } from '../../shared/AdminMobileCabinetHeader';
import { adminMobileTabBarScrollPadClass } from '../../shared/adminMobileTabBarTheme';
import { useAdminNotifications } from '../../notifications/AdminNotificationsContext';
import { useServicesCatalogAttention } from '../../services/useServicesCatalogAttention';
import { SettingsIconRail } from './SettingsIconRail';
import { SettingsMobileDrawer } from './SettingsMobileDrawer';
import { SettingsSidebar } from './SettingsSidebar';
import { SettingsShellProvider } from './settingsShellContext';
import { SETTINGS_WORKSPACE_BG } from './settingsWorkspaceTheme';

export function SettingsLayout() {
  const [search, setSearch] = useState('');
  const [cabinetMenuOpen, setCabinetMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const stickyShellRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { planId } = useMasterPlanEntitlements();
  const { hasUnread, unreadCount } = useAdminNotifications();
  const { profile } = useAuth();
  const servicesNeedAttention = useServicesCatalogAttention();
  const showPlatformAdmin = isPlatformAdmin(profile);

  const closeCabinetMenu = useCallback(() => setCabinetMenuOpen(false), []);
  const closeSettingsMenu = useCallback(() => setSettingsMenuOpen(false), []);
  const openSettingsMenu = useCallback(() => setSettingsMenuOpen(true), []);

  useLayoutEffect(() => {
    const el = stickyShellRef.current;
    if (!el) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty('--slotty-admin-header-h', `${el.offsetHeight}px`);
    };

    syncHeaderHeight();
    const ro = new ResizeObserver(syncHeaderHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    main.scrollTop = 0;
    main.scrollLeft = 0;
  }, [pathname]);

  useEffect(() => {
    if (!settingsMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsMenuOpen]);

  const mobileTabBarPad = `${adminMobileTabBarScrollPadClass} lg:pb-0`;

  return (
    <SettingsShellProvider openSettingsMenu={openSettingsMenu}>
      <div className={`flex min-h-dvh ${SETTINGS_WORKSPACE_BG} text-[#111827]`}>
        <div className="sticky top-0 hidden h-dvh max-w-full shrink-0 overflow-x-hidden lg:flex">
          <SettingsIconRail />
          <SettingsSidebar search={search} onSearchChange={setSearch} />
        </div>

        <div className={`flex min-h-dvh min-w-0 flex-1 flex-col ${mobileTabBarPad}`}>
          <AdminMobileCabinetHeader
            shellRef={stickyShellRef}
            menuOpen={cabinetMenuOpen}
            onMenuOpen={() => setCabinetMenuOpen(true)}
            menuLabel="Меню разделов"
          />

          <main
            ref={mainRef}
            className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-8"
          >
            <div className="mx-auto w-full max-w-5xl min-w-0 pb-8">
              <Outlet />
            </div>
          </main>
        </div>

        <SettingsMobileDrawer
          open={settingsMenuOpen}
          onClose={closeSettingsMenu}
          search={search}
          onSearchChange={setSearch}
        />

        <AdminCabinetBurgerMenu
          open={cabinetMenuOpen}
          onClose={closeCabinetMenu}
          servicesNeedAttention={servicesNeedAttention}
          hasUnread={hasUnread}
          unreadCount={unreadCount}
          planId={planId}
          showPlatformAdmin={showPlatformAdmin}
        />
      </div>
    </SettingsShellProvider>
  );
}
