import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isClientCabinetMobileTabRoute } from './clientCabinetMobileTabs';
import { ADMIN_CABINET_SHELL_MAX } from '../../admin/overview/adminOverviewTheme';
import { ClientCabinetMobileMenu } from './ClientCabinetMobileMenu';
import { ClientMobileCabinetHeader } from './ClientMobileCabinetHeader';
import { ClientProfileMobileTabBar } from './ClientProfileMobileTabBar';
import type { ClientProfileMainTab } from './clientCabinetMobileTabs';
import {
  CLIENT_CABINET_MOBILE_TAB_BAR_HEIGHT,
  clientCabinetMobileCanvasClass,
} from './clientCabinetMobileTheme';
import { useClientCabinetShellData } from './useClientCabinetShellData';

type Props = {
  children: ReactNode;
  /** Нижние табы кабинета (главная /profile и /profile/notifications). */
  showMainTabs?: boolean;
  mainTab?: ClientProfileMainTab;
  onSelectTab?: (tab: ClientProfileMainTab) => void;
  upcomingCount?: number;
  favoritesCount?: number;
  grayCanvas?: boolean;
};

export function ClientCabinetMobileShell({
  children,
  showMainTabs = false,
  mainTab = 'appointments',
  onSelectTab,
  upcomingCount = 0,
  favoritesCount = 0,
  grayCanvas = true,
}: Props) {
  const { pathname } = useLocation();
  const shell = useClientCabinetShellData();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const tabsVisible = showMainTabs && isClientCabinetMobileTabRoute(pathname) && Boolean(onSelectTab);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty('--slotty-client-mobile-header-h', `${el.offsetHeight}px`);
    };

    syncHeaderHeight();
    const ro = new ResizeObserver(syncHeaderHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shellPadBottom = tabsVisible
    ? `pb-[calc(${CLIENT_CABINET_MOBILE_TAB_BAR_HEIGHT}+1.25rem+env(safe-area-inset-bottom,0px))]`
    : 'pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]';

  return (
    <div
      className={`lg:hidden flex h-dvh min-h-0 min-w-0 flex-col overflow-x-clip text-[#111827] ${
        grayCanvas ? clientCabinetMobileCanvasClass : 'bg-white'
      }`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        <ClientMobileCabinetHeader
          shellRef={headerRef}
          menuOpen={menuOpen}
          onMenuOpen={() => setMenuOpen(true)}
          hasNewNotifications={shell.hasNewNotifications}
          notificationCount={shell.notificationCount}
        />

        <div
          className={`mx-auto w-full min-w-0 ${ADMIN_CABINET_SHELL_MAX} ${shellPadBottom} px-3 pt-3 sm:px-4 sm:pt-4 ${
            grayCanvas ? 'max-lg:bg-transparent' : ''
          }`}
        >
          {children}
        </div>
      </div>

      {tabsVisible ? <ClientProfileMobileTabBar active={mainTab} onChange={onSelectTab!} /> : null}

      <ClientCabinetMobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isMasterCabinet={shell.isMasterCabinet}
        hasNewNotifications={shell.hasNewNotifications}
        upcomingCount={upcomingCount}
        favoritesCount={favoritesCount}
      />
    </div>
  );
}
