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
import { useTabIntroImage } from '../useTabIntroImage';
import {
  scheduleDesktopCard,
  scheduleKpiCarouselDot,
  scheduleKpiIconCircle,
  SCHEDULE_HERO_BG,
} from './adminScheduleTheme';
import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';
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
  backgroundSrc = SCHEDULE_HERO_BG,
}: {
  badgeIcon: ReactNode;
  badge: string;
  value: string;
  subtitle: string;
  description: string;
  backgroundSrc?: string;
}) {
  const resolvedBackgroundSrc = useTabIntroImage(backgroundSrc);

  return (
    <section className="relative overflow-hidden p-5 text-white lg:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${resolvedBackgroundSrc})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />

      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-black text-white lg:px-4 lg:py-2 lg:text-[14px]">
          {badgeIcon}
          {badge}
        </p>

        <p className="mt-5 text-[32px] font-black leading-none tabular-nums tracking-[-0.08em] text-white lg:mt-8 lg:text-[52px] xl:text-[72px]">
          {value}
        </p>

        <p className="mt-2 text-[13px] font-bold text-white/80 lg:mt-3 lg:text-[15px]">{subtitle}</p>

        <p className="mt-3 max-w-[660px] text-[14px] font-semibold leading-relaxed text-white/82 lg:mt-6 lg:text-[17px] lg:leading-8">
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
          backgroundSrc={SCHEDULE_QUICK_SETUP_IMAGES.listHeroBg}
        />
      }
    >
      <OverviewKpiCarousel indicatorBgClass={scheduleKpiCarouselDot}>
        <OverviewKpiStatCard
          surface="carousel"
          label="Свободно"
          value={String(m.free)}
          hint="Открыты для записи"
          icon={<HiClock className="h-5 w-5" aria-hidden />}
          iconClassName={scheduleKpiIconCircle}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Занято"
          value={String(m.booked)}
          hint="Клиент записан"
          icon={<HiUser className="h-5 w-5" aria-hidden />}
          iconClassName={scheduleKpiIconCircle}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Закрыто"
          value={String(m.blocked)}
          hint="Не для записи"
          icon={<HiRectangleStack className="h-5 w-5" aria-hidden />}
          iconClassName={scheduleKpiIconCircle}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Все статусы"
          icon={<HiCalendarDays className="h-5 w-5" aria-hidden />}
          iconClassName={scheduleKpiIconCircle}
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
