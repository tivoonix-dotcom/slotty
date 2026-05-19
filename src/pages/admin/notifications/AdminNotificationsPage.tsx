import { ADMIN_PATH } from '../../../app/paths';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { NothingFoundCard } from '../../../shared/ui/NothingFoundCard';
import { AdminSectionLayout } from '../shared/AdminSectionLayout';
import { AdminNotificationCard } from './AdminNotificationCard';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { useAdminNotifications } from './AdminNotificationsContext';

export function AdminNotificationsPage() {
  const { useCabinetApi } = useAdminMasterCabinet();
  const { notifications, loading, error, reload, unreadCount, hasUnread } = useAdminNotifications();

  if (!useCabinetApi) {
    return (
      <AdminSectionLayout
        backHref={ADMIN_PATH}
        backLabel="← Профиль мастера"
        title="Уведомления"
        subtitle="Доступно при входе как мастер с сервером"
      >
        <NothingFoundCard
          title="Нужен аккаунт мастера"
          text="Уведомления приходят с сервера после входа в кабинет с подключённым API."
        />
      </AdminSectionLayout>
    );
  }

  return (
    <AdminSectionLayout
      backHref={ADMIN_PATH}
      backLabel="← Профиль мастера"
      title="Уведомления"
      subtitle={
        hasUnread
          ? `${unreadCount} ${unreadCount === 1 ? 'новое' : 'новых'}`
          : 'Новости о записях и кабинете'
      }
    >
      {error ? (
        <div className="space-y-3">
          <p className="rounded-2xl bg-[#FFF0F0] px-4 py-3 text-center text-[14px] font-semibold text-[#9B2C2C]">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void reload()}
            className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-5 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.99]"
          >
            Повторить
          </button>
        </div>
      ) : loading ? (
        <div className="rounded-[28px] bg-white px-4 py-10 shadow-[0_10px_30px_rgba(17,17,17,0.05)]">
          <LoadingVideo size="md" />
        </div>
      ) : notifications.length === 0 ? (
        <NothingFoundCard
          title="Пока тихо"
          text="Когда появятся новости о записях и кабинете, они окажутся здесь."
        />
      ) : (
        <ul className="flex flex-col gap-2.5 sm:gap-3">
          {notifications.map((item, index) => (
            <li key={item.id}>
              <AdminNotificationCard item={item} index={index} onAfterRead={() => void reload()} />
            </li>
          ))}
        </ul>
      )}
    </AdminSectionLayout>
  );
}
