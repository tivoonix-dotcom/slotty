import type { ReactNode } from 'react';
import { HiArchiveBox, HiCalendarDays, HiInbox } from 'react-icons/hi2';
import { OverviewKpiCarousel } from '../overview/OverviewKpiBlocks';
import { appointmentsDesktopCard, APPOINTMENTS_GRADIENT } from './adminAppointmentsTheme';
import { AppointmentsKpiStatCard } from './AppointmentsKpiStatCard';
import type { AppointmentsTabId } from './appointmentsTypes';

export type AppointmentsTabStats = {
  requests: number;
  upcoming: number;
  history: number;
};

type Props = {
  tab: AppointmentsTabId;
  stats: AppointmentsTabStats;
};

function HeroShell({ children, hero }: { children: ReactNode; hero: ReactNode }) {
  return (
    <div className={`overflow-hidden ${appointmentsDesktopCard}`}>
      {hero}
      <div className="bg-white px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </div>
  );
}

function HeroBlock({
  badgeIcon,
  badge,
  value,
  subtitle,
  description,
}: {
  badgeIcon: ReactNode;
  badge: string;
  value: string;
  subtitle: string;
  description: string;
}) {
  return (
    <section className={`relative overflow-hidden ${APPOINTMENTS_GRADIENT} p-6 text-white lg:p-8`}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff8aa0]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#ff5f7a]/20 blur-3xl" />
      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[14px] font-black text-white">
          {badgeIcon}
          {badge}
        </p>
        <p className="mt-8 text-[52px] font-black leading-none tabular-nums tracking-[-0.08em] text-white lg:text-[72px]">
          {value}
        </p>
        <p className="mt-3 text-[15px] font-bold text-white/80">{subtitle}</p>
        <p className="mt-6 max-w-[660px] text-[17px] font-semibold leading-8 text-white/82">
          {description}
        </p>
      </div>
    </section>
  );
}

function KpiStrip({ stats, tab }: { stats: AppointmentsTabStats; tab: AppointmentsTabId }) {
  return (
    <OverviewKpiCarousel>
      <AppointmentsKpiStatCard
        label="Заявки"
        value={String(stats.requests)}
        hint="Ждут ответа"
        accentValue={tab === 'requests' && stats.requests > 0}
        icon={<HiInbox className="h-5 w-5" aria-hidden />}
      />
      <AppointmentsKpiStatCard
        label="Предстоящие"
        value={String(stats.upcoming)}
        hint="Подтверждены"
        accentValue={tab === 'upcoming' && stats.upcoming > 0}
        icon={<HiCalendarDays className="h-5 w-5" aria-hidden />}
      />
      <AppointmentsKpiStatCard
        label="История"
        value={String(stats.history)}
        hint="Завершено и отменено"
        accentValue={tab === 'history' && stats.history > 0}
        icon={<HiArchiveBox className="h-5 w-5" aria-hidden />}
      />
    </OverviewKpiCarousel>
  );
}

export function AppointmentsDesktopHero({ tab, stats }: Props) {
  const s = stats;

  if (tab === 'requests') {
    return (
      <HeroShell
        hero={
          <HeroBlock
            badgeIcon={<HiInbox className="h-4 w-4" aria-hidden />}
            badge="Заявки"
            value={String(s.requests)}
            subtitle={s.requests === 1 ? '1 новая заявка' : `${s.requests} новых заявок`}
            description="Подтвердите или отклоните — клиент сразу увидит статус записи."
          />
        }
      >
        <KpiStrip stats={stats} tab={tab} />
      </HeroShell>
    );
  }

  if (tab === 'upcoming') {
    return (
      <HeroShell
        hero={
          <HeroBlock
            badgeIcon={<HiCalendarDays className="h-4 w-4" aria-hidden />}
            badge="Предстоящие"
            value={String(s.upcoming)}
            subtitle={s.upcoming === 1 ? '1 запись впереди' : `${s.upcoming} записей впереди`}
            description="Ближайший визит и весь список — откройте карточку для деталей."
          />
        }
      >
        <KpiStrip stats={stats} tab={tab} />
      </HeroShell>
    );
  }

  return (
    <HeroShell
      hero={
        <HeroBlock
          badgeIcon={<HiArchiveBox className="h-4 w-4" aria-hidden />}
          badge="История"
          value={String(s.history)}
          subtitle={s.history === 1 ? '1 запись в архиве' : `${s.history} записей в архиве`}
          description="Завершённые и отменённые визиты — фильтры по услуге, статусу и периоду."
        />
      }
    >
      <KpiStrip stats={stats} tab={tab} />
    </HeroShell>
  );
}
