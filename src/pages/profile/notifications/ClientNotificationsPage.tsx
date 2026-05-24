import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import { PROFILE_PATH } from '../../../app/paths';
import { useMyNotifications } from '../../../features/notifications/useMyNotifications';
import { useAuth } from '../../../features/auth/AuthProvider';
import { NothingFoundCard } from '../../../shared/ui/NothingFoundCard';
import { CLIENT_CONTENT_PAD_BOTTOM, CLIENT_HEADER_OFFSET } from '../../client/clientNavConstants';
import { catalogCanvasClass, catalogDesktopPanel, catalogPrimaryBtn } from '../clientProfile/clientProfileTheme';
import { ClientNotificationCard } from './ClientNotificationCard';
import {
  notificationsBackLinkClass,
  notificationsCanvasClass,
  notificationsCardClass,
  notificationsCardDivider,
  notificationsDesktopShellClass,
  notificationsPageTitleClass,
} from './clientNotificationsTheme';

function NotificationsHeader() {
  return (
    <>
      <Link to={PROFILE_PATH} className={notificationsBackLinkClass}>
        <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Профиль
      </Link>
      <h1 className={`mt-3 ${notificationsPageTitleClass}`}>Уведомления</h1>
    </>
  );
}

function NotificationsListBody({
  loading,
  error,
  notifications,
  onReload,
}: {
  loading: boolean;
  error: string | null;
  notifications: ReturnType<typeof useMyNotifications>['notifications'];
  onReload: (opts?: { quiet?: boolean }) => void;
}) {
  if (error) {
    return (
      <div className="space-y-3">
        <p className="rounded-[10px] bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">{error}</p>
        <button type="button" onClick={onReload} className={catalogPrimaryBtn}>
          Повторить
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${catalogDesktopPanel} divide-y divide-[#EEEEEE]`}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="px-5 py-4">
            <div className="h-5 max-w-[12rem] animate-pulse rounded-full bg-[#EBEBEB]" />
            <div className="mt-2 h-4 max-w-[16rem] animate-pulse rounded-full bg-[#EBEBEB]" />
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={catalogDesktopPanel}>
        <div className="p-5">
          <NothingFoundCard
            title="Пока тихо"
            text="Когда появятся новости о записях, они окажутся здесь."
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`${notificationsCardClass} ${notificationsCardDivider}`}>
      {notifications.map((item) => (
        <ClientNotificationCard
          key={item.id}
          item={item}
          onAfterRead={() => void onReload({ quiet: true })}
        />
      ))}
    </div>
  );
}

export function ClientNotificationsPage() {
  const { isAuthenticated, backendConfigured } = useAuth();
  const enabled = isAuthenticated && backendConfigured;
  const { notifications, loading, error, reload } = useMyNotifications(enabled);

  const list = (
    <NotificationsListBody
      loading={loading}
      error={error}
      notifications={notifications}
      onReload={() => void reload()}
    />
  );

  return (
    <>
      <div
        className={`lg:hidden min-h-dvh ${notificationsCanvasClass} ${CLIENT_CONTENT_PAD_BOTTOM} ${CLIENT_HEADER_OFFSET}`}
      >
        <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-3">
          <NotificationsHeader />
          <div className="mt-6">{list}</div>
        </div>
      </div>

      <div className={`hidden lg:block min-h-dvh ${catalogCanvasClass}`}>
        <div className={notificationsDesktopShellClass}>
          <NotificationsHeader />
          <div className="mt-6">{list}</div>
        </div>
      </div>
    </>
  );
}
