import { Link, Outlet, useMatch } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import { PROFILE_PATH } from '../../../app/paths';
import { CLIENT_CONTENT_PAD_BOTTOM, CLIENT_HEADER_OFFSET } from '../../client/clientNavConstants';
import { catalogCanvasClass } from '../clientProfile/clientProfileTheme';
import { ClientSettingsSidebar } from './ClientSettingsSidebar';
import {
  settingsCanvasClass,
  settingsContentClass,
  settingsDesktopShellClass,
  settingsLayoutGridClass,
} from './clientSettingsTheme';

export function ClientSettingsLayout() {
  const docMatch = useMatch('/profile/settings/documents/:docId');

  const body = (
    <>
      <SettingsHeader />
      <div className={`mt-6 ${settingsLayoutGridClass}`}>
        {!docMatch ? <ClientSettingsSidebar /> : null}
        <div className={settingsContentClass}>
          <Outlet />
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className={`lg:hidden min-h-dvh ${settingsCanvasClass} ${CLIENT_CONTENT_PAD_BOTTOM} ${CLIENT_HEADER_OFFSET}`}>
        <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-3">{body}</div>
      </div>

      <div className={`hidden lg:block min-h-dvh ${catalogCanvasClass}`}>
        <div className={settingsDesktopShellClass}>{body}</div>
      </div>
    </>
  );
}

function SettingsHeader() {
  return (
    <>
      <Link
        to={PROFILE_PATH}
        className="inline-flex min-h-10 items-center gap-1.5 text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827]"
      >
        <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Профиль
      </Link>
      <h1 className="mt-3 text-[26px] font-bold tracking-[-0.04em] text-[#111827] sm:text-[28px]">Настройки</h1>
    </>
  );
}
