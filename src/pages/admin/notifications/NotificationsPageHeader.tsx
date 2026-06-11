import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_PATH } from '../../../app/paths';
import { NotificationsSummary } from './NotificationsSummary';
import type { MasterNotificationStats } from './masterNotificationModel';
import { notificationsSummaryCopy } from './notificationsTabSummaryModel';

type Props = {
  stats: MasterNotificationStats;
  loading?: boolean;
  onMarkAllRead?: () => void;
  mobileFilter?: ReactNode;
  mobileFiltersPanel?: ReactNode;
  desktopFiltersPanel?: ReactNode;
};

export function NotificationsPageHeader({
  stats,
  loading,
  onMarkAllRead,
  mobileFilter,
  mobileFiltersPanel,
  desktopFiltersPanel,
}: Props) {
  const copy = notificationsSummaryCopy(stats);

  return (
    <div className="space-y-3">
      <Link
        to={ADMIN_PATH}
        className="inline-flex min-h-10 items-center text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827] lg:hidden"
      >
        ← Профиль мастера
      </Link>
      <NotificationsSummary
        stats={stats}
        loading={loading}
        onMarkAllRead={onMarkAllRead}
        mobileHeader={copy}
        mobileFilter={mobileFilter}
        mobileFiltersPanel={mobileFiltersPanel}
        desktopFiltersPanel={desktopFiltersPanel}
      />
    </div>
  );
}