import type { ReactNode } from 'react';
import { HiBellAlert, HiInbox, HiCheckBadge } from 'react-icons/hi2';
import { OverviewKpiCarousel } from '../overview/OverviewKpiBlocks';
import { NOTIFICATIONS_GRADIENT, notificationsDesktopCard } from './adminNotificationsTheme';
import { NotificationsKpiStatCard } from './NotificationsKpiStatCard';

type Props = {
  unreadCount: number;
  totalCount: number;
};

function HeroShell({ children, hero }: { children: ReactNode; hero: ReactNode }) {
  return (
    <div className={`overflow-hidden ${notificationsDesktopCard}`}>
      {hero}
      <div className="bg-white px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </div>
  );
}

export function NotificationsDesktopHero({ unreadCount, totalCount }: Props) {
  const readCount = Math.max(0, totalCount - unreadCount);
  const subtitle =
    unreadCount === 0
      ? 'Все прочитаны — новые появятся здесь'
      : unreadCount === 1
        ? '1 непрочитанное'
        : `${unreadCount} непрочитанных`;

  return (
    <HeroShell
      hero={
        <section className={`relative overflow-hidden ${NOTIFICATIONS_GRADIENT} p-6 text-white lg:p-7`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ff8aa0]/35 blur-3xl" />
          <div className="relative min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[14px] font-black">
              <HiBellAlert className="h-4 w-4" aria-hidden />
              Уведомления
            </p>
            <p className="mt-6 text-[52px] font-black leading-none tabular-nums tracking-[-0.08em] lg:text-[64px]">
              {unreadCount}
            </p>
            <p className="mt-2 text-[15px] font-bold text-white/85">{subtitle}</p>

          </div>
        </section>
      }
    >
      <OverviewKpiCarousel>
        <NotificationsKpiStatCard
          label="Новые"
          value={String(unreadCount)}
          hint="Ждут просмотра"
          accentValue={unreadCount > 0}
          icon={<HiBellAlert className="h-5 w-5" aria-hidden />}
        />
        <NotificationsKpiStatCard
          label="Всего"
          value={String(totalCount)}
          hint="В ленте"
          icon={<HiInbox className="h-5 w-5" aria-hidden />}
        />
        <NotificationsKpiStatCard
          label="Прочитано"
          value={String(readCount)}
          hint="Уже открыты"
          icon={<HiCheckBadge className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}
