import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_PATH } from '../../../app/paths';
import { NotificationsDesktopHero } from './NotificationsDesktopHero';
import type { MasterNotificationStats } from './masterNotificationModel';

type Props = {
  stats: MasterNotificationStats;
  onMarkAllRead?: () => void;
  mobileFilter?: ReactNode;
};

export function NotificationsPageHeader({ stats, onMarkAllRead, mobileFilter }: Props) {
  return (
    <div className="space-y-3">
      <Link
        to={ADMIN_PATH}
        className="inline-flex min-h-10 items-center text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827] lg:hidden"
      >
        ← Профиль мастера
      </Link>
      <div className="pb-1 lg:pb-0">
        <NotificationsDesktopHero
          stats={stats}
          onMarkAllRead={onMarkAllRead}
          mobileFilter={mobileFilter}
        />
      </div>
    </div>
  );
}