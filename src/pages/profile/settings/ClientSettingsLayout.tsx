import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { HiArrowLeft, HiBars3 } from 'react-icons/hi2';
import { PROFILE_PATH } from '../../../app/paths';
import { CLIENT_CONTENT_PAD_BOTTOM, CLIENT_HEADER_OFFSET } from '../../client/clientNavConstants';
import { ClientSettingsSidebar } from './ClientSettingsSidebar';
import {
  settingsContentClass,
  settingsDesktopShellClass,
  settingsLayoutGridClass,
  settingsSidebarShellClass,
  settingsWorkspaceBg,
} from './clientSettingsTheme';

export function ClientSettingsLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const body = (
    <div className={settingsLayoutGridClass}>
      <aside className={`hidden lg:block ${settingsSidebarShellClass}`}>
        <ClientSettingsSidebar />
      </aside>

      <div className={settingsContentClass}>
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="inline-flex min-h-10 items-center gap-2 rounded-[12px] border border-[#EAECEF] bg-white px-3 text-[14px] font-semibold text-[#374151]"
          >
            <HiBars3 className="h-5 w-5" aria-hidden />
            Разделы настроек
          </button>
          {mobileNavOpen ? (
            <div className={`mt-3 ${settingsSidebarShellClass}`}>
              <ClientSettingsSidebar onNavigate={() => setMobileNavOpen(false)} />
            </div>
          ) : null}
        </div>
        <Outlet />
      </div>
    </div>
  );

  return (
    <>
      <div className={`lg:hidden min-h-dvh ${settingsWorkspaceBg} ${CLIENT_CONTENT_PAD_BOTTOM} ${CLIENT_HEADER_OFFSET}`}>
        <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-3">
          <SettingsBackLink />
          {body}
        </div>
      </div>

      <div className={`hidden lg:block min-h-dvh ${settingsWorkspaceBg}`}>
        <div className={settingsDesktopShellClass}>
          <SettingsBackLink />
          {body}
        </div>
      </div>
    </>
  );
}

function SettingsBackLink() {
  return (
    <Link
      to={PROFILE_PATH}
      className="mb-5 inline-flex min-h-10 items-center gap-1.5 text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827]"
    >
      <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      Профиль
    </Link>
  );
}
