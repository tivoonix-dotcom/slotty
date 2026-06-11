import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiBellAlert } from 'react-icons/hi2';
import { afterBookingMutation } from '../../../features/appointments/bookingDataSync';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { AdminNotificationDetailSheet } from './AdminNotificationDetailSheet';
import { useAdminNotifications } from './AdminNotificationsContext';
import {
  NOTIFICATIONS_PAGE_BG,
  NOTIFICATIONS_TAB_BAR_SCROLL_PAD,
  notifCardShell,
  notifEmptyIcon,
  notifPinkBtn,
  notificationsShellCard,
} from './adminNotificationsTheme';
import { NotificationsEmptyState } from './NotificationsEmptyState';
import { NotificationsFilterBar, type NotificationsFilter } from './NotificationsFilterBar';
import { NotificationsListSkeleton } from './NotificationsListSkeleton';
import { NotificationsPageHeader } from './NotificationsPageHeader';
import { NotificationsTimeGroup } from './NotificationsTimeGroup';
import {
  computeMasterNotificationStats,
  groupMasterNotificationsByTime,
  matchesMasterNotificationFilter,
} from './masterNotificationModel';

const FILTER_EMPTY: Record<NotificationsFilter, { title: string; text: string }> = {
  all: {
    title: 'Пока тихо',
    text: 'Когда появятся новости о записях и кабинете, они окажутся здесь.',
  },
  action_required: {
    title: 'Всё под контролем',
    text: 'Нет уведомлений, которые требуют вашего ответа прямо сейчас.',
  },
  appointments: {
    title: 'Записей нет',
    text: 'Уведомления о заявках и визитах появятся здесь.',
  },
  reminders: {
    title: 'Напоминаний нет',
    text: 'Напоминания о предстоящих записях и дедлайнах появятся здесь.',
  },
  reviews: {
    title: 'Отзывов пока нет',
    text: 'Когда клиенты оставят отзывы, вы увидите их в этой ленте.',
  },
  cancellations: {
    title: 'Отмен нет',
    text: 'Уведомления об отменённых записях появятся здесь.',
  },
  system: {
    title: 'Системных нет',
    text: 'Сообщения о тарифе, кабинете и поддержке появятся здесь.',
  },
};

const FILTER_PARAM_VALUES = new Set<NotificationsFilter>([
  'all',
  'action_required',
  'appointments',
  'reminders',
  'reviews',
  'cancellations',
  'system',
]);

export function AdminNotificationsPage() {
  const { useCabinetApi } = useAdminMasterCabinet();
  const { notifications, loading, error, reload, markAsRead, markAllAsRead } =
    useAdminNotifications();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<NotificationsFilter>(() => {
    const raw = searchParams.get('filter');
    return raw && FILTER_PARAM_VALUES.has(raw as NotificationsFilter)
      ? (raw as NotificationsFilter)
      : 'all';
  });

  useEffect(() => {
    const raw = searchParams.get('filter');
    if (raw && FILTER_PARAM_VALUES.has(raw as NotificationsFilter)) {
      setFilter(raw as NotificationsFilter);
    }
  }, [searchParams]);
  const [selected, setSelected] = useState<MeNotificationRow | null>(null);

  const stats = useMemo(() => computeMasterNotificationStats(notifications), [notifications]);

  const selectedItem = useMemo(() => {
    if (!selected) return null;
    return notifications.find((n) => n.id === selected.id) ?? selected;
  }, [notifications, selected]);

  const filtered = useMemo(
    () => notifications.filter((n) => matchesMasterNotificationFilter(n, filter)),
    [filter, notifications],
  );

  const grouped = useMemo(() => groupMasterNotificationsByTime(filtered), [filtered]);

  const content = !useCabinetApi ? (
    <NotificationsEmptyState
      title="Нужен аккаунт мастера"
      text="Уведомления приходят с сервера после входа в кабинет с подключённым API."
    />
  ) : error ? (
    <section className={`${notifCardShell} flex flex-col items-center px-6 py-8 text-center`}>
      <p className="text-[16px] font-bold tracking-[-0.02em] text-[#111827]">Не удалось загрузить</p>
      <p className="mt-2 max-w-[20rem] text-[14px] leading-relaxed text-[#6B7280]">{error}</p>
      <button type="button" onClick={() => void reload()} className={`${notifPinkBtn} mt-5 w-full max-w-[14rem]`}>
        Повторить
      </button>
    </section>
  ) : loading ? (
    <NotificationsListSkeleton />
  ) : notifications.length === 0 ? (
    <NotificationsEmptyState
      title={FILTER_EMPTY.all.title}
      text={FILTER_EMPTY.all.text}
      icon={
        <span className={notifEmptyIcon}>
          <HiBellAlert className="h-8 w-8" aria-hidden />
        </span>
      }
    />
  ) : filtered.length === 0 ? (
    <NotificationsEmptyState
      title={FILTER_EMPTY[filter].title}
      text={FILTER_EMPTY[filter].text}
    />
  ) : (
    <div className="space-y-3 lg:space-y-5">
      {grouped.map((group, groupIndex) => {
        const startIndex = grouped
          .slice(0, groupIndex)
          .reduce((sum, g) => sum + g.items.length, 0);
        return (
          <NotificationsTimeGroup
            key={`${group.id}-${group.label}`}
            group={group}
            startIndex={startIndex}
            onOpen={setSelected}
            onMarkRead={(id) => void markAsRead(id)}
          />
        );
      })}
    </div>
  );

  const showFilters = useCabinetApi && !loading && !error && notifications.length > 0;
  const filterBar = showFilters ? (
    <NotificationsFilterBar filter={filter} onFilter={setFilter} notifications={notifications} />
  ) : null;

  const markAllRead = stats.unread > 0 ? () => void markAllAsRead() : undefined;

  const summaryBlock = (
    <NotificationsPageHeader
      stats={stats}
      loading={loading}
      onMarkAllRead={markAllRead}
      mobileFiltersPanel={filterBar}
      desktopFiltersPanel={filterBar}
    />
  );

  const mobileBody = (
    <section
      className={`-mx-4 min-w-0 space-y-3 px-4 ${NOTIFICATIONS_TAB_BAR_SCROLL_PAD} lg:hidden ${NOTIFICATIONS_PAGE_BG}`}
    >
      {summaryBlock}
      {content}
    </section>
  );

  const desktopBody = (
    <div className={`${notificationsShellCard} space-y-5`}>
      {summaryBlock}
      <div className="min-w-0">{content}</div>
    </div>
  );

  return (
    <>
      {mobileBody}
      {desktopBody}
      <AdminNotificationDetailSheet
        item={selectedItem}
        onClose={() => setSelected(null)}
        onMarkRead={(id) => void markAsRead(id)}
        onBookingAction={async () => {
          afterBookingMutation();
          await reload({ quiet: true });
        }}
      />
    </>
  );
}
