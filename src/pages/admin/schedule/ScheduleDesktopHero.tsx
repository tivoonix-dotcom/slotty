import type { ReactNode } from 'react';
import {
  HiCalendarDays,
  HiClock,
  HiPlusCircle,
  HiRectangleStack,
  HiSparkles,
  HiUser,
} from 'react-icons/hi2';
import { OverviewKpiCarousel, OverviewKpiStatCard } from '../overview/OverviewKpiBlocks';
import { scheduleDesktopCard, SCHEDULE_GRADIENT } from './adminScheduleTheme';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';
import type { SchedulePageTab } from './scheduleTypes';

type Props = {
  tab: SchedulePageTab;
  metrics: ScheduleTabMetrics;
};

function HeroShell({
  children,
  hero,
}: {
  children: ReactNode;
  hero: ReactNode;
}) {
  return (
    <div className={`overflow-hidden ${scheduleDesktopCard}`}>
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
    <section className={`relative overflow-hidden ${SCHEDULE_GRADIENT} p-6 text-white lg:p-8`}>
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

function CreateHero({ metrics }: { metrics: ScheduleTabMetrics['create'] }) {
  const m = metrics;

  return (
    <HeroShell
      hero={
        <HeroBlock
          badgeIcon={<HiPlusCircle className="h-4 w-4" aria-hidden />}
          badge="Создать окна"
          value={String(m.templates)}
          subtitle={m.templates === 1 ? '1 шаблон' : `${m.templates} шаблонов`}
          description="Шаблоны и кнопка «Новое окно» — быстро открывайте слоты для записи клиентов."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          surface="carousel"
          label="Шаблоны"
          value={String(m.templates)}
          hint="Для быстрого добавления"
          icon={<HiSparkles className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Свободных"
          value={String(m.upcomingFree)}
          hint="Окон впереди"
          icon={<HiClock className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Всего окон"
          value={String(m.windowsTotal)}
          hint="В расписании"
          icon={<HiRectangleStack className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Услуг"
          value={String(m.servicesInCatalog)}
          hint="В каталоге"
          icon={<HiPlusCircle className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function CalendarHero({ metrics }: { metrics: ScheduleTabMetrics['calendar'] }) {
  const m = metrics;

  return (
    <HeroShell
      hero={
        <HeroBlock
          badgeIcon={<HiCalendarDays className="h-4 w-4" aria-hidden />}
          badge="Календарь"
          value={String(m.free)}
          subtitle="Свободных окон сейчас"
          description="Смотрите загрузку по дням и открывайте окно одним нажатием."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Окон в календаре"
          icon={<HiCalendarDays className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Свободно"
          value={String(m.free)}
          hint="Можно записать"
          icon={<HiClock className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Занято"
          value={String(m.booked)}
          hint="С записью"
          icon={<HiUser className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Закрыто"
          value={String(m.blocked)}
          hint="Недоступны"
          icon={<HiRectangleStack className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function ListHero({ metrics }: { metrics: ScheduleTabMetrics['list'] }) {
  const m = metrics;

  return (
    <HeroShell
      hero={
        <HeroBlock
          badgeIcon={<HiRectangleStack className="h-4 w-4" aria-hidden />}
          badge="Все окна"
          value={String(m.total)}
          subtitle={m.total === 1 ? '1 окно в списке' : `${m.total} окон в списке`}
          description="Фильтруйте по статусу и дате — редактируйте или удаляйте слоты."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          surface="carousel"
          label="Свободно"
          value={String(m.free)}
          hint="Открыты для записи"
          icon={<HiClock className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Занято"
          value={String(m.booked)}
          hint="Клиент записан"
          icon={<HiUser className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Закрыто"
          value={String(m.blocked)}
          hint="Не для записи"
          icon={<HiRectangleStack className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Все статусы"
          icon={<HiCalendarDays className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

export function ScheduleDesktopHero({ tab, metrics }: Props) {
  switch (tab) {
    case 'calendar':
      return <CalendarHero metrics={metrics.calendar} />;
    case 'list':
      return <ListHero metrics={metrics.list} />;
    default:
      return <CreateHero metrics={metrics.create} />;
  }
}
