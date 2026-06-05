import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import { PROFILE_PATH } from '../../../app/paths';
import { useMyNotifications } from '../../../features/notifications/useMyNotifications';
import { useAuth } from '../../../features/auth/AuthProvider';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { CLIENT_CONTENT_PAD_BOTTOM, CLIENT_HEADER_OFFSET } from '../../client/clientNavConstants';
import { catalogCanvasClass } from '../clientProfile/clientProfileTheme';
import { ClientNotificationCard } from './ClientNotificationCard';
import { ClientNotificationDetailSheet } from './ClientNotificationDetailSheet';
import { ClientNotificationsEmptyState } from './ClientNotificationsEmptyState';
import {
  ClientNotificationsFilterBar,
  type ClientNotificationsFilter,
} from './ClientNotificationsFilterBar';
import { ClientNotificationsHero } from './ClientNotificationsHero';
import {
  clientNotificationsBackLinkClass,
  clientNotificationsCanvasClass,
  clientNotificationsDesktopShellClass,
  clientNotificationsErrorBox,
  clientNotificationsLoadingPanel,
  clientNotificationsPrimaryBtn,
} from './clientNotificationsTheme';

function ClientNotificationsPageHeader() {
  return (
    <>
      <Link to={PROFILE_PATH} className={clientNotificationsBackLinkClass}>
        <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Профиль
      </Link>
      <h1 className="mt-3 hidden text-[26px] font-bold tracking-[-0.04em] text-[#111827] lg:block">
        Уведомления
      </h1>
    </>
  );
}

export function ClientNotificationsPage() {
  const { isAuthenticated, backendConfigured } = useAuth();
  const enabled = isAuthenticated && backendConfigured;
  const { notifications, loading, error, reload, markAsRead, markAllAsRead, unreadCount } =
    useMyNotifications(enabled, { audience: 'client' });
  const [filter, setFilter] = useState<ClientNotificationsFilter>('all');
  const [selected, setSelected] = useState<(typeof notifications)[number] | null>(null);

  const selectedItem = useMemo(() => {
    if (!selected) return null;
    return notifications.find((n) => n.id === selected.id) ?? selected;
  }, [notifications, selected]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read_at);
    return notifications;
  }, [filter, notifications]);

  const filterBar =
    !loading && !error && notifications.length > 0 ? (
      <ClientNotificationsFilterBar
        filter={filter}
        onFilter={setFilter}
        unreadCount={unreadCount}
        totalCount={notifications.length}
        onMarkAllRead={unreadCount > 0 ? () => void markAllAsRead() : undefined}
      />
    ) : null;

  const listBody = !enabled ? (
    <ClientNotificationsEmptyState
      title="Войдите в аккаунт"
      text="Уведомления о записях появятся после входа в SLOTTY."
    />
  ) : error ? (
    <div className="space-y-3">
      <p className={clientNotificationsErrorBox}>{error}</p>
      <button type="button" onClick={() => void reload()} className={clientNotificationsPrimaryBtn}>
        Повторить
      </button>
    </div>
  ) : loading ? (
    <div className={clientNotificationsLoadingPanel}>
      <LoadingVideo size="md" />
    </div>
  ) : notifications.length === 0 ? (
    <ClientNotificationsEmptyState
      title="Пока тихо"
      text="Когда появятся новости о записях, они окажутся здесь."
    />
  ) : filtered.length === 0 ? (
    <ClientNotificationsEmptyState
      title="Новых нет"
      text="Все уведомления уже прочитаны — переключитесь на «Все», чтобы увидеть историю."
    />
  ) : (
    <ul className="flex flex-col gap-2.5 lg:gap-3">
      {filtered.map((item, index) => (
        <li key={item.id}>
          <ClientNotificationCard
            item={item}
            index={index}
            onOpen={setSelected}
            onMarkRead={(id) => void markAsRead(id)}
          />
        </li>
      ))}
    </ul>
  );

  const content = (
    <div className="space-y-4 lg:space-y-5">
      <ClientNotificationsHero unreadCount={unreadCount} totalCount={notifications.length} />
      {filterBar}
      {listBody}
    </div>
  );

  return (
    <>
      <div
        className={`lg:hidden min-h-dvh ${clientNotificationsCanvasClass} ${CLIENT_CONTENT_PAD_BOTTOM} ${CLIENT_HEADER_OFFSET}`}
      >
        <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-3">
          <ClientNotificationsPageHeader />
          <div className="mt-4">{content}</div>
        </div>
      </div>

      <div className={`hidden lg:block min-h-dvh ${catalogCanvasClass}`}>
        <div className={clientNotificationsDesktopShellClass}>
          <ClientNotificationsPageHeader />
          <div className="mt-6">{content}</div>
        </div>
      </div>

      <ClientNotificationDetailSheet
        item={selectedItem}
        onClose={() => setSelected(null)}
        onMarkRead={(id) => void markAsRead(id)}
      />
    </>
  );
}
