import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HiBellAlert, HiCheckBadge, HiCog6Tooth, HiExclamationTriangle, HiSun } from 'react-icons/hi2';
import { MASTER_SETTINGS_NOTIFICATIONS_PATH } from '../../../app/paths';
import {
  notifHeroActionLink,
  notifHeroActionMuted,
  notifHeroSubtitle,
  notificationsDesktopCard,
} from './adminNotificationsTheme';
import { NotificationsKpiStatCard } from './NotificationsKpiStatCard';
import type { MasterNotificationStats } from './masterNotificationModel';

type Props = {
  stats: MasterNotificationStats;
  onMarkAllRead?: () => void;
  mobileFilter?: ReactNode;
};

export function NotificationsDesktopHero({ stats, onMarkAllRead, mobileFilter }: Props) {
  return (
    <section className={`${notificationsDesktopCard} p-4 sm:p-5 lg:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[24px]">
            Уведомления
          </h1>
          <p className={notifHeroSubtitle}>
            Все события по записям, клиентам и напоминаниям
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            to={MASTER_SETTINGS_NOTIFICATIONS_PATH}
            className={`${notifHeroActionMuted} !min-h-9 !px-2.5 sm:!px-3.5`}
            aria-label="Настроить уведомления"
          >
            <HiCog6Tooth className="h-4 w-4 shrink-0 sm:mr-1.5" aria-hidden />
            <span className="hidden sm:inline">Настроить</span>
          </Link>
          {onMarkAllRead ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className={`${notifHeroActionLink} hidden whitespace-nowrap sm:inline-flex`}
            >
              Прочитать все
            </button>
          ) : null}
        </div>
      </div>

      {onMarkAllRead ? (
        <button type="button" onClick={onMarkAllRead} className={`${notifHeroActionLink} mt-3 w-full sm:hidden`}>
          Отметить все как прочитанные
        </button>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
        <NotificationsKpiStatCard
          label="Требуют действия"
          value={String(stats.actionRequired)}
          hint="Нужен ваш ответ"
          accentValue={stats.actionRequired > 0}
          compact
          iconClassName="bg-[#FFF4E8] text-[#EA580C]"
          icon={<HiExclamationTriangle className="h-5 w-5" aria-hidden />}
        />
        <NotificationsKpiStatCard
          label="Новые"
          value={String(stats.unread)}
          hint="Ещё не открыты"
          accentValue={stats.unread > 0}
          compact
          iconClassName="bg-[#FFF1F4] text-[#F47C8C]"
          icon={<HiBellAlert className="h-5 w-5" aria-hidden />}
        />
        <NotificationsKpiStatCard
          label="Сегодня"
          value={String(stats.today)}
          hint="За текущий день"
          compact
          iconClassName="bg-[#EFF6FF] text-[#2563EB]"
          icon={<HiSun className="h-5 w-5" aria-hidden />}
        />
        <NotificationsKpiStatCard
          label="Прочитано"
          value={String(stats.read)}
          hint="Уже просмотрены"
          compact
          iconClassName="bg-[#ECFDF5] text-[#15803D]"
          icon={<HiCheckBadge className="h-5 w-5" aria-hidden />}
        />
      </div>

      {mobileFilter ? (
        <div className="mt-4 border-t border-[#EEEEEE] pt-3 lg:hidden">{mobileFilter}</div>
      ) : null}
    </section>
  );
}
