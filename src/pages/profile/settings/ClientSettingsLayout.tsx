import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { HiArrowLeft, HiBars3 } from 'react-icons/hi2';
import { PROFILE_PATH } from '../../../app/paths';
import {
  ADMIN_DESKTOP_CANVAS,
  adminDesktopCabinetBody,
  adminDesktopCabinetMainColumn,
  adminDesktopCabinetShell,
} from '../../admin/adminCabinetLayout';
import { ClientCabinetMobileShell } from '../clientProfile/ClientCabinetMobileShell';
import { ClientProfileDesktopTopBar } from '../clientProfile/ClientProfileDesktopTopBar';
import { useClientCabinetShellData } from '../clientProfile/useClientCabinetShellData';
import { ClientSettingsIconRail } from './ClientSettingsIconRail';
import { ClientSettingsMobileDrawer } from './ClientSettingsMobileDrawer';
import { ClientSettingsSidebar } from './ClientSettingsSidebar';

export function ClientSettingsLayout() {
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const shell = useClientCabinetShellData();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const mobileBody = (
    <>
      <SettingsBackLink />
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex min-h-10 items-center gap-2 rounded-[12px] border border-[#EAECEF] bg-white px-3 text-[14px] font-semibold text-[#374151]"
        >
          <HiBars3 className="h-5 w-5" aria-hidden />
          Разделы настроек
        </button>
      </div>
      <Outlet />
      <ClientSettingsMobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        search={search}
        onSearchChange={setSearch}
      />
    </>
  );

  const desktopBody = (
    <div className={adminDesktopCabinetMainColumn}>
      <main
        className={`min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-y-contain ${ADMIN_DESKTOP_CANVAS} px-4 py-5 sm:px-6 lg:px-8 lg:py-6 lg:pb-8`}
      >
        <div className="w-full min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );

  return (
    <>
      <ClientCabinetMobileShell>{mobileBody}</ClientCabinetMobileShell>

      <div
        className={`hidden ${adminDesktopCabinetShell} text-[#111827] lg:flex ${ADMIN_DESKTOP_CANVAS}`}
      >
        <ClientProfileDesktopTopBar
          title="Настройки"
          hasNewNotifications={shell.hasNewNotifications}
          notificationCount={shell.notificationCount}
        />

        <div className={adminDesktopCabinetBody}>
          <div className="sticky top-0 hidden h-full max-w-full shrink-0 overflow-x-hidden lg:flex">
            <ClientSettingsIconRail />
            <ClientSettingsSidebar search={search} onSearchChange={setSearch} />
          </div>

          {desktopBody}
        </div>
      </div>
    </>
  );
}

function SettingsBackLink() {
  return (
    <Link
      to={PROFILE_PATH}
      className="mb-5 inline-flex min-h-10 items-center gap-1.5 text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827] lg:hidden"
    >
      <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      Профиль
    </Link>
  );
}
