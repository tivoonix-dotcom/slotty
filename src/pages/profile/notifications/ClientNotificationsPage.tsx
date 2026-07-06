import { useMemo, useState } from 'react';
import { HiBellAlert } from 'react-icons/hi2';
import { useAuth } from '../../../features/auth/AuthProvider';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import {
  NOTIFICATIONS_PAGE_BG,
  notifCardShell,
  notifEmptyIcon,
  notifPinkBtn,
  notificationsShellCard,
} from '../../admin/notifications/adminNotificationsTheme';
import { NotificationsEmptyState } from '../../admin/notifications/NotificationsEmptyState';
import { NotificationsListSkeleton } from '../../admin/notifications/NotificationsListSkeleton';
import { useClientCabinetMobileTabNav } from '../clientProfile/clientCabinetMobileTabs';
import { ClientCabinetDesktopShell } from '../clientProfile/ClientCabinetDesktopShell';
import { ClientCabinetMobileShell } from '../clientProfile/ClientCabinetMobileShell';
import { ClientNotificationDetailSheet } from './ClientNotificationDetailSheet';
import { ClientNotificationsFilterBar, type ClientNotificationFilter } from './ClientNotificationsFilterBar';
import { ClientNotificationsPageHeader } from './ClientNotificationsPageHeader';
import { ClientNotificationsTimeGroup } from './ClientNotificationsTimeGroup';
import { useClientNotifications } from './ClientNotificationsContext';
import {
  computeClientNotificationStats,
  groupClientNotificationsByTime,
  matchesClientNotificationFilter,
} from './clientNotificationModel';

const FILTER_EMPTY: Record<ClientNotificationFilter, { title: string; text: string }> = {
  all: {
    title: 'Пока тихо',
    text: 'Когда появятся новости о записях, они окажутся здесь.',
  },
  action_required: {
    title: 'Всё под контролем',
    text: 'Нет уведомлений, которые требуют вашего ответа прямо сейчас.',
  },
  appointments: {
    title: 'Записей нет',
    text: 'Уведомления о подтверждениях и визитах появятся здесь.',
  },
  reminders: {
    title: 'Напоминаний нет',
    text: 'Напоминания о предстоящих записях появятся здесь.',
  },
  reviews: {
    title: 'Отзывов пока нет',
    text: 'Когда мастер попросит оставить отзыв, вы увидите это здесь.',
  },
  cancellations: {
    title: 'Отмен нет',
    text: 'Уведомления об отменённых записях появятся здесь.',
  },
  system: {
    title: 'Системных нет',
    text: 'Сообщения о кабинете и поддержке появятся здесь.',
  },
};

export function ClientNotificationsPage() {
  const { isAuthenticated, backendConfigured } = useAuth();
  const enabled = isAuthenticated && backendConfigured;
  const { activeTab, selectTab } = useClientCabinetMobileTabNav();
  const { notifications, initialLoading, error, reload, markAsRead, markAllAsRead } =
    useClientNotifications();
  const [filter, setFilter] = useState<ClientNotificationFilter>('all');
  const [selected, setSelected] = useState<MeNotificationRow | null>(null);

  const stats = useMemo(() => computeClientNotificationStats(notifications), [notifications]);

  const selectedItem = useMemo(() => {
    if (!selected) return null;
    return notifications.find((n) => n.id === selected.id) ?? selected;
  }, [notifications, selected]);

  const filtered = useMemo(
    () => notifications.filter((n) => matchesClientNotificationFilter(n, filter)),
    [filter, notifications],
  );

  const grouped = useMemo(() => groupClientNotificationsByTime(filtered), [filtered]);

  const content = !enabled ? (
    <NotificationsEmptyState
      title="Войдите в аккаунт"
      text="Уведомления о записях появятся после входа в SLOTTY."
    />
  ) : error ? (
    <section className={`${notifCardShell} flex flex-col items-center px-6 py-8 text-center`}>
      <p className="text-[16px] font-bold tracking-[-0.02em] text-[#111827]">Не удалось загрузить</p>
      <p className="mt-2 max-w-[20rem] text-[14px] leading-relaxed text-[#6B7280]">{error}</p>
      <button type="button" onClick={() => void reload()} className={`${notifPinkBtn} mt-5 w-full max-w-[14rem]`}>
        Повторить
      </button>
    </section>
  ) : initialLoading ? (
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
    <NotificationsEmptyState title={FILTER_EMPTY[filter].title} text={FILTER_EMPTY[filter].text} />
  ) : (
    <div className="space-y-3 lg:space-y-5">
      {grouped.map((group, groupIndex) => {
        const startIndex = grouped
          .slice(0, groupIndex)
          .reduce((sum, g) => sum + g.items.length, 0);
        return (
          <ClientNotificationsTimeGroup
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

  const showFilters = enabled && !initialLoading && !error && notifications.length > 0;
  const filterBar = showFilters ? (
    <ClientNotificationsFilterBar filter={filter} onFilter={setFilter} notifications={notifications} />
  ) : null;

  const markAllRead = stats.unread > 0 ? () => void markAllAsRead() : undefined;

  const summaryBlock = (
    <ClientNotificationsPageHeader
      stats={stats}
      loading={initialLoading}
      onMarkAllRead={markAllRead}
      mobileFiltersPanel={filterBar}
      desktopFiltersPanel={filterBar}
    />
  );

  const showMobileSummary =
    enabled && (initialLoading || error || notifications.length > 0);

  const mobileBody = (
    <section
      className={`-mx-4 min-w-0 space-y-3 px-4 pb-[calc(5.75rem+1.25rem+env(safe-area-inset-bottom,0px))] lg:hidden ${NOTIFICATIONS_PAGE_BG}`}
    >
      {showMobileSummary ? summaryBlock : null}
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
      <ClientCabinetMobileShell grayCanvas showMainTabs mainTab={activeTab} onSelectTab={selectTab}>
        {mobileBody}
      </ClientCabinetMobileShell>

      <ClientCabinetDesktopShell title="Уведомления">{desktopBody}</ClientCabinetDesktopShell>

      <ClientNotificationDetailSheet
        item={selectedItem}
        onClose={() => setSelected(null)}
        onMarkRead={(id) => void markAsRead(id)}
      />
    </>
  );
}
