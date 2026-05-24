import { useMemo, useState } from 'react';
import { HiBellAlert } from 'react-icons/hi2';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { AdminNotificationCard } from './AdminNotificationCard';
import { useAdminNotifications } from './AdminNotificationsContext';
import {
  NOTIFICATIONS_PAGE_BG,
  notifListTray,
  notifPinkBtn,
  notificationsShellCard,
} from './adminNotificationsTheme';
import { NotificationsDesktopHero } from './NotificationsDesktopHero';
import { NotificationsEmptyState } from './NotificationsEmptyState';
import { NotificationsFilterBar, type NotificationsFilter } from './NotificationsFilterBar';
import { NotificationsMobileHeader } from './NotificationsMobileHeader';

export function AdminNotificationsPage() {
  const { useCabinetApi } = useAdminMasterCabinet();
  const { notifications, loading, error, reload, unreadCount } = useAdminNotifications();
  const [filter, setFilter] = useState<NotificationsFilter>('all');

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read_at);
    return notifications;
  }, [filter, notifications]);

  const content = !useCabinetApi ? (
    <NotificationsEmptyState
      title="Нужен аккаунт мастера"
      text="Уведомления приходят с сервера после входа в кабинет с подключённым API."
    />
  ) : error ? (
    <div className="space-y-3">
      <p className="rounded-[20px] border border-[#FECACA] bg-[#FFF0F0] px-4 py-3 text-center text-[14px] font-semibold text-[#9B2C2C]">
        {error}
      </p>
      <button type="button" onClick={() => void reload()} className={notifPinkBtn}>
        Повторить
      </button>
    </div>
  ) : loading ? (
    <div className="flex min-h-[12rem] items-center justify-center rounded-[22px] border border-[#FDE8ED] bg-white py-10 shadow-[0_8px_28px_rgba(255,95,122,0.06)]">
      <LoadingVideo size="md" />
    </div>
  ) : notifications.length === 0 ? (
    <NotificationsEmptyState
      title="Пока тихо"
      text="Когда появятся новости о записях и кабинете, они окажутся здесь."
      icon={
        <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_10px_28px_rgba(255,95,122,0.32)]">
          <HiBellAlert className="h-8 w-8" aria-hidden />
        </span>
      }
    />
  ) : filtered.length === 0 ? (
    <NotificationsEmptyState
      title="Новых нет"
      text="Все уведомления уже прочитаны — переключитесь на «Все», чтобы увидеть историю."
    />
  ) : (
    <ul className="flex flex-col gap-2.5 lg:gap-3">
      {filtered.map((item, index) => (
        <li key={item.id}>
          <AdminNotificationCard item={item} index={index} onAfterRead={() => void reload({ quiet: true })} />
        </li>
      ))}
    </ul>
  );

  const filterBar =
    useCabinetApi && !loading && !error && notifications.length > 0 ? (
      <div className={notifListTray}>
        <NotificationsFilterBar
          filter={filter}
          onFilter={setFilter}
          unreadCount={unreadCount}
          totalCount={notifications.length}
        />
      </div>
    ) : null;

  const mobileBody = (
    <section
      className={`-mx-4 min-w-0 space-y-4 overflow-x-hidden px-4 pb-8 lg:hidden ${NOTIFICATIONS_PAGE_BG}`}
    >
      <NotificationsMobileHeader unreadCount={unreadCount} />
      {filterBar}
      {content}
    </section>
  );

  const desktopBody = (
    <div className={`${notificationsShellCard} space-y-5`}>
      <NotificationsDesktopHero unreadCount={unreadCount} totalCount={notifications.length} />
      {filterBar}
      <div className="min-w-0">{content}</div>
    </div>
  );

  return (
    <>
      {mobileBody}
      {desktopBody}
    </>
  );
}
