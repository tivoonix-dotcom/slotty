import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfilePath } from '../../../app/paths';
import {
  adminDesktopCabinetBody,
  adminDesktopCabinetMainColumn,
  adminDesktopCabinetShell,
  adminDesktopMainScroll,
  ADMIN_DESKTOP_CANVAS,
  CLIENT_CABINET_DESKTOP_MAIN,
} from '../../admin/adminCabinetLayout';
import {
  ClientProfileDesktopSidebar,
  type ClientProfileMainTab,
} from './ClientProfileDesktopSidebar';
import { ClientProfileDesktopTopBar } from './ClientProfileDesktopTopBar';
import { useClientCabinetShellData } from './useClientCabinetShellData';

type Props = {
  title: string;
  children: ReactNode;
  mainTab?: ClientProfileMainTab | null;
  onSelectTab?: (tab: ClientProfileMainTab) => void;
  upcomingCount?: number;
  favoritesCount?: number;
  /** Полноширинная рабочая зона (настройки, как у мастера). */
  workspace?: boolean;
};

export function ClientCabinetDesktopShell({
  title,
  children,
  mainTab = null,
  onSelectTab,
  upcomingCount = 0,
  favoritesCount = 0,
  workspace = false,
}: Props) {
  const navigate = useNavigate();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const shell = useClientCabinetShellData();

  const handleSelectTab =
    onSelectTab ??
    ((tab: ClientProfileMainTab) => {
      navigate(getProfilePath(tab));
    });

  return (
    <div className={`hidden ${adminDesktopCabinetShell} text-[#111827] lg:flex ${ADMIN_DESKTOP_CANVAS}`}>
      <ClientProfileDesktopTopBar
        title={title}
        hasNewNotifications={shell.hasNewNotifications}
        notificationCount={shell.notificationCount}
      />

      <div className={adminDesktopCabinetBody}>
        <ClientProfileDesktopSidebar
          displayName={shell.displayName}
          roleSubtitle={shell.roleSubtitle}
          profileInitials={shell.profileInitials}
          authLoading={shell.authLoading}
          isAuthenticated={shell.isAuthenticated}
          avatarPreviewUrl={null}
          profileAvatarUrl={shell.profileAvatarUrl}
          telegramPhotoUrl={shell.telegramPhotoUrl}
          avatarBusy={false}
          avatarErr={null}
          avatarFileInputRef={avatarFileInputRef}
          onAvatarFileChange={() => {}}
          telegramUserPhotoUrl={null}
          onApplyTelegramAvatar={() => {}}
          hasNewNotifications={shell.hasNewNotifications}
          mainTab={mainTab}
          onSelectTab={handleSelectTab}
          isMasterCabinet={shell.isMasterCabinet}
          clientShell
          upcomingCount={upcomingCount}
          favoritesCount={favoritesCount}
        />

        <div className={adminDesktopCabinetMainColumn}>
          {workspace ? (
            <div className={`${adminDesktopMainScroll} ${ADMIN_DESKTOP_CANVAS}`}>
              <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
            </div>
          ) : (
            <div className={`${adminDesktopMainScroll} ${ADMIN_DESKTOP_CANVAS} lg:pb-8`}>
              <div className={CLIENT_CABINET_DESKTOP_MAIN}>{children}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
