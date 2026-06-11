import type { ReactNode } from 'react';
import { NotificationsSummary } from '../../admin/notifications/NotificationsSummary';
import type { ClientNotificationStats } from './clientNotificationModel';
import { clientNotificationsSummaryCopy } from './clientNotificationsTabSummaryModel';

type Props = {
  stats: ClientNotificationStats;
  loading?: boolean;
  onMarkAllRead?: () => void;
  mobileFilter?: ReactNode;
  mobileFiltersPanel?: ReactNode;
  desktopFiltersPanel?: ReactNode;
};

export function ClientNotificationsPageHeader({
  stats,
  loading,
  onMarkAllRead,
  mobileFilter,
  mobileFiltersPanel,
  desktopFiltersPanel,
}: Props) {
  const copy = clientNotificationsSummaryCopy(stats);

  return (
    <NotificationsSummary
      stats={stats}
      loading={loading}
      onMarkAllRead={onMarkAllRead}
      mobileHeader={copy}
      mobileFilter={mobileFilter}
      mobileFiltersPanel={mobileFiltersPanel}
      desktopFiltersPanel={desktopFiltersPanel}
      settingsTo={null}
      desktopSubtitle="Все события по вашим записям и напоминаниям"
    />
  );
}
